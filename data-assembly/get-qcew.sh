years="2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017"

for y in $years; do 

   echo $years
   wget "https://data.bls.gov/cew/data/files/${y}/csv/${y}_annual_by_area.zip"
   unzip ${y}_annual_by_area.zip
   cat ${y}_annual_by_area.zip >> "qcew.csv"

done

rm *.zip

