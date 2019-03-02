// CECILE MURRAY

// DATA LOADING
Promise.all([
  'data/unprojohio.geojson',
  'data/ohio-pop.json',
  'data/national_industry_shares_07-18.json'].map(url => fetch(url)
  .then(data => data.json())))
  .then(data => makeCharts(data));


function makeCharts(data) {

  const [shp, pop, natl_industry] = data;

  console.log(natl_industry);

  makeRug(pop);
  makeMap(shp, pop);
  makeIndustryBar(natl_industry, '#bar1');
  // makeIndustryBar(cty_industry);
}

// handy fn to compute domain
function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}

// RUG
function makeRug(pop) {

  const width = 800;
  const height = 75;
  const margin = {
    top: 10,
    left: 20,
    right: 20,
    bottom: 5
  };

  svg = d3.select('#rug').append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);
  
  const xScale = d3.scaleLinear()
                   .domain([0, d3.max(pop, p => p.pop)])
                   .range([margin.left, width]);
  
  const yScale = d3.scaleLinear()
                   .domain([0, 1])
                   .range([0, height]);
  
  svg.selectAll('rect')
    .data(pop)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.pop))
    .attr('y', yScale(0.5))
    .attr('width', 2)
    .attr('height', 50)
    .attr('class', 'rect rug');                 
};

// MAP!
function makeMap(shp, pop) {

  const width = 800;
  const height = 600;
  const margin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 10
  };

  svg = d3.select('#map').append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);
  
  geoGenerator = d3.geoPath().projection(d3.geoAlbersUsa());

  const fips2Pop = pop.reduce((acc, row) => {
    acc[row.stcofips] = row.pop;
    return acc;
  }, {});

  const popScale = d3.scaleLinear()
                    .domain([0, d3.max(pop, p => p.pop)])
                    .range([0, 1]);

  const colorScale = d => d3.interpolateViridis(popScale(d));
  
  svg.selectAll('path')
    .data(shp.features)
    .enter()
    .append('path')
    .attr('d', d => geoGenerator(d))
    .attr('stroke', 'white')
    .attr('fill', d => colorScale(fips2Pop[d.properties.GEOID]));

};

function makeIndustryBar(industry_data, which_bar) {
  const width = 400;
  const height = 400;
  const margin = {
    top: 10,
    left: 20,
    right: 10,
    bottom: 10
  };

  svg = d3.select(which_bar).append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);
  
  const industries = [ ... new Set(industry_data.map(x => x.industry_name))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  console.log(industries);
  
  const xScale = d3.scaleBand()
                   .domain(industries)
                   .range([margin.left, width]);
  const yScale = d3.scaleLinear()
                   .domain([0, d3.max(industry_data, d => d.industry_share)])
                   .range([height, margin.top]);
  
  svg.selectAll('rect')
    .data(industry_data)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.industry_name))
    .attr('y', d => yScale(d.industry_share))
    .attr('width', xScale.bandwidth())
    .attr('height', d => yScale(d.industry_share))
    .attr('fill', "#217FBE");

};

