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
      top: 50,
      left: 10,
      right: 70,
      bottom: 10
    };

    svg = d3.select('#rug').append('svg')
            .attr('width', margin.left + width + margin.right)
            .attr('height', margin.top + height + margin.bottom);
    
    const yScale = d3.scaleLinear()
                    .domain([0, maxUrate / 100])
                    .range([height, margin.top]);
    
    const xScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range([0, width]);
 
    const formatAsPercentage = d3.format("0.0%");
    const yAxis = d3.axisRight().scale(yScale).tickFormat(formatAsPercentage);
    

    svg.selectAll('rect')
      .data(urates)
      .enter()
      .append('rect')
      .attr('x', xScale(0.5))
      .attr('y', d => yScale(d.adj_urate / 100))
      .attr('width', 40)
      .attr('height', 1)
      .attr('fill',  d => app.colorScale(d.adj_urate))
      .attr('opacity', 0)
      .attr('id', d => 'rug-' + d.stcofips + '-' + d.year + '-' + d.month);  

    svg.append('g')
      .attr('class', 'text axis')
      .attr('transform', 'translate(' + (width + margin.right/2) + ',' + '0)')
      .call(yAxis);
 
    d3.selectAll('[text-anchor=middle]').attr('text axis');

    svg.append('text').text("Unemployment\nRate")
      .attr('class', 'text legend')
      .attr('transform', 'translate(0,' + 25  + ')');
 
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
Map = function(shp) {
  this.makeMap(shp);
};

Map.prototype = {
  makeMap: function (shp) {

    const width = 1000;
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
    
    geoGenerator = d3.geoPath().projection(d3.geoAlbersUsa().scale([1100]));

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

      margin = { top: 20, right: 20, bottom: 10, left: 20 };

      width = 900;
      height = 150;

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
               .range([0, width]),
          y: d3.scaleLinear()
              .domain([0, 1])
              .range([0, height]),
          width: d3.scaleLinear()
              .domain([0, 1])
              .range([0, width]),
          color: d3.scaleOrdinal()
              .domain(industries)
              .range(d3.schemeCategory10)
      };

      const formatAsPercentage = d3.format("0.0%");
      xAxis = d3.axisBottom().scale(chart.scales.width).tickFormat(formatAsPercentage);

      chart.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + (height/2 + margin.top) + ')')
          .call(xAxis);

      titleText = [{
        bar1: 'National share of jobs by major industry',
        bar2: 'Share of jobs by major industry in selected county' 
      }];

      title = chart.svg.selectAll('title bar').data(titleText);

      if (selector === '#bar1') {

        title.enter().append('text')
          .text(d => d.bar1)
          .attr('class', 'title bar')
          .attr('transform', 'translate('+ width / 3 + ',' + margin.top + ')');

      } else if (selector === '#bar2') {
        
        title.enter().append('text')
        .text(d => d.bar2)
        .attr('class', 'title bar')
        .attr('transform', 'translate('+ width / 4 + ',' + margin.top + ')');        
   
      };

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
              .attr('y', chart.scales.y(0.25))
              .attr('width', d => chart.scales.width(d.industry_share))
              .attr('height', 50)
              .attr('fill', d => chart.scales.color(d.industry_title))
              .attr('stroke', '#FFFFFF')
              .attr('id', d => selector + '-rect-' + d.industry_title)
              .on('mouseover', d => barMouseOver(d)); 

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
    sliderWidth = 1000;
    sliderHeight = 75;
    margins = { 
      horizontal: 30,
      vertical: 30,
    };

    label = d3.select('#slider-text')
      .append('text')
      .text('Slide the bar to watch the unemployment rate change over time. Darker colors indicate higher unemployment.');

    sliderObject = this;

    this.selected.year = dates.defaultYear;
    this.selected.month = dates.defaultMonth;

    sliderTime = d3.sliderBottom()
      .min(dates.min)
      .max(dates.max)
      .step(1000 * 60 * 60 * 24 * 30 * 3)
      .width(sliderWidth - 2 * margins.horizontal)
      .tickFormat(d3.timeFormat('%B %Y'))
      // .tickValues(dates.range)
      .default(new Date(dates.defaultYear, dates.defaultMonth))
      .on('onchange', _.debounce(function () { // 
        val = sliderTime.value();
        d3.select('#slider-label').text(d3.timeFormat('%B %Y')(val));
        // console.log(sliderObject);
        sliderObject.selected.year = sliderTime.value().getFullYear();
        sliderObject.selected.month = sliderTime.value().getMonth();
        app.updateTime()
      }, 200, { 'maxWait': 1000 }));

    gTime = d3.select('#slider')
      .append('svg')
      .attr('width', sliderWidth)
      .attr('height', sliderHeight)
      .append('g')
      .attr('class', 'slider')
      .attr('transform', 'translate(' + margins.horizontal + ',' + margins.vertical + ')');

    d3.select('#slider-label').text(d3.timeFormat('%B %Y')(sliderTime.value()));

    gTime.call(sliderTime)
      .selectAll(".tick text")
      .call(wrap, 50);

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
          min: new Date(2015, 0),
          max: new Date(2017, 11),
          defaultYear: 2017,
          defaultMonth: 1
        }
      },
      selected: { 
        date: '',
        year: '',
        month: '', 
        stcofips: '',
        county: ''
      }
    },
  
    fips2Name: '',
    urateScale: '',
    colorScale: '',

    setInitialValues: function () {
      app.globals.selected.date = '2017-02';
      app.globals.selected.year = 2017;
      app.globals.selected.month = 1;
      app.globals.selected.stcofips = '39035';
      app.globals.selected.county = 'Cuyahoga County, Ohio';
    },
  
    makeScales: function (maxUrate){
      app.urateScale = d3.scaleLinear()
      .domain([0, maxUrate])
      .range([1, 0]);
      app.colorScale = d => d3.interpolatePlasma(app.urateScale(d));
    },

    makeBarLegend: function(industries) {

      margin = { top: 50, right: 10, bottom: 10, left: 0 };
      width = 300;
      height = 400;

      svg = d3.select("#bar-legend")
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
      scales = {
          x: d3.scaleLinear()
               .domain([0, 1])
               .range([margin.left, width]),
          y: d3.scaleLinear()
              .domain([0, 15])
              .range([0, height]),
          color: d3.scaleOrdinal()
              .domain(industries)
              .range(d3.schemeCategory10)
      };

      // const l = d3.range(11).reduce((i) => { industries[industries[i]] = i; return industries;});
      l = [{industry_name: "Construction", y:0},
       {industry_name: "Education and health services", y:1},
       {industry_name: "Financial activities", y:2},
       {industry_name: "Information", y:3},
       {industry_name: "Leisure and hospitality", y:4},
       {industry_name: "Manufacturing", y:5},
       {industry_name: "Natural resources and mining", y:6},
       {industry_name: "Other services", y:7},
       {industry_name: "Professional and business services", y:8},
       {industry_name: "Trade, transportation, and utilities", y:9}];

      svg.selectAll('text legend title')
        .append('text')
        .text('Industries')
        .attr('x', scales.x(0.1))
        .attr('y', scales.y(1))
        .attr('class', 'text legend title');

      svg.selectAll('.rect').data(l)
        .enter()
        .append('rect')
        .attr('x', scales.x(0.1))
        .attr('y', d => scales.y(d.y) + 3)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => scales.color(d.industry_name))
        .attr('class', 'rect legend');

      svg.selectAll('text legend').data(l)
        .enter()
        .append('text')
        .text(d => d.industry_name)
        .attr('x', scales.x(0.2))
        .attr('y', d => scales.y(d.y) + 15)
        .attr('class', 'text legend label');
    },

    makeReferences: function() {

      margin = { top: 50, right: 10, bottom: 10, left: 10 };
      width = 1000;
      height = 400;

      svg = d3.select("#references")
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
      svg.selectAll('text references')
        .append('text')
        .text('Data sources: Bureau of Labor Statistics Local Area Unemployment Statistics (LAUS) and Quarterly Census of Employment and Wages (QCEW)')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('class', 'text references');

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
  
    showTooltip: function(name) {
      app.components.tooltip.transition()    
        .duration(200)    
        .attr('class', 'tooltip-on');
      app.components.tooltip.html(name)  
        .style("left", (d3.event.pageX) + "px")   
        .style("top", (d3.event.pageY - 28) + "px");
    },
  
    mouseOverHandler: function (d) {
      if (d.stcofips){
        stcofips = d.stcofips;
      } else {
        stcofips = d.properties.GEOID;
      };
      name = app.fips2Name[stcofips];
      app.highlight(stcofips);
      app.showTooltip(name);
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
      app.globals.selected.county = app.fips2Name[d.properties.GEOID];
      app.updateCounty();
      console.log(app.globals.selected.stcofips);
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

    app.setInitialValues();
      
    const [shp, urates, natl_industry, cty_industry, cty_names] = data;
    app.data = {
      shp: shp,
      urates: urates,
      natl_industry: natl_industry,
      cty_industry: cty_industry,
      max_urate: d3.max(urates, p => p.adj_urate),
      cty_names: cty_names,
      industries: [ ... new Set(natl_industry.map(x => x.industry_title))]
    };


    app.components.Controls = new Controls(app.globals.available.dates);
    app.makeTooltip();
    app.makeScales(app.data.max_urate);
    app.makeBarLegend(app.data.industries);
    app.makeReferences();

    // pull each period into its own sub-array so I can index in 
    // h/t to Cory Rand for mentioning d3.nest as a way to approach this problem
    app.data.uratesYear = d3.nest()
                            .key(d => d.year + '-' + d.month)
                            .rollup(v => v.reduce((acc, row) => {
                              acc[row.stcofips] = app.colorScale(row.adj_urate);
                              return acc;
                            }, {}))
                            .map(app.data.urates);

    // app.globals.available.dates.range = d3.range(110).map(function(d) {
    //   return new Date(2007 + Math.floor(d / 10), d % 12, 1);
    // });

    app.components.Rug = new Rug(app.data.urates, app.data.max_urate);
    app.components.Map = new Map(app.data.shp);


    app.fips2Name = app.data.cty_names.reduce((acc, row) => {
      acc[row.stcofips] = row.NAME;
      return acc;
    }, {});

    barCaption = d3.select('#bar-text')
      .append('text')
      .text("These charts show how this county's industry mix compares to the national aggregate."); 

    app.components.natlBar = new IndustryBar('#bar1', app.data.natl_industry, app.data.industries);
    
    app.components.ctyBar = new IndustryBar('#bar2', app.data.cty_industry, app.data.industries);

    app.updateTime();

  },

  updateTime: function () {
    // to do: segment this function into time and place

    selected = app.components.Controls.getDate();
    console.log(selected);
    app.globals.selected.year = selected.year;
    app.globals.selected.month = selected.month;
    app.globals.selected.date = selected.year + '-' + '0' * (selected.month + 1 < 10) + (selected.month + 1);

    currentYearFips2Urate = app.data.uratesYear['$' + app.globals.selected.date];

    app.components.Rug.updateRug(app.globals.selected.year, app.globals.selected.month);
    app.components.Map.updateMap(currentYearFips2Urate);
    
    app.components.ctyBar.update('#bar2', app.data.cty_industry)


  },

  updateCounty: function() {
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
