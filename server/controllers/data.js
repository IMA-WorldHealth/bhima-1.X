var url = require('url');
var qs = require('querystring');
var db = require('../lib/db');
var parser = require('../lib/parser');

/* 
 * HTTP Controllers
*/
exports.create = function create(req, res, next) { 
  // TODO: change the client to stop packaging data in an array...
  var sql = parser.insert(req.body.table, req.body.data);

  db.exec(sql)
  .then(function (ans) {
    res.send({ insertId: ans.insertId });
  })
  .catch(next)
  .done();
};

exports.read = function read(req, res, next) { 
  var query, data, sql;
  
  console.log('reading data');
  query = qs.parse(decodeURI(url.parse(req.url).query)).q;
  data = JSON.parse(query);
  sql = parser.select(data);

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

exports.update = function update(req, res, next) { 
  // TODO: change the client to stop packaging data in an array...
  var sql = parser.update(req.body.table, req.body.data[0], req.body.pk[0]);

  db.exec(sql)
  .then(function (ans) {
    res.send({ insertId: ans.insertId });
  })
  .catch(next)
  .done();
};

// TODO Ensure naming conventions are consistent - delete is a keyword in javascript
exports.deleteRecord = function deleteRecord(req, res, next) { 
  var sql = parser.delete(req.params.table, req.params.column, req.params.value);
  db.exec(sql)
  .then(function () {
    res.send();
  })
  .catch(next)
  .done();
};
