var Device = require('zetta-device');
var util = require('util');

var FonaFMRadio = module.exports = function() {
  Device.call(this);
  this._serialDevice = arguments[0];
  
  // properties
  this.volume = null;
  this.outputType = null;
  
  // property map
  this._outputTypesMap = {
    0: 'headset',
    1: 'external'
  };
  
};
util.inherits(FonaFMRadio, Device);

FonaFMRadio.prototype.init = function(config) {

  config
  .name('Adafruit Fona FM Radio')
  .type('fona-fm-radio')
  .monitor('volume')
  .state('off')
  .when('off', { allow: ['turn-on']})
  .when('on', { allow: ['turn-off']})
  .map('turn-on', this.turnOn, [
    { name: 'output', title: 'Audio Output', type: 'range',
      min: 0, max: 1, step: 1, value: 0, notes: this._outputTypesMap}])
  .map('turn-off', this.turnOff);

  var self = this;
  this._requestVitals();
  setInterval(function() {
    self._requestVitals();
  }, 60000);

};

FonaFMRadio.prototype.turnOn = function(outputTypeCode, cb) {
  var self = this;

   // swallowing the error in case it's already on
  this._serialDevice.enqueue(
    {command: 'AT+FMOPEN='+outputTypeCode, regexps: [/^AT\+FMOPEN=\d/,/(OK|ERROR)/]},
    function () {
      self.outputType = self._outputTypesMap[outputTypeCode]
      self.state = 'on';
      cb();
    });
}

FonaFMRadio.prototype.turnOff = function(cb) {
  var self = this;
  
  // swallowing the error in case it's already off
  this._serialDevice.enqueue(
    {command: 'AT+FMCLOSE', regexps: [/^AT\+FMCLOSE/,/(OK|ERROR)/]},
    function () {
      self.state = 'off';
      cb();
    });
}

FonaFMRadio.prototype._requestVolume = function() {
  var self = this;
  this._serialDevice.enqueueSimple('AT+FMVOLUME?', /^\+FMVOLUME: (\d+)/, function (matches) {
    self.volume = matches[1][1]
  });
}

FonaFMRadio.prototype._requestVitals = function() {
  this._requestVolume();
}
