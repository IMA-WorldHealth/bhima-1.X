/**
 * Preprocessor for the daily report template.
 *
 * This script is responsible to doing the follow items:
 *  1) Interpretting the date into MySQL format
 *  2) Templating the date into queries.json and executing them
 *  3) Using locales.js to interpret the result of executing queries.json
 *  4) Template the results into the {lang}.json template
 *  5) Template the result from {lang}.json and queries.json in to
 *     the dialy.tmpl.html file
 */
var fs = require('fs'),
    path = require('path'),
    q = require('q'),
    query = require(path.join(__dirname, '../../lib/query')),
    locales = require(path.join(__dirname, '../../lib/locales')),
    render = require(path.join(__dirname, '../../lib/render'));

function guid() { // v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// this function will template and execute a query.
// it then translates based on the local and caches
// the result in data.result
function renderQuery(tpl, data) {
  var sql = render(tpl.query, data),
      dfd = q.defer();

  query(sql)
  .then(function (rows) {
    var res = rows[0];

    // format to locality
    if (tpl.type === 'currency') {
      tpl.result = locales.currency(res.total, tpl.format);
    } else {
      tpl.result = res.total;
    }

    dfd.resolve(tpl);
  })
  .catch(dfd.reject)
  .done();

  return dfd.promise;
}

// takes in an object of templates
function templateRecurse(templates, data) {
  for (var key in templates) {
    if (typeof templates[key] === 'object' && templates[key] !== null) {

      // recurse
      templateRecurse(templates[key], data);
    } else {

      // we have something to render!
      templates[key] = render(templates[key], data); 
    }
  }

  return templates;
}

function preprocess(language) {
  'use strict';

  // default lang and currency
  language = language || 'en';

  var base = __dirname,

      // since we are running in a separate thread,
      // we can use blocking i/o without regret
      tpl = fs.readFileSync(path.join(base, 'daily.tmpl.html'), 'utf8'),

      // parse the language file to fill in the text fields in the temaplate
      text = require(path.join(base, 'lang', language + '.json')),

      // parse the queries that will fill in the data fields in the template
      queries = require(path.join(base, 'queries.json')),

      // get today's date
      date = new Date();


  var dateFrom = '\'' + date.getFullYear() + '-0' + (date.getMonth() + 1) + '-' + date.getDate() + ' 00:00:00\'',
      dateTo = '\'' + date.getFullYear() + '-0' + (date.getMonth() + 1) + '-' + (date.getDate() + 1)  + ' 00:00:00\'';

  var promises = Object.keys(queries).map(function (k) {
    return renderQuery(queries[k], { date : { to : dateTo, from : dateFrom }});
  });

  // execute all the queries and render them
  q.all(promises)
  .then(function (data) {
    var datas = {};

    // restash into an object and template the text
    Object.keys(queries).forEach(function (key, idx) {
      datas[key] = data[idx].result;
    });

    // try templating
    var texts = templateRecurse(text, {queries: datas});

    var options = {
      data : datas,
      text : texts
    };

    var rendered  = render(tpl, options);
    console.log(rendered);

  })
  .catch(console.error)
  .done();

}

module.exports = preprocess;
