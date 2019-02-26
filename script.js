// CECILE MURRAY

d3.json('black_white_unemployment_long.json')
.catch(function(error, data) {
  console.log(error);
})
.then(function(data) {
  dataset = cleanData(data);
  makeScatterplot();
});
