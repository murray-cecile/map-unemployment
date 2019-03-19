#===============================================================================#
# EXPORT TO JSON
#
# Cecile Murray
#===============================================================================#

libs <- c("here", "tidyverse", "magrittr", "sf", "tidycensus", "jsonlite",
          "data.table", "blscrapeR")
lapply(libs, library, character.only = TRUE)

blskey <- Sys.getenv("BLS_KEY")

HERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/jobs"
THERE <- "/Users/cecilemurray/Documents/CAPP/data-viz/map-unemployment/data"

write_json_there <- function(df, filename){
  setwd(THERE)
  df %>% write_json(filename)
  setwd(HERE)
}

setwd(HERE)

#===============================================================================#
# COUNTY POPULATION
#===============================================================================#

ctpop <- get_acs(geography = "county", variable = "B01001_001",
                 geometry = TRUE, shift_geo = TRUE) %>% 
  dplyr::rename(stcofips = GEOID, pop = estimate) %>% 
  filter(!stcofips %in% c("72")) %>% select(-moe) 

ctpop %>% select(stcofips, pop) %>% st_drop_geometry() %>% 
  write_json_there("county-population-2017.json")

countydict <- ctpop %>% select(stcofips, NAME) %>% st_drop_geometry() %>% 
  write_json_there("county_names.json")

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
  dplyr::rename(urate = value) 

annual <- cturate %>% filter(period == "M13") %>%
  dplyr::rename(ann_urate = urate) %>% 
  select(year, stcofips, ann_urate)

adj_factor <- cturate %>% filter(period != "M13", year < 2018) %>% 
  left_join(annual, by = c("stcofips", "year")) %>% 
  mutate(ann_delta = urate - ann_urate) %>% 
  group_by(period) %>% summarize(month_adj = mean(ann_delta))

adj_cturate <- cturate %>% filter(period != "M13", year < 2018) %>% 
  left_join(adj_factor, by = "period") %>% 
  mutate(adj_urate = urate - month_adj,
         month = substr(period, 2, 3))

adj_cturate %>% select(year, month, periodName, stfips, stcofips, adj_urate) %>% 
  write_json_there("adj-county-urate_2007-2018.json")

adj_cturate %>% select(year, month, periodName, stfips, stcofips, adj_urate) %>% 
  filter(year == 2017) %>% write_json_there("adj-urate-2017.json")

#===============================================================================#
# QCEW API
#===============================================================================#

qcew_naics <- blscrapeR::niacs %>%
  filter(substr(industry_title, 1, 7) != "NAICS07",
         substr(industry_code, 1, 2) == "10") %>%
  filter(!industry_title %in% c("Goods producing", "Service providing"))


# run once and saved for speed
# dat <- Map(function(x, y) qcew_api(year = x,
#                                    qtr = 'A',
#                                    slice = "industry",
#                                    sliceCode = y),
#            rep(seq(2015, 2017), nrow(qcew_naics)),
#            qcew_naics$industry_code) %>%
#   bind_rows() %>%
#   filter(own_code == 5,
#          size_code == 0,
#          as.numeric(substr(area_fips, 1, 2)) < 57,
#          as.numeric(substr(area_fips, 3, 5) != "000"))

# save(dat, file = "temp/qcew_dat.Rdata")
load("temp/qcew_dat.Rdata")

#===============================================================================#
# NATIONAL EMPLOYMENT BY INDUSTRY
#===============================================================================#

natl_shares <- dat %>% select(industry_code, year, annual_avg_emplvl) %>% 
  mutate(industry_code = as.character(industry_code)) %>% 
  left_join(qcew_naics, by="industry_code") %>% 
  group_by(industry_code, industry_title, year) %>%
  summarize_all(sum, na.rm=TRUE) %>% 
  mutate(totemp = ifelse(industry_code == "10",
                         annual_avg_emplvl, NA)) %>%
  ungroup() %>% arrange(year) %>% fill(totemp, .direction = c("down")) %>% 
  mutate(industry_share = ifelse(totemp > 0, annual_avg_emplvl / totemp, 0)) %>% 
  filter(industry_title != "Total, all industries") %>%
  arrange(year, industry_title) %>%
  group_by(year) %>% mutate(cshare = cumsum(industry_share))

natl_shares %>% select(year, industry_title, industry_share, cshare) %>% 
  write_json_there("national_industry_shares_07-18.json")

#===============================================================================#
# COUNTY EMPLOYMENT BY INDUSTRY
#===============================================================================#

qcew <- dat %>% select(area_fips, industry_code, year, annual_avg_emplvl) %>% 
  dplyr::rename(stcofips = area_fips) %>% 
  mutate(industry_code = as.character(industry_code)) %>% 
  left_join(qcew_naics, by="industry_code") %>% 
  mutate(totemp = ifelse(industry_code == "10", annual_avg_emplvl, NA)) %>% 
  arrange(stcofips, year, industry_code) %>% fill(totemp) %>% 
  mutate(industry_share = ifelse(totemp > 0, annual_avg_emplvl / totemp, 0)) %>% 
  filter(industry_title != "Total, all industries") %>%
  arrange(stcofips, year, industry_title) %>%
  group_by(stcofips, year) %>% mutate(cshare = cumsum(industry_share)) 

qcew %>% select(stcofips, year, industry_title, industry_share, cshare) %>% 
  filter(year == 2017) %>% 
  write_json_there('qcew-2017.json')

# oh <- qcew %>% filter(industry_code != 10, year == 2017, substr(stcofips, 1, 2) == "39") %>%
#   write_json_there("qcew-oh17.json")

