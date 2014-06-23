// server/routes/data.js
//
// Route: /data/
//
// This module handles translated HTTP
// PUT/POST/GET/DELETE requests into database
// requests along the /data/ route.

var url = require('url');

module.exports = function dataRouter(db, parser) {

  return {

    get :  function (req, res, next) {
      var decode = JSON.parse(decodeURI(url.parse(req.url).query));
      var sql = parser.select(decode);
      db.exec(sql)
      .then(function (rows) {
        res.send(rows);
      })
      .catch(function (err) {
        next(err);
      })
      .done();
    },

    put : function (req, res, next) {
      // TODO: change the client to stop packaging data in an array...
      var sql = parser.update(req.body.table, req.body.data[0], req.body.pk[0]);

      db.exec(sql)
      .then(function (ans) {
        res.send(200, {insertId: ans.insertId});
      })
      .catch(function (err) {
        next(err);
      })
      .done();
    },
 
    post : function (req, res, next) {
      // TODO: change the client to stop packaging data in an array...
      var sql = parser.insert(req.body.table, req.body.data);

      db.exec(sql)
      .then(function (ans) {
        res.send(200, {insertId: ans.insertId});
      })
      .catch(function (err) {
        next(err);
      })
      .done();
    },

    delete : function (req, res, next) {
      var sql = parser.delete(req.params.table, req.params.column, req.params.value);
      db.exec(sql)
      .then(function () {
        res.send(200);
      })
      .catch(function (err) {
        next(err);
      })
      .done();
    }
  };
};

