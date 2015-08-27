/**
 * Mail Plugin
 *
 * Extends bhima to allow email reporting at a custom frequency.
 * Depends on later.js (http://bunkat.github.io/later/) and q.
 *
 * PLUGIN OPTIONS
 * {
 *   emails : [{
 *     name : 'Daily Financial Report',
 *     frequency : 'daily',
 *     addressList : 'developers'
 *   }]
 * ]
 */

// Global Constants
// TODO refactor into custom config.js
var VERSION = '0.1.0',
    APPNAME = 'bhima',
    CONFIG  = './config.js';

// global imports
var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    later = require('later');

// local imports
var render = require(path.join(__dirname, 'lib/render')),
    mailer = require(path.join(__dirname, 'lib/mailer')),
    archiver = require(path.join(__dirname, 'lib/archiver')),
    query = require(path.join(__dirname,'lib/query')),
    locales = require(path.join(__dirname,'lib/locales')),
    util = require(path.join(__dirname, 'lib/util')),

    // email addresses
    addressBook = require(path.join(__dirname, 'addresses/list.json')),
    contacts = require(path.join(__dirname, 'addresses/contacts.json'));


function MailPlugin() {
  'use strict';

  var options = require(CONFIG);

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

    // parse the cron task into an executable scheule
    schedule = later.parse.cron(email.frequency);

    console.log('[MailPlugin] Setting up mailing list:', email.name);

    // timer function repeats on intervals defined by the email.frequency schedule
    var timer = later.setInterval(function () {

      // retrieve the address list
      var addresses = addressBook[email.addressList];

      // use send() to deliver messages to contacts;
      addresses.forEach(function (contact) {
        self.send(email.addressList, email.name, contacts[contact], new Date());
      });
    }, schedule);

    return timer;
  });
};

// respond to a reconfigure event from the client
MailPlugin.prototype.reconfigure = function (options) {

  // if a new configuration has not been provided, reload the old
  options = options || require(CONFIG);

  this._emails = options.emails || [];
  this._timers = [];
  this._configure();
};

// renders an email and sends it to a given contact
MailPlugin.prototype.send = function (list, email, contact, date) {

  // format paths appropriately
  var base = path.join(__dirname, 'reports', email),

      // load database queries
      queries = require(path.join(base,  'queries.json')),

      // load l10n text
      text = require(path.join(base, 'lang', contact.language + '.json')),

      // load template HTML document
      tpl = fs.readFileSync(path.join(base, email + '.tmpl.html'), 'utf8'),
      message;

  // convert date into a database-friendly date

  var dateFrom = new Date(), dateTo = date;

   switch (email) {
    
    case 'daily':
      console.log('[MailPlugin] Configuring the daily mail ...');
      break;

    case 'weekly':
      console.log('[MailPlugin] Configuring the weekly mail ...');
      dateFrom.setDate(date.getDate() - date.getDay());
      break;

    case 'monthly':
      console.log('[MailPlugin] Configuring the monthly mail ...');
      dateFrom.setDate(1);
      break;

    default:
      console.log('Cannot understand email name');
      break;
  }

  dateFrom = '\'' + dateFrom.getFullYear() + '-0' + (dateFrom.getMonth() + 1) + '-' + dateFrom.getDate() + ' 00:00:00\'';
  dateTo = '\'' + dateTo.getFullYear() + '-0' + (dateTo.getMonth() + 1) + '-' + (dateTo.getDate())  + ' 00:00:00\'';


  // loop through the queries and do the following:
  // 1) template in the date fields
  // 2) execute the queries using the query() function
  // 3) upon successful execution, convert result into proper locale
  var promises = Object.keys(queries).map(function (k) {
    var dfd = q.defer(),
        template = queries[k],

        // template the sql query with correct dates
        sql = render(template.query, { date : { to : dateTo, from : dateFrom }});

    // execute the templated query
    query(sql)
    .then(function (rows) {

      // all queries return a single number in the `total` field
      // var result = (rows.length) ? rows[0].total : 0;

      var results = rows

      // if the result is a currency, make sure it is in the correct locality
      // NOTE : this is NOT the email locality, it is defined by the query.
      if (template.type === 'currency') {
        template.results = locales.currency(results, template.format);
      } else {
        template.results = results;
      }

      // resolve the original query with the data formatted and
      // cached in the result property
      dfd.resolve(template);
    })
    .catch(dfd.reject)
    .done();

    return dfd.promise;
  });

  // all queries have been executed and the data is cached in the result
  // property
  q.all(promises)
  .then(function (results) {

    var data = {},
        templatedText,
        options;

    // convert promise array to a data object
    Object.keys(queries).forEach(function (key, idx) {
      data[key] = results[idx].results;          
    });

    data = lineUp(data);

    console.log(data);

    // now, we want to render the language file
    // util.map() applies the function provided recursively
    // to all non-object values in the object
    templatedText = util.map(text, function (content) {
      return render(content, { queries : data });
    });

    // collate data and text for email templating
    options = {
      date       : locales.date(new Date()),
      reportname : email,
      uuid       : util.uuid(),
      appname    : APPNAME,
      data       : data,
      text       : templatedText
    };

    // render the email
    message = render(tpl, options);

    // use mailer to send the message
    return mailer(list, contact, message, date);
  })
  .then(function () {

    // after message is sent, archive a copy in /archive
    archiver(list + '-' + contact.address.toLowerCase(), message, date);
  })
  .catch(function (error) {
    throw error;
  })
  .done();
};

function lineUp(data){

  Object.keys(data).forEach(function (key, idx){
    var obj = {}; //will contains transformed data from array
    data[key].forEach(function (item){
      item.period ? obj[item.period] = {"total" : item.total} : obj["total"] = item.total;
    });
    data[key] = obj;
  });
  return data;
}

// This the plugin runtime.  We define the global
// `plug` variable that will be configured on events
// from the outside world.
var plug = new MailPlugin();

// expose module to the outside world
process.on('message', function (msg) {

  // this is really limited for now
  // ideally, we should have a ton of events and
  // might want to switch to an object router model
  switch (msg.event) {

    // configure the plugin
    case 'reconfigure':
      console.log('[MailPlugin] Reconfiguring the mail plugin...');
      plug._configure(msg.options) ;
      break;

    // log the missed event
    default:
      console.log('[MailPlugin] Cannot understand event.');
      break;
  }
});
