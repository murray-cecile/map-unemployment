// CECILE MURRAY
// References at the bottom



main = {

  highlight: function(stcofips) {
    if (stcofips==null) {
      d3.selectAll('.highlight').classed('highlight', false);
    } else {
      d3.select('#ctypath-' + stcofips, '#rug-' + stcofips).classed('highlight', true);
      // console.log('#rug-' + stcofips);
      // console.log('#ctypath-' + stcofips);
    }
  },

  makeTooltip: function(d, tooltip) {
    tooltip.transition()    
      .duration(200)    
      .attr('class', 'tooltip on');
    tooltip.html(d.properties.NAME)  
      .style("left", (d3.event.pageX) + "px")   
      .style("top", (d3.event.pageY - 28) + "px");
  },

  mapMouseOverHandler: function (d, tooltip) {
    if (d.properties){
      stcofips = d.properties.GEOID;
      main.highlight(stcofips);
      main.makeTooltip(d, tooltip);
    } else if (d.year) {
      // console.log(this);
      // stcofips = this.id.split('-')[1];
      // main.highlight(stcofips);
    }
  },

  rugMouseOverHandler: function() {
    stcofips = this.id.split('-')[1];
    main.highlight(stcofips);
  },

  mouseOutHandler: function() {
    main.highlight(null);
    d3.select('.tooltip on')
      .transition()
      .duration(200)
      .attr('opacity', '0');
  },


  // RUG
  makeRug: function (urates) {

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
    
    const yScale = d3.scaleLinear()
                    .domain([0, d3.max(urates, p => p.adj_urate)])
                    .range([height, margin.bottom]);
    
    const xScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range([0, width]);
  
    const urateScale = d3.scaleLinear()
                        .domain([0, d3.max(urates, p => p.adj_urate)])
                        .range([1, 0]);

    const colorScale = d => d3.interpolatePlasma(urateScale(d));

    tooltip = d3.select("#map-container").append("text") .attr("class", "tooltip");

    svg.selectAll('rect')
      .data(urates)
      .enter()
      .append('rect')
      .attr('x', xScale(0.5))
      .attr('y', d => yScale(d.adj_urate))
      .attr('width', 40)
      .attr('height', 0.5)
      .attr('fill', d => colorScale(d.adj_urate))
      .attr('id', d => 'rug-' + d.stcofips)
      .on("mouseover", main.rugMouseOverHandler)
      .on("mouseout", main.mouseOutHandler);  
      
  },


  // MAP
  makeMap: function (shp, urates, fips2Value) {

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

    const urateScale = d3.scaleLinear()
                      .domain([0, d3.max(urates, p => p.adj_urate)])
                      .range([1, 0]);

    const colorScale = d => d3.interpolatePlasma(urateScale(d));

    tooltip = d3.select("#map-container").append("text") .attr("class", "tooltip");

    svg.selectAll('path')
      .data(shp.features)
      .enter()
      .append('path')
      .attr('d', d => geoGenerator(d))
      .attr('fill', d => colorScale(fips2Value[d.properties.GEOID]))
      .attr('id', d => 'ctypath-' + d.properties.GEOID)
      .attr('opacity', 0)
      .on("mouseover", d => main.mapMouseOverHandler(d, tooltip))
      .on("mouseout", main.mouseOutHandler)
      .on("click", d => main.makeTooltip(d, tooltip));
  },

  updateMap: function(year, fips2Value) {

    const urateScale = d3.scaleLinear()
                      .domain([0, d3.max(urates, p => p.adj_urate)])
                      .range([1, 0]);

    const colorScale = d => d3.interpolatePlasma(urateScale(d));   
    
    // d3.select('#map')
    //   .data(shp.features)
    //   .enter()
    //   .attr('fill', d => colorScale(fips2Value[d.properties.GEOID]));

  }

};


IndustryBar = function (selector, industry_data) {
  yearData = industry_data.filter(d => d.year === app.globals.selected.year);
  // console.log(yearData);
  this.setup(selector, yearData);
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

IndustryBar.prototype = {
  
  setup: function (selector, industry_data) {
      chart = this;

      margin = { top: 20, right: 20, bottom: 100, left: 20 };

      width = 600 - margin.left - margin.right;
      height = 400 - margin.top - margin.bottom;

      chart.svg = d3.select(selector)
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const industries = [ ... new Set(industry_data.map(x => x.industry_name))]; // https://codeburst.io/javascript-array-distinct-5edc93501dc4
  
      chart.scales = {
          x: d3.scaleBand()
               .domain(industries)
               .range([margin.left, width]),
          y: d3.scaleLinear()
              .domain([0, d3.max(industry_data, d => d.industry_share)])
              .range([height, 0]),
          height: d3.scaleLinear()
              .domain([0, d3.max(industry_data, d => d.industry_share)])
              .range([0, height])
      };

      xAxis = d3.axisBottom().scale(chart.scales.x);
      yAxis = d3.axisLeft().scale(chart.scales.y);

      chart.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)
        .selectAll(".tick text")
          .call(wrap, chart.scales.x.bandwidth());

      chart.svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate('+ margin.left + ',0)')
          .call(yAxis);

      chart.update(selector);
  },

  update: function (selector) {
      chart = this;

      // console.log(yearData);

      chart.svg.selectAll(selector + ' rect')
          .data(yearData)
          .enter()
          .append('rect')
          .attr('x', d => chart.scales.x(d.industry_name))
          .attr('y', d => height - chart.scales.height(d.industry_share))
          .attr('width', chart.scales.x.bandwidth())
          .attr('height', d => chart.scales.height(d.industry_share))
          .attr('fill', "#217FBE")
          .attr('stroke', '#FFFFFF');

  }
};

Controls = {

  setup: function(dates) {

    // Slider designed based on https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
    sliderWidth = 800;
    sliderHeight = 100;
    margins = { 
      horizontal: 30,
      vertical: 10,
    };

    sliderTime = d3.sliderBottom()
      .min(dates.min)
      .max(dates.max)
      .step(1000 * 60 * 60 * 24 * 30)
      .width(sliderWidth - 2 * margins.horizontal)
      .tickFormat(d3.timeFormat('%Y%M'))
      .tickValues(dates.range)
      .ticks(10)
      .default(new Date(2017, 1))
      .on('onchange', val => {
        d3.select('#slider-label').text(d3.timeFormat('%Y%M')(val));
      });

    gTime = d3.select('#slider')
      .append('svg')
      .attr('width', sliderWidth)
      .attr('height', sliderHeight)
      .append('g')
      .attr('class', 'slider')
      .attr('transform', 'translate(' + margins.horizontal + ',' + margins.vertical + ')');

    gTime.call(sliderTime);

    d3.select('#slider-label').text(d3.timeFormat('%Y')(sliderTime.value()));

  } //,
  
  // update: function() {
  //   console.log(d3.select('.parameter-value'))

  // }
};

app = {
  data: [],
  components: [],

  globals: {
      available: {
        years: '',
        dates: {
          min: new Date(2007, 0),
          max: new Date(2017, 11)
        },
        range: ''
      },
      selected: {date: "2017-11",
                  year: 2017 },
      animating: false
  },

  initialize: function (data) {
      
      const [shp, urates, natl_industry, cty_industry] = data;
      app.data = {
        'shp': shp,
        'urates': urates,
        'natl_industry': natl_industry,
        'cty_industry': cty_industry,
        'fips2Value': urates.reduce((acc, row) => {
            acc[row.stcofips] = row.adj_urate;
            return acc;
          }, {})
      };

      app.globals.available.dates.range = d3.range(110).map(function(d) {
        return new Date(2007 + Math.floor(d / 10), d % 12, 1);
      });
      
      app.components.Controls = Controls.setup(app.globals.available.dates);

      app.components.Rug = main.makeRug(app.data.urates);
      app.components.Map = main.makeMap(app.data.shp, app.data.urates, app.data.fips2Value);
      app.components.natlBar = new IndustryBar('#bar1', app.data.natl_industry);
      app.components.ctyBar = new IndustryBar('#bar2', app.data.cty_industry);
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

  update: function (year) {

    app.globals.selected.year = year;

    currentYearFips2Urate = urates.filter(d => d.year + '-' + d.month === app.selected.date)
      .reduce((acc, row) => {
          acc[row.stcofips] = row.adj_urate;
        return acc;
      }, {});

      console.log(currentYearFips2Urate);
    
    for (var component in app.components) {
        if (app.components[component].update) {
            app.components[component].update()
        }
    }
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
  './data/us_counties.geojson',
  './data/adj-urate-2017.json',
  './data/national_industry_shares_07-18.json',
  './data/qcew-oh17.json'].map(url => fetch(url)
  .then(data => data.json())))
  .then(data => app.initialize(data))
  .then(app.update());


// REFERENCES
// Draws on https://github.com/cmgiven/gap-reminder-v4
// and on the various exercises/solutions in https://github.com/mcnuttandrew/capp-30239
// and on https://github.com/ivan-ha/d3-hk-map/blob/development/map.js
// https://bl.ocks.org/tiffylou/88f58da4599c9b95232f5c89a6321992
