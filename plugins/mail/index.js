/**
 * Mail Plugin
 *
 * Extends bhima to allow email reporting at a custom frequency.
 * Depends on later.js (http://bunkat.github.io/later/)
 *
 * PLUGIN OPTIONS
 * {
 *   name : 'mail',
 *   script : 'index.js',
 *   options : {
 *     emails : [{
 *       name : 'Daily Financial Report',
 *       frequency : 'daily',
 *       addressList : 'developers'
 *     }]
 *   }
 * ]
 */

var VERSION = '0.1.0';

// global imports
var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    later = require('later');

// local imports
var render = require(path.join(__dirname, 'lib/render.js')),
    query = require(path.join(__dirname, 'lib/query')),
    sender = require(path.join(__dirname, 'lib/sender')),
    address = require(path.join(__dirname, 'conf/address_list.json'));

function MailPlugin(options) {
  'use strict';

  console.log('Configuring MailPlugin ...');

  options =  options || {};

  this._running = true;
  this._timestamp = Date.now();

  // configure the emails
  this._emails = options.emails || [];
  this._queue = [];
  this._configure();
}

// interpret the cron tasks and schedule them
MailPlugin.prototype._configure = function () {
  var schedule;

  this._emails.forEach(function (email) {
    schedule = later.parse.cron(email.frequency);
    console.log('email', email);
  });
};

// renders an email and sends it
MailPlugin.prototype.send = function () {

};

// expose module to the outside world
process.on('message', function (options) {
  var emailer = new MailPlugin(options);
});
