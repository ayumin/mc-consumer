$(window).ready(function() {

  var h_data = $('#history .temp li')

  function historical_data(i) {
    var value = parseInt($(h_data[h_data.length - i - 1]).text());
    if (isNaN(value)) { value = 0; }
    return {time:i, value:value};
  }

  var temp_data = d3.range(28).map(historical_data)
  var temp_t    = 28;
  var temp_chart = chart("#tempchart", temp_data);
  var last_battery = 0;

  var socket = io.connect('http://mc-control.herokuapp.com:80/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  set_temp(temp_data[temp_data.length-1].value);
  set_battery($('#history .battery li:last').text());

  socket.on('readings', function(readings) {
    set_battery(readings.battery);
    set_temp(readings.temp);
  });

  $('#broadcast').on('click', function() {
    var opts = {
      temp: $('#device .temp').text(),
      battery: last_battery
    };
    $.post('/broadcast', opts, function(data, status) {
      console.log('data', data);
      console.log('status', status);
    });
  });

  $('#set-temperature').on('click', function() {
    if ((temp = $('#set-temperature-to').val().replace(/\s/, '')) != '') {
      $.get('http://mc-control.herokuapp.com/sensor/' + $('#device').data('id') + '/set/temp/' + temp, function(a,b,c) {
        $('#set-temperature-to').val('');
      });
    }
  });

  function set_temp(val) {
    $('#device .temp').text(val);
    temp_data.shift();
    var new_data = {time: temp_t+=1, value: val};
    temp_data.push(new_data);
    temp_chart.redraw(temp_data);
  }

  function set_battery(pct) {
    last_battery = pct;

    $('#battery-level').css('width', pct + '%');

    $('#battery').removeClass('progress-success');
    $('#battery').removeClass('progress-warning');
    $('#battery').removeClass('progress-danger');

    if (pct > 30) {
      $('#battery').addClass('progress-success');
    } else if (pct > 10) {
      $('#battery').addClass('progress-warning');
    } else {
      $('#battery').addClass('progress-danger');
    }
  }
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

    rect.exit()
      .transition()
        .duration(1000)
        .remove();
  }

  return chart;
}
