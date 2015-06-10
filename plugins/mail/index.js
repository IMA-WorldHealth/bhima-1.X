/**
 *
 * Mail Plugin
 *
 * Extends bhima to allow email reporting.  Currently, only
 * daily reports are implimented.
 *
 */

var VERSION = '0.1.0';

// global imports
var q = require('q'),
    fs = require('fs'),
    path = require('path');

// local imports
var render = require(path.join(__dirname, 'lib/render.js')),
    query = require(path.join(__dirname, 'lib/query'));

function MailPlugin(options) {
  'use strict';

  this._running = true;
  this._timestamp = Date.now();

  // configure the scheduler
  this._emails = options.emails || ['daily'];
}

MailPlugin.prototype.start = function () {
  // TODO
  this._running = true;
};

MailPlugin.prototype.stop = function () {
  // TODO
  this._running = false;
};

MailPlugin.prototype.status = function () {
  return {
    uptime : Date.now() - this._timestamp,
    running : this._running
  };
};

MailPlugin.prototype.restart = function () {
  // TODO
  this.stop();
  this.start();
};

module.exports = MailPlugin;
