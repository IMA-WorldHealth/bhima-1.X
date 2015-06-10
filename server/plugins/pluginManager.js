/**
 * PluginManager.js
 *
 * A bare bones plugin manager.  It is meant to look very much like the linux
 * process management.  It creates hooks for the startup of plugins, restarts,
 * and halts.
 *
*/

var path =  require('path');

function PluginManager(cfg) {
  'use strict';

  var plugins = {};

  function echo() {
    var args = Array.prototype.slice.call(arguments);
    console.log('[PluginManager]', args.join(' '));
  }

  // PluginManager Methods

  this._onStartup = function () {
    echo('_onStartup Event Fired.');

    // load and map the plugins to their namespaces
    // TODO Should we have a 'priority' tag to determine which happens first?
    // This would result in sorting the array by priority prior to loading it
    cfg.plugins.forEach(function (plugin) {
      echo('Loading ' + plugin.name);
      // TODO : Configure plugins to use this interface
      //plugins[plugin.name] = require(path.join('./server/plugins/', plugin.script));
    });

  };

  this._onClose = function () {
    echo('_onClose() Event Fired.');
  };

  // system calls
  
  this.start = function (names) {
    echo('Start Event Fired.');
  };

  this.restart = function (names) {
    echo('Restart Event Fired.');
  };

  this.status = function (names) {
    echo('Status Event Fired.');
  };

  this.stop = function (names) {
    echo('Stop Event Fired.');
  };

  // TODO write safety hatches for accidental
  // process.exit();
  
  this._onStartup();
}

module.exports = function (app, config) {
  'use strict';

  var PM = new PluginManager(config);
  
  // do some other cool stuff
};

