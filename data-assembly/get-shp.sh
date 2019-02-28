
# cd /Users/cecilemurray/Documents/CAPP/data-viz/map-unemployment 
cd app/data

wget http://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_us_county_500k.zip

for x in *zip; do unzip $x; done

for i in $(ls cb*.shp); do

  if [ -f "us_counties.shp" ]; then
    ogr2ogr -update -append us_counties.shp $i -nln us_counties
  else
    ogr2ogr us_counties.shp $i
	    fi
done

rm cb_*

ogr2ogr -f GeoJSON us_counties.geojson us_counties.shp

rm *.shx *.shp *.dbf *.prj

ogr2ogr -f GeoJSON unprojohio.geojson  cb_2017_us_county_500k.shp  -sql "select * from cb_2017_us_county_500k where STATEFP = '39'" -overwrite
