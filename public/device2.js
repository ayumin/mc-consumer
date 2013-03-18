$(window).ready(function() {

  var h_data = $('#history .temp li')

  function historical_data(i) {
    var value = parseInt($(h_data[h_data.length - i - 1]).text());
    if (isNaN(value)) { value = 0; }
    return {x:i, y:value};
  }

  temp_data = d3.range(28).map(historical_data)
  var temp_t    = 28;
  var last_battery = 0;

  var socket = io.connect('http://mc-control.herokuapp.com:80/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  set_temp(temp_data[temp_data.length-1].value);
  set_battery($('#history .battery li:last').text());

  socket.on('readings', function(readings) {
    set_battery(readings.battery);
    set_temp(parseFloat(readings.temp));
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

  window.chart = new Highcharts.Chart({
    chart: {
      renderTo: 'tempchart',
      type: 'spline',
      marginRight: 10,
      events: {},
    },
    title: {
      text: 'Temperature Readings'
    },
    xAxis: {
      //type: 'datetime',
      //tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: 'Value'
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
        //Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+
        Highcharts.numberFormat(this.y, 2);
      }
    },
    legend: { enabled: false },
    exporting: { enabled: false },
    series: [{
      name: "Temp Data",
      data: temp_data
    }]
  });

  function set_temp(val) {
    $('#device .temp').text(val);
    if(window.chart) {
      window.chart.series[0].addPoint([temp_t, val], true, true);
    }
    temp_t += 1;
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




