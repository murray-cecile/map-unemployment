// CECILE MURRAY


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
function makeRug(urates) {

  const width = 800;
  const height = 75;
  const margin = {
    top: 10,
    left: 20,
    right: 20,
    bottom: 10
  };

  svg = d3.select('#rug').append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom);
  
  const xScale = d3.scaleLinear()
                   .domain([0, d3.max(urates, p => p.adj_urate)])
                   .range([margin.left, width]);
  
  const yScale = d3.scaleLinear()
                   .domain([0, 1])
                   .range([0, height]);
  
  const urateScale = d3.scaleLinear()
                    .domain([0, d3.max(urates, p => p.adj_urate)])
                    .range([0, 1]);

  const colorScale = d => d3.interpolateViridis(urateScale(d));

  svg.selectAll('rect')
    .data(urates)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.adj_urate))
    .attr('y', yScale(0.5))
    .attr('width', 2)
    .attr('height', 40)
    .attr('fill', d => colorScale(d.adj_urate));                 
};

// MAP!
function makeMap(shp, urates) {

  const width = 900;
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

  const fips2Value = urates.reduce((acc, row) => {
    acc[row.stcofips] = row.adj_urate;
    return acc;
  }, {});

  const urateScale = d3.scaleLinear()
                    .domain([0, d3.max(urates, p => p.adj_urate)])
                    .range([0, 1]);

  const colorScale = d => d3.interpolateViridis(urateScale(d));
  
  svg.selectAll('path')
    .data(shp.features)
    .enter()
    .append('path')
    .attr('d', d => geoGenerator(d))
    .attr('fill', d => colorScale(fips2Value[d.properties.GEOID]));

};

function makeIndustryBar(industry_data, which_bar) {
  const width = 400;
  const height = 400;
  const margin = {
    top: 10,
    left: 20,
    right: 20,
    bottom: 10
  };

  svg = d3.select(which_bar).append('svg')
          .attr('width', width - margin.left - margin.right)
          .attr('height', height - margin.top - margin.bottom);
  
  const industries = [ ... new Set(industry_data.map(x => x.industry_name))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  
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

IndustryBar = function () {
  this.setup();
};

IndustryBar.prototype = {
  setup: function () {
      chart = this;

      margin = { top: 10, right: 10, bottom: 10, left: 20 };

      width = 400 - margin.left - margin.right;
      height = 400 - margin.top - margin.bottom;

      chart.svg = d3.select('#bar2')
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const industries = [ ... new Set(app.data.cty_industry.map(x => x.industry_name))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  

      chart.scales = {
          x: d3.scaleBand()
               .domain(industries)
               .range([margin.left, width]),
          y: d3.scaleLinear()
              .domain([0, d3.max(app.data.cty_industry, d => d.industry_share)])
              .range([height, 0])
      };

      xAxis = d3.axisBottom().scale(chart.scales.x);
      yAxis = d3.axisLeft().scale(chart.scales.y);

      chart.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      chart.svg.append('g')
          .attr('class', 'y axis')
          .call(yAxis);

      // chart.tooltip = chart.svg.append('text')
      //     .attr('x', width)
      //     .attr('y', 0)
      //     .attr('class', 'tooltip')

      chart.update();
  },

  update: function () {
      chart = this;

      yearData = app.data.cty_industry.filter(d => d.year === app.globals.selected.year);

      chart.svg.selectAll('rect')
          .data(yearData)
          .enter()
          .append('rect')
          .attr('x', d => chart.scales.x(d.industry_name))
          .attr('y', d => chart.scales.y(d.industry_share))
          .attr('width', d => chart.scales.x.bandwidth())
          .attr('height', d => chart.scales.y(d.industry_share))
          .attr('fill', "#217FBE");

  }
};

app = {
  data: [],
  components: [],

  globals: {
      // available: { years: d3.range(MIN_YEAR, MAX_YEAR + 1) },
      selected: { year: 2017 },
      animating: false
  },

  initialize: function (data) {
      
      const [shp, urates, natl_industry, cty_industry] = data;
      app.data = {
        'shp': shp,
        'urates': urates,
        'natl_industry': natl_industry,
        'cty_industry': cty_industry
      };

      app.components.Rug = makeRug(app.data.urates);
      app.components.Map = makeMap(app.data.shp, app.data.urates);
      app.components.natlBar = makeIndustryBar(natl_industry, '#bar1');
      app.components.industryBar = new IndustryBar('#bar2');
      // app.components.controls    = new Controls('#controls')


      // Hide the loading dialog and reveal the chart.
      d3.select('#loading')
          .transition()
          .style('opacity', 0)
          .remove();

      d3.select('#main')
          .style('opacity', 0)
          .style('display', 'block')
          .transition()
          .style('opacity', 1);

  },

  update: function () {
      for (var component in app.components) {
          if (app.components[component].update) {
              app.components[component].update()
          }
      }
  },

  setYear: function (year) {
      app.globals.selected.year = year;
      app.update()
  }

  // incrementYear: function () {
  //     var availableYears = app.globals.available.years;
  //     var currentIdx = availableYears.indexOf(app.globals.selected.year);
  //     app.setYear(availableYears[(currentIdx + 1) % availableYears.length]);
  // },

  // toggleAnimation: function () {
  //     if (app.globals.animating) {
  //         app.interval.stop()
  //         d3.select('body').classed('animating', false)
  //         app.globals.animating = false
  //     } else {
  //         app.interval = d3.interval(app.incrementYear, ANIMATION_INTERVAL)
  //         d3.select('body').classed('animating', true)
  //         app.globals.animating = true
  //     }

  //     app.update()
  // }
}

// DATA LOADING
Promise.all([
  'data/us_counties.geojson',
  'data/adj-urate-2017.json',
  'data/national_industry_shares_07-18.json',
  'data/qcew-oh17.json'].map(url => fetch(url)
  .then(data => data.json())))
  // .then(data => makeCharts(data));
  .then(data => app.initialize(data));


function makeCharts(data) {

  const [shp, urates, natl_industry, cty_industry] = data;

  console.log(cty_industry);

  makeRug(urates);
  makeMap(shp, urates);
  makeIndustryBar(natl_industry, '#bars :first-child');
  // makeIndustryBar(cty_industry, '#bars :last-child');
}