$(window).ready(function() {

  function bootstrap(){
    return {time: 0, value: 0};
  }

  var temp_data = d3.range(28).map(bootstrap)
  var temp_t    = 0;
  var temp_chart = chart("#tempchart", temp_data);

  var socket = io.connect('http://device-mothership.herokuapp.com:80/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  socket.on('readings', function(readings) {
    $('#device .temp').text(readings.temp);

    $('#battery-level').css('width', readings.battery + '%');

    //update temperature data chart
    temp_data.shift();
    var new_data = {time: temp_t+=1, value: readings.temp};
    temp_data.push(new_data);
    temp_chart.redraw(temp_data);

    $('#battery').removeClass('progress-success');
    $('#battery').removeClass('progress-warning');
    $('#battery').removeClass('progress-danger');

    if (readings.battery > 30) {
      $('#battery').addClass('progress-success');
    } else if (readings.battery > 10) {
      $('#battery').addClass('progress-warning');
    } else {
      $('#battery').addClass('progress-danger');
    }
  });
});

function chart(selector, data) {
  var w = 20,
      h = 120;

  var x = d3.scale.linear()
      .domain([0, 1])
      .range([0, w]);

  var y = d3.scale.linear()
      .domain([0, 100])
      .rangeRound([0, h]);

  var chart = d3.select(selector).append("svg")
      .attr("class", "chart")
      .attr("width", w * data.length - 1)
      .attr("height", h);

  chart.selectAll("rect")
      .data(data)
    .enter().append("rect")
      .attr("x", function(d, i) { return x(i) - .5; })
      .attr("y", function(d) { return h - y(d.value) - .5; })
      .attr("width", w)
      .attr("height", function(d) { return y(d.value); });

  chart.append("line")
      .attr("x1", 0)
      .attr("x2", w * data.length)
      .attr("y1", h - .5)
      .attr("y2", h - .5)
      .style("stroke", "#aaa");

  chart.redraw = function (data) {

    var rect = this.selectAll("rect")
        .data(data, function(d) { return d.time; });

    rect.enter().insert("rect", "line")
        .attr("x", function(d, i) { return x(i + 1) - .5; })
        .attr("y", function(d) { return h - y(d.value) - .5; })
        .attr("width", w)
        .attr("height", function(d) { return y(d.value); })
      .transition()
        .duration(1000)
        .attr("x", function(d, i) { return x(i) - .5; });

    rect.transition()
        .duration(1000)
        .attr("x", function(d, i) { return x(i) - .5; });

    rect.exit().remove();

  }

  return chart;
}
