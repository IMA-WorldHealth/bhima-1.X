// scripts/lib/auth/authentication.js

// Middleware: authenticate

module.exports = function (db, sanitize) {
  'use strict';

  // This is the first middleware hit by any incoming
  // request, yet it will only act on AUTHENTICATION
  // paths -- those with req.url : { '/logout' | '/login' }
  //
  // The idea is that authentication should come before
  // authorization.  A first request, if it is trying
  // to get authenticated will be recieved at this level,
  // then proceed on to be authorized as correct.
  //
  // All other paths are welcome to continue on to be
  // validated by the authorization middleware.

  function login(req, res, next) {
    // FIXME: find a better way to structure this.
    if (req.method !== 'POST') { return next(); }
    var sql, id, user,
        usr = req.body.username,
        pwd = req.body.password;

    sql = 'SELECT `user`.`id`, `user`.`logged_in` ' +
      'FROM `user` WHERE `user`.`username`=' + sanitize.escape(usr) +
      ' AND `user`.`password`=' + sanitize.escape(pwd);

    db.exec(sql)
    .then(function (results) {
      // TODO: client-side logic not implimented for this.
      if (results.length < 1) {
        return res.sendfile('client/dest/error.html');
        //return next(new Error('Incorrect username/password combination.'));
      }

      // FIXME : this is strange, but works. Ideally, you should
      // only have one user matching the given parameters.
      user = results.pop();
      /*
      if (user.logged_in) {
        // FIXME: This is temporary to reflect that we are live in an enterprise
        //return next(new Error ('User already logged in.'));
      }
      */

      id = sanitize.escape(user.id);
      sql = 'UPDATE `user` SET `user`.`logged_in`=1 WHERE `user`.`id` = ' + id;
   
      return db.exec(sql);
    })
    .then(function () {
      var sql =
        'SELECT `unit`.`url` ' +
        'FROM `unit`, `permission`, `user` WHERE ' +
          '`permission`.`user_id` = `user`.`id` AND ' +
          '`permission`.`unit_id` = `unit`.`id` AND ' +
          '`user`.`id`=' + id;

      return db.exec(sql);
    })
    .then(function (results) {
      if (!results.length) {
        throw new Error('This user has no permissions, please contact your System Administrator.');
      }

      req.session.authenticated = true;
      req.session.user_id = user.id; // TODO : Change all instances to userId

      req.session.paths = results.map(function (row) {
        return row.url;
      });

      sql =
        'SELECT `project`.`id`, `project`.`name`, `project`.`abbr` ' +
        'FROM `project` JOIN `project_permission` ' +
        'ON `project`.`id` = `project_permission`.`project_id` ' +
        'WHERE `project_permission`.`user_id` = ' + sanitize.escape(req.session.user_id) + ';';

      return db.exec(sql);
    })
    .then(function (results) {

      if (results.length === 1) {
        req.session.project_id = results[0].id;
        res.redirect('/');
      } else {
        // FIXME hardcoded routes
        return res.sendfile('client/dest/project.html');
      }
    })
    .catch(function (err) { next(err); })
    .done();
  }

  function logout(req, res, next) {
    var sql;

    if (!req.session || !req.session.authenticated) {
      return next();
    }

    sql =
      'UPDATE `user` SET `user`.`logged_in`=0' +
      ' WHERE `user`.`id`=' + sanitize.escape(req.session.user_id);

    db.exec(sql)
    .then(function () {
      req.session.destroy(function () {
        res.clearCookie('connect.sid');
        res.redirect('/login');
      });
      req.session = null; // see: http://expressjs.com/api.html#cookieSession
    })
    .catch(function (err) { next(err); })
    .done();
  }

  return function authenticate(req, res, next) {

    var router = {
      '/logout' : logout,
      '/login' : login
    };

    var fn = router[req.url];
    return fn ? fn(req, res, next) : next();

  };

};
