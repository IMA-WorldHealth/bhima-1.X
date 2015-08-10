/*
 * query.js
 *
 * An interface to the database for mail plugin
 */

var mysql = require('mysql'),
    path = require('path'),
    q = require('q');

// TODO Set up absolute path to top of server structure
var cfg = require(path.join(__dirname, '../../../server/config/environment/server'));

// TODO extract to config file ignored by git
var connection = mysql.createConnection({
  host : cfg.db.host,
  user : cfg.db.user,
  password : cfg.db.password,
  database : cfg.db.database
});

// provide a promise-based query interface
function query(sql, data) {
  'use strict';
  var dfd = q.defer();

  connection.query(sql, data, function (err, res) {
    if (err) { dfd.reject(err); }
    dfd.resolve(res);
  });

  return dfd.promise;
}

module.exports = query;
