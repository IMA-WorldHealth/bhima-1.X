// scripts/lib/auth/authentication.js

// Middleware: authenticate
var sanitize = require('./../lib/sanitize');
var db = require('./../lib/db');
var uuid = require('./../lib/guid');

module.exports = function () {
  'use strict';

  // This is the first middleware hit by any incoming
  // request, yet it will only act on AUTHENTICATION
  // paths -- those with req.url : { '/auth/logout' | '/auth/login' }
  //
  // The idea is that authentication should come before
  // authorization.  A first request, if it is trying
  // to get authenticated will be recieved at this level,
  // then proceed on to be authorized as correct.
  //
  // All other paths are welcome to continue on to be
  // validated by the authorization middleware.

  function protect(req, res, next) {
    if (!req.session || !req.session.token) {
      next(new Error('Not Logged In'));
    } else {
      next();
    }
  }

  function login(req, res, next) {
    // FIXME: find a better way to structure this.
    if (req.method !== 'POST') { return next(); }
    var sql, id, user,
        usr = req.body.username,
        pwd = req.body.password,
        pro = req.body.project;

    sql =
      'SELECT user.id, user.username, user.first, user.last, user.email, project.enterprise_id ' +
      'FROM user JOIN project_permission JOIN project ON ' +
        'user.id = project_permission.user_id AND project.id = project_permission.project_id ' +
      'WHERE user.username = ? AND user.password = ? AND project_permission.project_id = ?;';


    db.exec(sql, [usr, pwd, pro])
    .then(function (results) {
      if (results.length < 1) {
        throw 'No user found for this project';
      }

      user = results.pop();
      sql = 'UPDATE user SET user.logged_in = 1 WHERE user.id = ?;';

      return db.exec(sql, [user.id]);
    })
    .then(function () {
      var sql =
        'SELECT unit.url ' +
        'FROM unit, permission, user WHERE ' +
          'permission.user_id = user.id AND ' +
          'permission.unit_id = unit.id AND ' +
          'user.id = ?;';

      return db.exec(sql, [user.id]);
    })
    .then(function (results) {
      if (!results.length) {
        throw new Error('This user has no permissions, please contact your System Administrator.');
      }

      req.session.user_id = user.id;
      req.session.project_id = pro;
      req.session.paths = results.map(function (row) {
        return row.url;
      });

      sql =
        'SELECT project.id, project.name, project.abbr ' +
        'FROM project JOIN project_permission ' +
        'ON project.id = project_permission.project_id ' +
        'WHERE project_permission.user_id = ?;';

      return db.exec(sql, [req.session.user_id]);
    })
    .then(function (results) {
      if (results.length === 1) {
        req.session.project_id = results[0].id; // TODO: projects should be incorporated
      }                                         // into login page
      res.status(200).send({ accessToken : uuid(), userData : user });
    })
    .catch(function (err) {
      res.status(401).send(err);
    })
    .done();
  }

  function logout(req, res, next) {
    var sql;

    if (!req.session || !req.session.user_id) {
      console.log('[ERROR] session data does not exist.');
      return res.status(419).send();
    }

    sql = 'UPDATE user SET user.logged_in = 0 WHERE user.id = ?;';

    db.exec(sql, [req.session.user_id])
    .then(function () {
      req.session.destroy(function () {
        res.clearCookie('connect.sid');
        res.send();
      });
      req.session = null; // see: http://expressjs.com/api.html#cookieSession
    })
    .catch(function (err) { next(err); })
    .done();
  }

  // FIXME : hard-code these routes - there is no need for this level of complexity
  return function authenticate(req, res, next) {
    var router = {
      '/auth/logout' : logout,
      '/auth/login' : login
    };

    var fn = router[req.url];
    return fn ? fn(req, res, next) : next();
  };
};
