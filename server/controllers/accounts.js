
var db = require('../lib/db');

// GET /accounts
exports.getAccounts = function (req, res, next) {
  'use strict';

  // TODO
  // This should probably take a query string for filtering to
  // make it more useful all around.
  // Some ideas: 
  // ?classe=5, ?type=ohada, etc...
  
  var sql =
    'SELECT a.id, a.account_number, a.account_txt, a.parent, at.type ' +
    'FROM account AS a JOIN account_type AS at ON ' +
      'a.account_type_id = at.id';

  if (req.query.type === 'ohada') {
    sql += ' WHERE a.is_ohada = 1;';
  }

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

// GET /account/:id
// FIXME/TODO
exports.getAccountById = function (req, res, next) {
  'use strict';
  
  var sql, id = req.param.id;

  sql =
    'SELECT a.id, a.account_number, a.account_text, a.parent, at.type ' +
    'FROM account AS a JOIN account_type AS at ON ' +
      'a.account_type_id = at.id ' +
    'WHERE a.id = ?;';
  
  db.exec(sql, [id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};
