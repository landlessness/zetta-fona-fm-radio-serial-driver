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

FonaFMRadio.prototype.turnOn = function(outputTypeCode, taskIsDone) {
  var self = this;

   // swallowing the error in case it's already on
  this._serialDevice.enqueue([
    {
      command: 'AT+FMOPEN=' + outputTypeCode, 
      regexp: /^$/
    },
    {
      regexp: /(OK|ERROR)/
    }],
    null,
    function () {
      self.outputType = self._outputTypesMap[outputTypeCode]
      self.state = 'on';
      taskIsDone();
    });
}

FonaFMRadio.prototype.turnOff = function(taskIsDone) {
  var self = this;
  
  // swallowing the error in case it's already off
  this._serialDevice.enqueue([
    {
      command: 'AT+FMCLOSE',
      regexp: /^$/
    },
    {
      regexp: /^OK|ERROR$/
    }],
    null,
    function () {
      self.state = 'off';
      taskIsDone();
    });
}

FonaFMRadio.prototype.setFrequency = function(frequency, taskIsDone) {
  var self = this;
  
  this._serialDevice.enqueue([
    {
      command: 'AT+FMFREQ=' + frequency,
      regexp: /^$/
    },
    {
      regexp: /OK/
    }],
    null,
    function () {
      self.frequency = frequency;
      taskIsDone();
    });

}

FonaFMRadio.prototype.getSignalLevel = function(frequency, taskIsDone) {
  var self = this;
  
  this._serialDevice.enqueue([
    {
      command: 'AT+FMSIGNAL=' + frequency,
      regexp: /^$/
    },
    { 
      regexp: /FMSIGNAL: freq\[\d+\]:(\d+)/,
      onMatch: function(match) {
        self.signalLevel = match[1];
        taskIsDone();
      }
    }]);
}

FonaFMRadio.prototype.setVolume = function(volume, taskIsDone) {
  var self = this;

  this._serialDevice.enqueue([
    {
      command: 'AT+FMVOLUME=' + volume,
      regexp: /^$/
    },
    {
      regexp: /OK/
    }],
    null,
    function () {
      self.volume = volume;
      taskIsDone();
    });
}

FonaFMRadio.prototype.getVolume = function(taskIsDone) {
  var self = this;
  this._serialDevice.enqueue([
    {
      command: 'AT+FMVOLUME?',
      regexp: /^$/
    },{
      regexp: /^\+FMVOLUME: (\d)$/,
      onMatch: function(match) {
        self.volume = match[1];
        taskIsDone();
      }
    },{
      regexp: /^$/
    },{
      regexp: /OK/
    }]);
}