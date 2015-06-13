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
var render = require(path.join(__dirname, 'lib/render')),
    mailer = require(path.join(__dirname, 'lib/mailer')),
    archiver = require(path.join(__dirname, 'lib/archiver')),
    addressBook = require(path.join(__dirname, 'addresses/list.json'));

function MailPlugin(options) {
  'use strict';

  console.log('Configuring MailPlugin ...');

  options =  options || {};

  this._running = true;
  this._timestamp = Date.now();

  // configure the emails
  this._emails = options.emails || [];
  this._timers = [];
  this._configure();
}

// interpret the cron tasks and schedule them
MailPlugin.prototype._configure = function () {
  var self = this,
      schedule;

  self._timers = self._emails.map(function (email) {

    // parse the cron task into a scheule
    schedule = later.parse.cron(email.frequency);

    // set a timer, which will
    var timer = later.setInterval(function () {
      var addresses = addressBook[email.addressList];
      addresses.forEach(function (contact) {
        self.send(email.name, contact);
      });
    }, schedule);

    return timer;
  });
};

// renders an email and sends it
// TODO - we should namespace by mailing list
MailPlugin.prototype.send = function (email, contact) {
  var base = __dirname + email + '/',
      data = require(base + 'preprocess.js')(contact.language),
      date = new Date();

  // render the email by templating data into the template
  var message = render(data.template, data.options);

  // use mailer to send the message
  mailer(contact, message, date)
  .then(function () {
    archiver(contact.name, message, date);
  })
  .done();
};

// expose module to the outside world
process.on('message', function (options) {
  var emailer = new MailPlugin(options);
});
