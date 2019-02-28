// CECILE MURRAY

// DATA LOADING
Promise.all([
  'app/data/unprojohio.geojson',
  'app/data/ohio-pop.json'
].map(url => fetch(url).then(data => data.json())))
  .then(data => makeMap(data));

// handy fn to compute domain
function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}

// MAP!
function makeMap(data) {

  const width = 800;
  const height = 600;
  const margin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 10
  };

  svg = d3.select('body').append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);

  const [shp, pop] = data;
  
  geoGenerator = d3.geoPath().projection(d3.geoAlbersUsa());

  const popDomain = computeDomain(pop, 'pop');
  const fips2Pop = pop.reduce((acc, row) => {
    acc[row.stcofips] = row.pop;
    return acc;
  }, {});
  console.log(fips2Pop);
  
  svg.selectAll('path')
    .data(shp.features)
    .enter()
    .append('path')
    .attr('d', d => geoGenerator(d))
    .attr('stroke', 'yellow')
    .attr('fill', d => fips2Pop[d.stcofips]);

};

