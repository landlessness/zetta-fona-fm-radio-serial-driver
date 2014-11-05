var zetta = require('zetta');
var SerialDevice = require('zetta-serial-device-driver');
var FonaFMRadio = require('../index');

zetta()
  .use(SerialDevice, '/dev/cu.usbserial')
  .use(FonaFMRadio)
  .listen(1337);
