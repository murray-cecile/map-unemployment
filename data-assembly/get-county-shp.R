#===============================================================================#
# PULL ROTATED COUNTY SHAPEFILE
#
# Cecile Murray
#===============================================================================#

libs <- c("tidyverse", "magrittr", "tidycensus")
lapply(libs, library, character.only = TRUE)

ctpop <- get_acs(geography = "county", variable = "B01001_001",
                 geometry = TRUE, shift_geo = TRUE) %>% 
  dplyr::rename(stcofips = GEOID, pop = estimate) %>% 
  filter(!stcofips %in% c("72")) %>% select(-moe) 

counties <- ctpop %>% select(-variable, -pop)

setwd("/Users/cecilemurray/Documents/CAPP/data-viz/map-unemployment/app/data")

sf::st_write(counties, "us_counties.geojson")