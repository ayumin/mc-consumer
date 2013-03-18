$(window).ready(function() {

  var h_data = $('#history .temp li')

  function historical_data(i) {
    var value = parseInt($(h_data[h_data.length - i - 1]).text());
    if (isNaN(value)) { value = 0; }
    return value;
    //return {time:i, value:value};
  }

  var temp_data = d3.range(28).map(historical_data)
  var temp_t    = 28;
  var temp_chart = chart("#tempchart", temp_data);
  var last_battery = 0;

  var socket = io.connect('http://mc-control.herokuapp.com:80/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  set_temp(temp_data[temp_data.length-1]);
  set_battery($('#history .battery li:last').text());

  socket.on('readings', function(readings) {
    set_battery(readings.battery);
    set_temp(readings.temp);
    console.log(readings);
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
    temp_chart.push(val);
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
      h = 120,
      margin = { left: 35, top: 0 };

  var x = d3.scale.linear()
      .domain([0, 1])
      .range([0, w]);

  var y = d3.scale.linear()
      .domain([-15, 50 ])
      .rangeRound([0, h]);

  var y1 = d3.scale.linear()
      .domain([50, -15])
      .rangeRound([0, h]);

  var yAxis = d3.svg.axis()
    .scale(y1)

  var chart = d3.select(selector).append("svg")
      .attr("class", "chart")
      .attr("width", w * data.length - 1)
      .attr("height", h)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // zero point line
  chart.append("line")
      .attr("x1", 0)
      .attr("x2", w * data.length)
      .attr("y1", y1(0))
      .attr("y2", y1(0))
      .style("stroke", "#aaa");

  var yAxis = d3.svg.axis()
    .orient('left')
    .scale(y1)
    .tickValues([40,30,20,10, 0, -10])

  //ticks
   chart.append("g")
    .attr("class", "y axis")
    .call(yAxis)

  //line
  var line = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d) { return h - y(d); })

  var path = chart.append("g")
      .attr("clip-path", "url(#clip)")
    .append("svg:path")
      .data([data])
      .attr("d", line)
      .attr('class', 'line')

  //update transition
  chart.push = function(v) {
    data.push(v)

    path
      .attr("d", line(data))
      .attr("transform", null)
    .transition()
      .ease("linear")
      .attr("transform", "translate(" + x(-1) + ")");

    data.shift();
  }

  return chart;
}
