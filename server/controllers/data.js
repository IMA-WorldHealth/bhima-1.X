// server/routes/data.js

// Route: /data/
//
// This module handles translated HTTP
// PUT/POST/GET/DELETE requests into database
// requests along the /data/ route.

var url = require('url'),
    qs = require('querystring');

module.exports = function dataRouter(db, parser, router) {
  'use strict';

  router.get('/', function (req, res, next) {
    var query, data, sql;

    query = qs.parse(decodeURI(url.parse(req.url).query)).q;
    data = JSON.parse(query);
    sql = parser.select(data);

    db.exec(sql)
    .then(function (rows) {
      res.send(rows);
    })
    .catch(next)
    .done();
  });

  router.put('/', function (req, res, next) {
    // TODO: change the client to stop packaging data in an array...
    var sql = parser.update(req.body.table, req.body.data[0], req.body.pk[0]);

    db.exec(sql)
    .then(function (ans) {
      res.send({ insertId: ans.insertId });
    })
    .catch(next)
    .done();
  });

  router.post('/', function (req, res, next) {
    // TODO: change the client to stop packaging data in an array...
    var sql = parser.insert(req.body.table, req.body.data);

    db.exec(sql)
    .then(function (ans) {
      res.send({ insertId: ans.insertId });
    })
    .catch(next)
    .done();
  });

  router.delete('/:table/:column/:value', function (req, res, next) {
    var sql = parser.delete(req.params.table, req.params.column, req.params.value);
    db.exec(sql)
    .then(function () {
      res.send();
    })
    .catch(next)
    .done();
  });

  return router;
};

