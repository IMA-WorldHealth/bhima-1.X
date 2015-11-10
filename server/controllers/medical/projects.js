
var db = require('../../lib/db');

exports.getProjects = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT project.id, project.enterprise_id, project.abbr, project.name ' +
    'FROM project;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};
