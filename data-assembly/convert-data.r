#===============================================================================#
# EXPORT TO JSON
#
# Cecile Murray
#===============================================================================#

libs <- c("here", "tidyverse", "magrittr", "sf", "tidycensus", "jsonlite",
          "data.table", "blscrapeR")
lapply(libs, library, character.only = TRUE)

blskey <- Sys.getenv("BLS_KEY")
# censuskey <- Sys.getenv("CENSUS_KEY")

HERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/jobs"
THERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/map-unemployment/data"

setwd(HERE)

write_json_there <- function(df, filename){
  setwd(THERE)
  df %>% write_json(filename)
  setwd(HERE)
}


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
# NATIONAL EMPLOYMENT BY INDUSTRY
#===============================================================================#

# pull list of all NAICS codes
industries <- fread("https://download.bls.gov/pub/time.series/ce/ce.industry") %>% 
  mutate(industry_code = str_pad(industry_code, 8, side = "left", pad = "0"))

supersectors <- c("Goods-producing", "Service-providing",
                  "Private service-providing", "Total private")

industry_list <- c("Mining and logging", "Construction", "Manufacturing",
                   "Retail trade", "Wholesale Trade", "Utilities",
                   "Transportation and warehousing", "Information",
                   "Financial activities", 
                   "Professional and business services",
                   "Education and health services",
                   "Leisure and hospitality", "Other services", "Government",
                   "Total nonfarm")

# construct series IDs to query
naics2 <- filter(industries, industry_name %in% industry_list) %>% 
  mutate(seriesID = paste0("CE", "S", industry_code, "01"))

naics2_data <- bls_api(naics2$seriesID, startyear = 2007, endyear = 2018,
                       registrationKey = blskey, annualaverage = TRUE) %>% 
  mutate(month = paste0(year, "-", substr(period, 2, 3))) %>% 
  left_join(naics2, by = "seriesID")

industry_shares <- naics2_data %>% 
  select(year, month, industry_name, value) %>% 
  mutate(tot_nonfarm = ifelse(industry_name == "Total nonfarm", value, NA)) %>% 
  arrange(month) %>% fill(tot_nonfarm) %>% 
  mutate(industry_share = value / tot_nonfarm) %>% 
  write_json_there("national_industry_shares_07-18.json")

