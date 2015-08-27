var db = require('../lib/db');

// POST /users
exports.createUser = function (req, res, next) {
  'use strict';
  
  var sql, data = req.body;

  // make sure that we have a valid username, password
  // combination
   
  if (!data.username || !data.password) {
    return res.status(400).json({ reason : 'ERROR.ERR_INVALID_USERNAME_OR_PASSWORD' });
  }

  sql =
    'INSERT INTO user (username, password, first, last, email) VALUES ' +
    '(?, PASSWORD(?), ?, ?, ?);';

  db.exec(sql, [data.username, data.password, data.first, data.last, data.email])
  .then(function (inserted) {
    res.status(200).send(inserted);
  })
  .catch(function (error) {
    console.error('Error:', error);
    res.status(500).send(error);
  })
  .done();
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
