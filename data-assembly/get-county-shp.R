#===============================================================================#
# PULL ROTATED COUNTY SHAPEFILE
#
# Cecile Murray
#===============================================================================#

libs <- c("tidyverse", "magrittr", "tidycensus", "sf", "rmapshaper")
lapply(libs, library, character.only = TRUE)

ctpop <- get_acs(geography = "county", variable = "B01001_001",
                 geometry = TRUE, shift_geo = TRUE) %>% 
  dplyr::rename(stcofips = GEOID, pop = estimate) %>% 
  filter(!stcofips %in% c("72")) %>% select(-moe) 

counties <- ctpop %>% select(-variable, -pop)
simplified <- ms_simplify(counties, keep_shapes = TRUE) %>%
  st_as_sf() %>%
  st_transform(2163)

setwd("~/Documents/CAPP/data-viz/map-unemployment/data")

sf::st_write(simplified, "simple_us_counties.geojson", delete_dsn=TRUE)
sf::st_write(counties, "counties2.geojson")
