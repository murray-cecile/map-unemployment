## Intro

My project looks at the health of the U.S. labor market over time using data from the Bureau of Labor Statistics, namely from the Current Population Survey (CPS), the Current Economic Statistics (CES) and the Quarterly Census of Employment and Wages (QCEW).

## Data Sources
- Local Area Unemployment Statistics
- Current Economic Statistics
- Current Population Survey
- Quarterly Census of Employment and Wages
BLS has an API and there is an R package.

## Purpose of interactive
- to explore spatial trends in unemployment over time, similar to this: https://flowingdata.com/2016/10/17/animated-map-of-unemployment/
- Important because there's a lot of local variation in labor markets that doesn't get discussed in the national media
- Policymakers who care about people's economic well being should care about the health of labor markets

## Overview, since there's no explanatory text
- map shows the unemplyment rate in the selected month, darker is higher
- lines / rug chart to the right of the map show the distribution / will serve as a scale 
- additional charts below the map show the employment mix by industry and will hopefully eventually be responsive to a user selecting a county by clicking on the chart

## Tooltip and highlighting

### Map and rug creation
- both are SVGs, both have opacity 0 when first created
- note underlying data structure: 
    - 1 set of 3100ish paths from geojson 
    - 12 months worth of unemployment data (10 * 3100)
- all of the values are present for the rug
- each rect has an ID
- then when the updateRug() function is called, it changes opacity for the correct observations and turns on the mousover 

### mouseover, mouseout 
- mouseover operates on a data object and extracts the county geographic identifier

### highlighting 
- highlight has two options: either passed a geoid from mouseover or a null from mouseout
- if it's a null, it turns off whatever is classed as highlighted
- if it's a geoid, it selects BOTH the path object and the rug rect. Note I have to keep track of what time period we're in here

### tooltip
- the tooltip is created by selection when the page initializes but it doesn't have any text until mouseover
- at that point I turn it on and give it the county's name
- the position is determined by the location of the event
