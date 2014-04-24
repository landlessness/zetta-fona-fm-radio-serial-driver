var Device = require('zetta-device');
var util = require('util');

var FonaFMRadio = module.exports = function() {
  Device.call(this);
  this._serialDevice = arguments[0];
  
  // properties
  this.volume = null;
  this.outputType = null;
  this.signalLevel = null;
  this.frequency = null;
  
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
  .state('off')
  .when('off', { allow: ['turn-on']})
  .when('on', { allow: ['turn-off', 'set-frequency', 'get-signal-level', 'set-volume', 'get-volume']})
  .map('turn-on', this.turnOn, [
    { name: 'output', title: 'Audio Output', type: 'radio', 
      value: [{value: 0, text: this._outputTypesMap[0]},
      {value: 1, text: this._outputTypesMap[1]}]}])
  .map('set-frequency', this.setFrequency, [
    { name: 'frequency', title: 'FM Frequency', type: 'range',
      min: 870, max: 1090, step: 1 }])
  .map('get-volume', this.getVolume)
  .map('get-signal-level', this.getSignalLevel, [
    { name: 'frequency', title: 'FM Frequency', type: 'range',
      min: 870, max: 1090, step: 1 }])
  .map('set-volume', this.setVolume, [
    { name: 'volume', title: 'Volume', type: 'range',
      min: 0, max: 6, step: 1 }])
  .map('turn-off', this.turnOff);
  
  var self = this;
  
  this.turnOff(function() {});
};

FonaFMRadio.prototype.turnOn = function(outputTypeCode, cb) {
  var self = this;

   // swallowing the error in case it's already on
  this._serialDevice.enqueue(
    {command: 'AT+FMOPEN=' + outputTypeCode, regexps: [/^AT\+FMOPEN=\d/,/(OK|ERROR)/]},
    function () {
      self.outputType = self._outputTypesMap[outputTypeCode]
      self.state = 'on';
      cb();
      self.getVitals();
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

FonaFMRadio.prototype.setFrequency = function(frequency, cb) {
  var self = this;
  
  this._serialDevice.enqueue(
    {command: 'AT+FMFREQ=' + frequency, regexps: [/^AT\+FMFREQ=\d+/,/OK/]},
    function () {
      self.frequency = frequency;
      self.getSignalLevel(frequency, function() {
        cb();
      });
    });
}

FonaFMRadio.prototype.getSignalLevel = function(frequency, cb) {
  var self = this;
  
  this._serialDevice.enqueueSimple(
    'AT+FMSIGNAL=' + frequency,
    /FMSIGNAL: freq\[\d+\]:(\d+)/,
    function (matches) {
      self.signalLevel = matches[1][1];
      cb();
    });
}

FonaFMRadio.prototype.setVolume = function(volume, cb) {
  var self = this;
  
  this._serialDevice.enqueue(
    {command: 'AT+FMVOLUME=' + volume, regexps: [/^AT\+FMVOLUME=\d+/,/OK/]},
    function () {
      self.volume = volume;
      cb();
    });
}

FonaFMRadio.prototype.getVolume = function() {
  var self = this;
  this._serialDevice.enqueueSimple('AT+FMVOLUME?', /^\+FMVOLUME: (\d+)/, function (matches) {
    self.volume = matches[1][1]
  });
}

FonaFMRadio.prototype.getVitals = function() {
  this.getVolume();
}