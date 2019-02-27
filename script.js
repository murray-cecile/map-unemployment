
d3.json('app/data/us_counties.geojson')
  .catch(function(error, data) {
    console.log(error);
  }) 
  .then(function(data) {
    makeMap(data);
  });

function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}

function makeMap(data) {
  // this is an es6ism called a destructuring, it allows you to save and name argument
  // you tend to see it for stuff in object, (as opposed to arrays), but this is cool too
  // const [stateShapes, statePops] = data;
  const width = 1000;
  const height = 800;
  const margin = {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  };

  svg = d3.select('.first').append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);
  
  path = d3.geoPath().projection(d3.geoAlbersUsa());

  console.log(data.features);

  svg.selectAll('path')
    .data(data.features)
    .enter()
    .append('path')
    .attr('d', path);
  // we're going to be coloring our cells based on their population so we should compute the
  // population domain
  // const popDomain = computeDomain(statePops, 'pop');
  // // the data that we will be iterating over will be the geojson array of states, so we want to be
  // // able to access the populations of all of the states. to do so we flip it to a object representation
  // const stateNameToPop = statePops.reduce((acc, row) => {
  //   acc[row.state] = row.pop;
  //   return acc;
  // }, {});
  // YOUR COLOR SCALE HERE
  //
  //
  //
  // next we set up our projection stuff
  // const projection = geoAlbersUsa();
  // const geoGenerator = geoPath(projection);
  // then our container as usual
  // YOUR SVG CONTAINER CODE HERE

  // finally we construct our rendered states
  // YOUR JOIN AND ENTER HERE

};
