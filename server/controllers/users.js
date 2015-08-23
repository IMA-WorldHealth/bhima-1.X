var db = require('../lib/db');

// POST /users
exports.createUser = function (req, res, next) {

};

// GET /users
exports.getUsers = function (req, res, next) {

};

// GET /users/:id
exports.getUserById = function (req, res, next) {

};

// GET /languages
// TODO - where does this actually belong?
exports.getLanguages = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT lang.id, lang.name, lang.key FROM language AS lang;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};
