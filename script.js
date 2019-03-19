// CECILE MURRAY
// References at the bottom

// var drag = d3.drag();

  // RUG
Rug = function(urates, maxUrate) {
  this.makeRug(urates, maxUrate);
};

Rug.prototype = {
  makeRug: function (urates, maxUrate) {

    const width = 75;
    const height = 600;
    const margin = {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10
    };

    svg = d3.select('#rug').append('svg')
            .attr('width', margin.left + width + margin.right)
            .attr('height', margin.top + height + margin.bottom);
    
    // svg.append('text').text("Unemployment Rate").attr('class', 'title');

    const yScale = d3.scaleLinear()
                    .domain([0, maxUrate])
                    .range([height, margin.bottom]);
    
    const xScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range([0, width]);
  
    svg.selectAll('rect')
      .data(urates)
      .enter()
      .append('rect')
      .attr('x', xScale(0.5))
      .attr('y', d => yScale(d.adj_urate))
      .attr('width', 40)
      .attr('height', 0.5)
      .attr('fill',  d => app.colorScale(d.adj_urate))
      .attr('opacity', 0)
      .attr('id', d => 'rug-' + d.stcofips + '-' + d.year + '-' + d.month);  
      
  },

  updateRug: function(year, month) {

    d3.selectAll('#rug rect')
      .attr('opacity', d => 1 * (d.year === year & d.month - 1 === month))
      .on("mouseover", d => {if (d.year === year & d.month - 1 === month) {
                                app.mouseOverHandler(d);
                              }
                            })
      .on("mouseout", app.mouseOutHandler);

  }
};

// MAP
Map = function(shp, fips2Value) {
  this.makeMap(shp);
};

Map.prototype = {
  makeMap: function (shp) {

    const width = 850;
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

    svg.selectAll('path')
      .data(shp.features)
      .enter()
      .append('path')
      .attr('d', d => geoGenerator(d))
      .attr('id', d => 'ctypath-' + d.properties.GEOID)
      .attr('opacity', 0)
      .on("mouseover", d => app.mouseOverHandler(d))
      .on("mouseout", app.mouseOutHandler)
      .on("click", d => app.clickHandler(d));
  },

  updateMap: function(fips2Value) {
      
    d3.selectAll('#map path')
      .attr('fill', d => fips2Value[d.properties.GEOID])
      .attr('opacity', 1);

  }
};

// word wrap from https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  })
};

IndustryBar = function (selector, industry_data) {
  this.setup(selector, industry_data);
};


IndustryBar.prototype = {
  
  setup: function (selector, industry_data) {
      chart = this;

      margin = { top: 20, right: 20, bottom: 40, left: 20 };

      width = 900 - margin.left - margin.right;
      height = 200 - margin.top - margin.bottom;

      chart.svg = d3.select(selector)
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const industries = [ ... new Set(industry_data.map(x => x.industry_title))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  
      chart.scales = {
          x: d3.scaleBand()
               .domain(industries)
               .range([margin.left, width]),
          y: d3.scaleLinear()
              .domain([0, 1])
              .range([height, 0]),
          width: d3.scaleLinear()
              .domain([0, 1])
              .range([margin.left, width]),
          color: d3.scaleOrdinal()
              .domain(industries)
              .range(d3.schemeCategory10)
      };

      xAxis = d3.axisBottom().scale(chart.scales.width);

      chart.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)
        .selectAll(".tick text")
          .call(wrap, chart.scales.x.bandwidth());

      chart.update(selector, industry_data);
  },

  update: function (selector, industry_data) {
      chart = this;

      currentData = industry_data.filter(d => d.year === app.globals.selected.year);

      if (selector === '#bar2') {
        currentData = currentData.filter(d => d.stcofips === app.globals.selected.stcofips);
      };

      const barMouseOver = function(d) {
        d3.select(selector + '-rect-' + d.industry_title)
          .append('text')
          .text(d.industry_title)
          .attr('class', 'tooltip');
        app.showTooltip(d.industry_title + ', ' + d.industry_share * 100 + '%');
      };

      bars = chart.svg.selectAll(selector + ' rect')
          .data(currentData);
      
      newData = bars.enter().append('rect');
      former = bars.exit();
      current = bars.merge(newData);

      current.attr('x', d => chart.scales.width(d.cshare - d.industry_share))
              .attr('y', d => (height - margin.top) / 2)
              .attr('width', d => chart.scales.width(d.industry_share))
              .attr('height', 50)
              .attr('fill', d => chart.scales.color(d.industry_title))
              .attr('stroke', '#FFFFFF')
              .attr('id', d => selector + '-rect-' + d.industry_title)
              .on('mouseover', d => barMouseOver(d)); 

      titleText = {
        bar1: 'National composition of employment by industry',
        bar2: 'Composition of employment in selected counties' //+ app.globals.selected.county
      };

      if (selector === '#bar1') {

        chart.svg.append('text')
          .text(titleText.bar1)
          .attr('class', 'title bar')
          .attr('transform', 'translate('+ width / 2 + ',0)');

      } else if (selector === '#bar2') {

        oldTitle = chart.svg.select('title bar').exit();
        newTitle = chart.svg.append('text')
          .text(titleText.bar2)
          .attr('class', 'title bar')
          .attr('transform', 'translate('+ width / 2 + ',0)');
        // currentTitle = chart.svg.merge(newTitle);

      };

        

  }
};

Controls = function (dates) {
  this.setup(dates);
};


Controls.prototype = {

  selected: {
    year: '',
    month: ''
  },

  setup: function(dates) {

    // Slider designed based on https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
    sliderWidth = 800;
    sliderHeight = 100;
    margins = { 
      horizontal: 30,
      vertical: 10,
    };

    label = d3.select('#slider-text')
      .append('text')
      .text('Slide the bar to watch the unemployment rate change over time.');

    this.selected.year = dates.defaultYear;
    this.selected.month = dates.defaultMonth;
    console.log('setup called');

    sliderTime = d3.sliderBottom()
      .min(dates.min)
      .max(dates.max)
      .step(1000 * 60 * 60 * 24 * 30)
      .width(sliderWidth - 2 * margins.horizontal)
      .tickFormat(d3.timeFormat('%B %Y'))
      // .tickValues(dates.range)
      .default(new Date(dates.defaultYear, dates.defaultMonth))
      .on('onchange', val => {
        d3.select('#slider-label').text(d3.timeFormat('%B %Y')(val));
        this.selected.year = val.getFullYear();
        this.selected.month = val.getMonth();
        // console.log('onchange called');
        app.update();
      });

    gTime = d3.select('#slider')
      .append('svg')
      .attr('width', sliderWidth)
      .attr('height', sliderHeight)
      .append('g')
      .attr('class', 'slider')
      .attr('transform', 'translate(' + margins.horizontal + ',' + margins.vertical + ')');

    gTime.call(sliderTime);

    d3.select('#slider-label').text(d3.timeFormat('%B %Y')(sliderTime.value()));

  },
  
  getDate: function() {
    return this.selected;
  }

};

app = {
  data: '',
  components: [],

  globals: {
      available: {
        dates: {
          min: new Date(2017, 0),
          max: new Date(2017, 11),
          defaultYear: 2017,
          defaultMonth: 1
        }
      },
      selected: { 
        date: '2017-01',
        year: 2017,
        month: 1, 
        stcofips: '39035',
        county: 'Cuyahoga County, OH'
      }
    },
  
    fips2Name: '',
    urateScale: '',
    colorScale: '',
  
    makeScales: function (maxUrate){
      app.urateScale = d3.scaleLinear()
      .domain([0, maxUrate])
      .range([1, 0]);
      app.colorScale = d => d3.interpolatePlasma(app.urateScale(d));
    },
  
    makeTooltip: function() {
      app.components.tooltip = d3.select("#map-container")
        .append("text")
        .attr("class", "tooltip");
    },  
  
    highlight: function(stcofips) {
      if (stcofips==null) {
        d3.selectAll('.highlight')
          .classed('highlight', false)
          .transition()
          .duration(200);
      } else {
        d3.select('#ctypath-' + stcofips)
          .classed('highlight', true);
        d3.select('#rug-' + stcofips + '-' + app.globals.selected.date)
          .classed('highlight rug', true);
      }
    },
  
    showTooltip: function(stcofips) {
      app.components.tooltip.transition()    
        .duration(200)    
        .attr('class', 'tooltip-on');
      app.components.tooltip.html(app.fips2Name[stcofips])  
        .style("left", (d3.event.pageX) + "px")   
        .style("top", (d3.event.pageY - 28) + "px");
    },
  
    mouseOverHandler: function (d) {
      if (d.stcofips){
        stcofips = d.stcofips;
      } else {
        stcofips = d.properties.GEOID;
      };
      app.highlight(stcofips);
      app.showTooltip(stcofips);
    },
  
    mouseOutHandler: function() {
      app.highlight(null);
      d3.select('.tooltip-on')
        .transition()
        .duration(200)
        .attr('opacity', '0');
    },

    clickHandler: function(d) {
      app.globals.selected.stcofips = d.properties.GEOID;
      app.update();
    },

  initialize: function (data) {

    // loading approach from  https://github.com/cmgiven/gap-reminder-v4
    d3.select('#loading')
      .transition()
      .style('opacity', 0)
      .remove();

    d3.selectAll('#main')
      .style('opacity', 0)
      .style('display', 'block')
      .transition()
      .style('opacity', 1);
      
    const [shp, urates, natl_industry, cty_industry, cty_names] = data;
    app.data = {
      shp: shp,
      urates: urates,
      natl_industry: natl_industry,
      cty_industry: cty_industry,
      max_urate: d3.max(urates, p => p.adj_urate),
      cty_names: cty_names
    };

    app.components.Controls = new Controls(app.globals.available.dates);
    app.makeTooltip();
    app.makeScales(app.data.max_urate);

    // pull each period into its own sub-array so I can index in 
    // h/t to Cory Rand for mentioning d3.nest as a way to approach this problem
    app.data.uratesYear = d3.nest()
                            .key(d => d.year + '-' + d.month)
                            .rollup(v => v.reduce((acc, row) => {
                              acc[row.stcofips] = app.colorScale(row.adj_urate);
                              return acc;
                            }, {}))
                            .map(app.data.urates);

    app.globals.available.dates.range = d3.range(110).map(function(d) {
      return new Date(2007 + Math.floor(d / 10), d % 12, 1);
    });

    app.components.Rug = new Rug(app.data.urates, app.data.max_urate);
    app.components.Map = new Map(app.data.shp);


    app.fips2Name = app.data.cty_names.reduce((acc, row) => {
      acc[row.stcofips] = row.NAME;
      return acc;
    }, {});

    barCaption = d3.select('#bar-label')
      .append('text')
      .text("These charts show how this county's industry mix compares to the national aggregate.");
    app.components.natlBar = new IndustryBar('#bar1', app.data.natl_industry);
    app.components.ctyBar = new IndustryBar('#bar2', app.data.cty_industry);

    app.update();

  },

  update: function () {
    // to do: segment this function into time and place

    selected = app.components.Controls.getDate();
    app.globals.selected.year = selected.year;
    app.globals.selected.month = selected.month;
    app.globals.selected.date = selected.year + '-' + '0' * (selected.month + 1 < 10) + (selected.month + 1);

    currentYearFips2Urate = app.data.uratesYear['$' + app.globals.selected.date];

    app.components.Rug.updateRug(app.globals.selected.year, app.globals.selected.month);
    app.components.Map.updateMap(currentYearFips2Urate);
    
    console.log(app.globals.selected.stcofips);
    // app.components.natlBar.update('#bar1', app.data.natl_industry)
    app.components.ctyBar.update('#bar2', app.data.cty_industry)


  }

}


// DATA LOADING
Promise.all([
  './data/us_counties.geojson',
  './data/adj-urate-2017.json',
  './data/national_industry_shares_07-18.json',
  './data/qcew-2017.json',
  './data/county_names.json'].map(url => fetch(url)
  .then(data => data.json())))
  .then(data => app.initialize(data));


// REFERENCES
// Draws on https://github.com/cmgiven/gap-reminder-v4
// and on the various exercises/solutions in https://github.com/mcnuttandrew/capp-30239
// and on https://github.com/ivan-ha/d3-hk-map/blob/development/map.js
// https://bl.ocks.org/tiffylou/88f58da4599c9b95232f5c89a6321992
