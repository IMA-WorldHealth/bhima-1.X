// server/controllers/users.js
/**
* The /users HTTP API endpoint.
*
* This controller is responsible for implementing full CRUD on the
* user table via the /users endpoint.
*/
var db = require('../lib/db');

/**
* GET /users
*
* If the client queries to /users endpoint, the API will respond with an array
* of zero or more JSON objects, with id, and username keys.
*/
exports.list = function list(req, res, next) {
  'use strict';

  var sql;

  sql =
    'SELECT user.id, CONCAT(user.first, \' \', user.last) AS displayname, ' +
      'user.username FROM user;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};


/**
* GET /users/:id
*
* This endpoint will return a single JSON object containing the full user row
* for the user with matching ID.  If no matching user exists, it will return a
* 404 error.
*/
exports.details = function details(req, res, next) {
  'use strict;';

  var sql =
    'SELECT user.id, user.username, user.email, user.first, user.last, ' +
      'user.active, user.last_login AS lastLogin ' +
    'FROM user WHERE user.id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (rows) {
    if (!rows.length) {
      return res.status(404).send();
    }

    // send back JSON
    res.status(200).json(rows[0]);
  })
  .catch(next)
  .done();
};


/**
* GET /users/:id/permissions
*
* Lists all the user permissions for user with :id
*/
exports.permissions = function permissions(req, res, next) {
  'use strict';

  var sql =
    'SELECT permission.id, permission.unit_id FROM permision ' +
    'WHERE permission.user_id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

/**
* GET /users/:id/projects
*
* Lists all the user project permissions for user with :id
*/
exports.projects = function projects(req, res, next) {
  'use strict';

  var sql =
    'SELECT pp.id, pp.project_id, project.name ' +
    'FROM project_permission AS pp JOIN project ON pp.project_id = project.id ' +
    'WHERE pp.user_id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};


/**
* POST /users
*
* This endpoint creates a new user from a JSON object.  The following fields are
* required and will result in a 400 error if not provided: username, password,
* first, last, email.
*
* If the checks succeed, the user password is hashed and stored in the database.
* A single JSON is returned to the client with the user id.
*/
exports.create = function create(req, res, next) {
  'use strict';

  var sql, requiredKeys, missingKeys,
      data = req.body;

  requiredKeys = [
    'username', 'password', 'first', 'last', 'email'
  ];

  // if the data object is missing keys, they will be left in the missingKeys
  // array
  missingKeys = requiredKeys.filter(function (key) {
    return !data[key];
  });

  // send a 400 response to the client
  if (missingKeys.length > 0) {
    return res.status(400)
    .json({
      code : 'ERROR.ERR_MISSING_INFO',
      reason: 'A username, password, first name, last name, and email are ' +
              'required to create a user.',
      missingKeys : missingKeys,
    });
  }

  sql =
    'INSERT INTO user (username, password, first, last, email) VALUES ' +
    '(?, PASSWORD(?), ?, ?, ?);';

  db.exec(sql, [data.username, data.password, data.first, data.last, data.email])
  .then(function (row) {
    res.status(201).send({ id : row.insertId });
  })
  .catch(next)
  .done();
};


/**
* PUT /users/:id
*
* This endpoint updates a user's information with ID :id.  If the user is not
* found, the server sends back a 404 error.
*/
exports.update = function update(req, res, next) {
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
  .then(function () {

    // fetch the entire changed object to send back to the client
    sql =
      'SELECT user.id, user.username, user.email, user.first, user.last, ' +
        'user.active, user.last_login AS lastLogin ' +
      'FROM user WHERE user.id = ?;';

    return db.exec(sql, [id]);
  })
  .then(function (rows) {
    res.status(200).json(rows[0]);
  })
  .catch(next)
  .done();
};

/**
* DELETE /users/:id
*
* If the user exists delete it.
*/
exports.delete = function del(req, res, next) {
  'use strict';

  var sql =
    'DELETE FROM user WHERE id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (row) {

    // if nothing happened, let the client know via a 404 error
    if (row.affectedRows === 0) {
      return res.status(404).send();
    }

    res.status(204).send();
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

