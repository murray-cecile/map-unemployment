#===============================================================================#
# EXPORT TO JSON
#
# Cecile Murray
#===============================================================================#

libs <- c("here", "tidyverse", "magrittr", "sf", "tidycensus", "jsonlite")
lapply(libs, library, character.only = TRUE)

blskey <- Sys.getenv("BLS_KEY")
# censuskey <- Sys.getenv("CENSUS_KEY")

HERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/jobs"
THERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/map-unemployment/app/data"

setwd(HERE)

#===============================================================================#
# COUNTY POPULATION
#===============================================================================#

ctpop <- get_acs(geography = "county", variable = "B01001_001",
                 geometry = TRUE, shift_geo = TRUE) %>% 
  dplyr::rename(stcofips = GEOID, pop = estimate) %>% 
  filter(!stcofips %in% c("72")) %>% select(-moe) 

ohpop <- ctpop %>% filter(substr(stcofips, 1, 2) == "39")

setwd(THERE)
ctpop %>% select(stcofips, pop) %>% st_drop_geometry() %>% 
  write_json("county-population-2017.json")
ohpop %>% st_drop_geometry() %>% write_json('ohio-pop.json')
setwd(HERE)

#===============================================================================#
# SMOOTHED COUNTY UNEMPLOYMENT
#===============================================================================#

load("raw/cturate_data.Rdata")

# determine month of highest unemployments
cturate <- mutate(cturate_data, stfips = substr(series_id, 6, 7),
                  stcofips = substr(series_id, 6, 10),
                  month = paste0(year, "-", period),
                  quarter = case_when(
                    period %in% c("M01", "M02", "M03") ~ paste0(year, "-", "Q1"),
                    period %in% c("M04", "M05", "M06") ~ paste0(year, "-", "Q2"),
                    period %in% c("M07", "M08", "M09") ~ paste0(year, "-", "Q3"),
                    period %in% c("M10", "M11", "M12") ~ paste0(year, "-", "Q4")
                  )) %>% 
  dplyr::rename(urate = value) %>%  group_by(stcofips) %>% 
  mutate(max_urate = max(urate), is_max = ifelse(urate == max_urate, 1, 0))

annual <- cturate %>% filter(period == "M13") %>% dplyr::rename(ann_urate = urate) %>% 
  select(year, stcofips, ann_urate)

adj_factor <- cturate %>% filter(period != "M13", year < 2019) %>% 
  left_join(annual, by = c("stcofips", "year")) %>% 
  mutate(ann_delta = urate - ann_urate) %>% 
  group_by(period) %>% summarize(month_adj = mean(ann_delta))

adj_cturate <- cturate %>% filter(period != "M13", year < 2019) %>% 
  left_join(adj_factor, by = "period") %>% 
  mutate(adj_urate = urate - month_adj) 

setwd(THERE)
adj_cturate %>% select(year, period, periodName, stfips, stcofips, adj_urate) %>% 
  write_json("adj-county-urate_2007-2018.json")
setwd(HERE)

#===============================================================================#
# 
#===============================================================================#

