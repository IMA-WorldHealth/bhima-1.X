// server/controllers/users.js

var db = require('../lib/db');

// GET /users
// get a list of the users in the database
exports.getUsers = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT u.id, u.username, u.email, u.first, u.last ' +
    'FROM users AS u;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

// POST /users
// This request creates a user in the database, hashing
// the user password first.
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
  .catch(next)
  .done();
};

// PUT /users/:id
exports.updateUser = function (req, res, next) {
  var sql = 'UPDATE user SET ',
      data = req.body,
      id = req.params.id;

  // we have to do manual parsing here because we are using MySQL function
  var params = [];

  for (var key in data) {

    if (data.hasOwnProperty(key)) {
      if (key === 'password') {

        // FIXME - this is a hack.  MySQL passwords start with a '*', so we can
        // filter out the chnaged passwords based on that
        var changed = data[key][0] !== '*';
        if (changed) {
          params.push('password = PASSWORD(' + db.escape(data[key]) + ')');
        }
      } else {
        params.push(key + ' = ' + db.escape(data[key]));
      }
    }
  }

  sql += params.join(', ');
  sql += ' WHERE  id = ?;';

  db.exec(sql, [id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

// DELETE /users/:id
// FIXME - not everyone should be able to do this.  What about
// permissions?
exports.removeUser = function (req, res, next) {
  'use strict';

  var sql =
    'DELETE FROM user WHERE id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
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

exports.authenticatePin = function (req, res, next) {
  var decrypt = req.params.pin >> 5;
  var sql = 'SELECT pin FROM user WHERE user.id = ' + req.session.user.id +
    ' AND pin = \'' + decrypt + '\';';
  db.exec(sql)
  .then(function (rows) {
    res.send({ authenticated : !!rows.length });
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

