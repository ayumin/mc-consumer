$(window).ready(function() {

  var h_data = $('#history .temp li')

  function historical_data(i) {
    $node = $(h_data[h_data.length - i - 1])
    var value = parseInt($node.text());
    var time  = $node.attr('data-time')
    //if (isNaN(value)) { value = 0; }
    return {x:(new Date(time)), y:value};
  }

  temp_data = d3.range(20).map(historical_data)
  var last_battery = 0;

  var socket = io.connect('http://mc-control.herokuapp.com:80/');
  //var socket = io.connect('http://localhost:5100/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  set_temp(temp_data[temp_data.length-1].y, new Date());
  set_battery($('#history .battery li:last').text());

  socket.on('readings', function(readings) {
    set_battery(readings.battery);
    var time = new Date();
    if(readings.time) time = new Date(readings.time);
    set_temp(parseFloat(readings.temp), time);
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

 Highcharts.setOptions({
      global: {
          useUTC: false
      }
  });

  window.chart = new Highcharts.Chart({
    chart: {
      height: 200,
      renderTo: 'tempchart',
      type: 'spline',
      marginRight: 10,
      events: {},
    },
    title: {
      text: 'Temperature Readings'
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: 'Temp (C)'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    },
    tooltip: {
      formatter: function() {
        return '<b>'+ this.series.name +'</b><br/>'+
        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+
        Highcharts.numberFormat(this.y, 2);
      }
    },
    legend: { enabled: false },
    exporting: { enabled: false },
    series: [{
      name: "Temperature",
      data: temp_data
    }]
  });

  function set_temp(val, time) {
    $('#device .temp').text(val);
    if(window.chart) {
      console.log(time, val)
      window.chart.series[0].addPoint({x:time, y:val}, true, true);
    }
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




