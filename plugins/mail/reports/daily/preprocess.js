// preprocessor for daily template

var fs = require('fs'),
    path = require('path'),
    q = require('q'),
    query = require(path.join(__dirname, '../../lib/query')),
    locales = require(path.join(__dirname, '../../lib/locales')),
    render = require(path.join(__dirname, '../../lib/render'));

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// this function is rfe
function renderQuery(tpl, data) {
  var sql = render(tpl.query, data),
      dfd = q.defer();

  query(sql)
  .then(function (rows) {
    var res = rows[0];

    console.log(res);

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
    console.log(data);

    var options = {
      data : data,
      text : text
    };

  })
  .catch(console.error)
  .done();

}

module.exports = preprocess;
