// preprocessor for daily template

var fs = require('fs'),
    path = require('path'),
    q = require('q'),
    query = require(path.join(__dirname, '../../lib/query')),
    render = require(path.join(__dirname, '../../lib/render'));

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// this function is responsible for templating
// the sql queries and interpretting currencies properly
function renderSql(queries, date) {
  'use strict';

  var dfd = q.defer();

  // calculate the correct date to use for the database queries
  var dateFrom = '\'' + date.getFullYear() + '-0' + (date.getMonth() + 1) + '-' + date.getDate() + ' 00:00:00\'',
      dateTo = '\'' + date.getFullYear() + '-0' + (date.getMonth() + 1) + '-' + (date.getDate() + 1)  + ' 00:00:00\'';


  var promises = Object.keys(queries).map(function (k) {
    var sql = render(queries[k].query, { date : { from : dateFrom, to : dateTo } });
    console.log(sql);
    return query(sql);
  });


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

  // template and execute the sql queries
  var data = renderSql(queries, date);

  var options = {
    data : data,
    text : text
  };
}


module.exports = preprocess;
