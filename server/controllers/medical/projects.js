
var db = require('../lib/db');

exports.getProjects = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT p.id, p.enterprise_id, p.abbr, p.name FROM project AS p;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};
