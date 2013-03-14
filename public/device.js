$(window).ready(function() {

  var socket = io.connect('http://device-mothership.herokuapp.com:80/');

  socket.on('connect', function() {
    socket.emit('listen-device', $('#device').data('id'));
  });

  socket.on('readings', function(readings) {
    $('#device .temp').text(readings.temp);

    $('#battery-level').css('width', readings.battery + '%');

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
