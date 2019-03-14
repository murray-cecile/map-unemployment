// CECILE MURRAY
// References at the bottom

main = {

  tooltip: '',
  fips2Name: '',
  urateScale: '',
  colorScale: '',
  year: 2017,
  month: 1,
  timeId: '2017-02',


  makeScales: function (maxUrate){
    main.urateScale = d3.scaleLinear()
    .domain([0, maxUrate])
    .range([1, 0]);
    main.colorScale = d => d3.interpolatePlasma(main.urateScale(d));
  },

  makeTooltip: function() {
    main.tooltip = d3.select("#map-container")
      .append("text")
      .attr("class", "tooltip");
  },  

  highlight: function(stcofips) {
    if (stcofips==null) {
      d3.selectAll('.highlight').classed('highlight', false);
    } else {
      d3.select('#ctypath-' + stcofips)
        .classed('highlight', true);
      d3.select('#rug-' + stcofips + '-' + main.timeId)
        .classed('highlight rug', true);
    }
  },

  showTooltip: function(name) {
    main.tooltip.transition()    
      .duration(200)    
      .attr('class', 'tooltip-on');
    main.tooltip.html(name)  
      .style("left", (d3.event.pageX) + "px")   
      .style("top", (d3.event.pageY - 28) + "px");
  },

  mouseOverHandler: function (d) {
    if (d.stcofips){
      stcofips = d.stcofips;
    } else {
      stcofips = d.properties.GEOID;
    };
    main.highlight(stcofips);
    main.showTooltip(main.fips2Name[stcofips])
  },

  mouseOutHandler: function() {
    main.highlight(null);
    d3.select('.tooltip-on')
      .transition()
      .duration(200)
      .attr('opacity', '0');
  },


  // RUG
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
      .attr('fill',  d => main.colorScale(d.adj_urate))
      .attr('opacity', 0)
      .attr('id', d => 'rug-' + d.stcofips + '-' + d.year + '-' + d.month);  
      
  },

  updateRug: function(year, month) {

    d3.selectAll('#rug rect')
      .attr('opacity', d => 1 * (d.year === year & d.month - 1 === month))
      .on("mouseover", d => {if (d.year === year & d.month - 1 === month) {
                                main.mouseOverHandler(d);}
                            })
      .on("mouseout", main.mouseOutHandler);

  },

  // MAP
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
      .on("mouseover", d => main.mouseOverHandler(d))
      .on("mouseout", main.mouseOutHandler);
  },

  updateMap: function(fips2Value) {
      
    d3.selectAll('#map path')
      .attr('fill', d => main.colorScale(fips2Value[d.properties.GEOID]))
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
  currentData = industry_data.filter(d => d.year === app.globals.selected.year);

  if (selector === '#bar1') {
    currentData = currentData.filter(d => d.month === app.globals.selected.date);
  } else if (selector === '#bar2') {
    currentData = currentData.filter(d => d.stcofips === app.globals.selected.stcofips);
  };
  console.log(currentData);

  this.setup(selector, currentData);
};


IndustryBar.prototype = {
  
  setup: function (selector, currentData) {
      chart = this;

      margin = { top: 20, right: 20, bottom: 100, left: 20 };

      width = 900 - margin.left - margin.right;
      height = 200 - margin.top - margin.bottom;

      chart.svg = d3.select(selector)
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const industries = [ ... new Set(currentData.map(x => x.industry_name))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  
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

      if (selector === '#bar1') {
        label = 'National composition of employment by industry';
      } else if (selector === '#bar2') {
        label = 'Composition of employment in selected county';
      };

      chart.svg.append('text')
          .text(label)
          .attr('class', 'text subtitle')
          .attr('transform', 'translate('+ width / 2 + ',0)');

      chart.update(selector);
  },

  update: function (selector) {
      chart = this;

      const barMouseOver = function(d) {
        d3.select(selector + '-rect-' + d.industry_name)
          .append('text')
          .text(d.industry_name)
          .attr('class', 'tooltip');
        main.showTooltip(d.industry_name + ', ' + d.industry_share * 100 + '%');
      };

      chart.svg.selectAll(selector + ' rect')
          .data(currentData)
          .enter()
          .append('rect')
          .attr('x', d => chart.scales.width(d.cshare - d.industry_share))
          .attr('y', d => (height - margin.top) / 2)
          .attr('width', d => chart.scales.width(d.industry_share))
          .attr('height', 50)
          .attr('fill', d => chart.scales.color(d.industry_name))
          .attr('stroke', '#FFFFFF')
          .attr('id', d => selector + '-rect-' + d.industry_name)
          .on('mouseover', d => barMouseOver(d)); 

  }
};

Controls = function (dates) {
  this.setup(dates);
};


Controls.prototype = {

  selected: {
    year: 2017,
    month: 1
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

    sliderTime = d3.sliderBottom()
      .min(dates.min)
      .max(dates.max)
      .step(1000 * 60 * 60 * 24 * 30)
      .width(sliderWidth - 2 * margins.horizontal)
      .tickFormat(d3.timeFormat('%B %Y'))
      // .tickValues(dates.range)
      .default(new Date(2017, 1))
      .on('onchange', val => {
        d3.select('#slider-label').text(d3.timeFormat('%B %Y')(val));
        this.selected.year = val.getFullYear();
        this.selected.month = val.getMonth();
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
        years: '',
        dates: {
          min: new Date(2017, 0),
          max: new Date(2017, 11)
        }
      },
      selected: { 
        date: '2017-01',
        year: 2017,
        month: 1, 
        stcofips: '39035',
        county: 'Cuyahoga'
      }
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
      
    const [shp, urates, natl_industry, cty_industry] = data;
    app.data = {
      'shp': shp,
      'urates': urates,
      'natl_industry': natl_industry,
      'cty_industry': cty_industry,
      'max_urate': d3.max(urates, p => p.adj_urate)
    };

    app.globals.available.dates.range = d3.range(110).map(function(d) {
      return new Date(2007 + Math.floor(d / 10), d % 12, 1);
    });

    app.components.Controls = new Controls(app.globals.available.dates);

    app.components.Tooltip = main.makeTooltip();
    main.makeScales(app.data.max_urate);

    app.components.Rug = main.makeRug(app.data.urates, app.data.max_urate);
    app.components.Map = main.makeMap(app.data.shp);

    main.fips2Name = app.data.shp.features.reduce((acc, row) => {
      acc[row.properties.GEOID] = row.properties.NAME;
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

    selected = app.components.Controls.getDate();
    app.globals.selected.year = selected.year;
    app.globals.selected.month = selected.month;
    app.globals.selected.date = selected.year + '-' + 1 * (selected.month + 1 < 10) + (selected.month + 1);

    currentYearFips2Urate = app.data.urates.filter(d => d.year + '-' + d.month === app.globals.selected.date)
      .reduce((acc, row) => {
          acc[row.stcofips] = row.adj_urate;
        return acc;
      }, {});

    // fips2Urate = app.data.urates.reduce((acc, row) => {
    //   acc[row.stcofips + '-' + row.year + '-' + row.month] = row.adj_urate;
    //   return acc;
    // }, {});

    app.components.Rug = main.updateRug(app.globals.selected.year, app.globals.selected.month);
    app.components.Map = main.updateMap(currentYearFips2Urate);


  }

}


// DATA LOADING
Promise.all([
  './data/us_counties.geojson',
  './data/adj-urate-2017.json',
  './data/national_industry_shares_07-18.json',
  './data/qcew-oh17.json'].map(url => fetch(url)
  .then(data => data.json())))
  .then(data => app.initialize(data));


// REFERENCES
// Draws on https://github.com/cmgiven/gap-reminder-v4
// and on the various exercises/solutions in https://github.com/mcnuttandrew/capp-30239
// and on https://github.com/ivan-ha/d3-hk-map/blob/development/map.js
// https://bl.ocks.org/tiffylou/88f58da4599c9b95232f5c89a6321992
