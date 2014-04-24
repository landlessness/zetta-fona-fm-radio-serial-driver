var Scout = require('zetta-scout');
var util = require('util');
var FonaFMRadio = require('./fona_fm_radio');

var FonaFMRadioScout = module.exports = function() {
  Scout.call(this);
};
util.inherits(FonaFMRadioScout, Scout);

FonaFMRadioScout.prototype.init = function(next) {
  var fonaFMRadioQuery = this.server.where({type: 'fona-fm-radio'});
  var serialDeviceQuery = this.server.where({ type: 'serial' });

  var self = this;
  
  this.server.observe(serialDeviceQuery, function(serialDevice) {
    self.server.find(fonaFMRadioQuery, function(err, results) {
      if (results[0]) {
        self.provision(results[0], FonaFMRadio, serialDevice);
      } else {
        self.discover(FonaFMRadio, serialDevice);
      }
      next();
    });
  });

}