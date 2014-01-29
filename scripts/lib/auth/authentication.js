// scripts/lib/auth/authentication.js

// Middleware: authenticate

var sanitize = require('../util/sanitize');

module.exports = (function (db) {
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

  function authenticate (req, res, next) {

    switch (req.url) {

      default :
        next();
        break;

      case '/logout':
        if (!req.session) next();
        else {
          logout(req.session.user_id, function (err, result) {
            if (err) next(err);
            else {
              req.session.destroy(function () {
                res.clearCookie('connect.sid', {path : '/'});
                res.redirect('/');
              });
            }
          });
        }
        break;

      case '/login':
        // FIXME: find a better way to structure this.
        if (req.method != "POST") next();
        else {
          var usr, pwd, sql;
          usr = req.body.username;
          pwd = req.body.password;
          sql = "SELECT `user`.`id`, `user`.`logged_in` " +
            "FROM `user` WHERE `user`.`username`=" + sanitize.escape(usr) +
            " AND `user`.`password`=" + sanitize.escape(pwd);
          db.execute(sql, function (err, results) {
            if (err) next(err);
            // TODO: client-side logic not implimented for this.
            if (results.length < 1) return res.send({error : "Incorrect username/password combination."});

            var user = results.pop();
            if (user.logged_in) {
              res.send({error: "user already logged in."});
              next(new Error ("user already logged in."));
            } else {
              login(user.id, usr, pwd, function (err, results) {
                if (err) next (err);
                if (results.length) {
                  req.session.authenticated = true;
                  req.session.user_id = user.id;
                  req.session.paths = results.map(function (row) {
                    return row.url;
                  });
                  res.redirect('/');
                }
              });
            }
          });
        }
        break;
    }
  }

  function login (id, username, password, callback) {
    // takes an id, username, password, and callback of the form
    // function (err, results) {};
    var sql;
    id = sanitize.escape(id);
    sql = "UPDATE `user` SET `user`.`logged_in`=1 WHERE `user`.`id`=" + id;

    db.execute(sql, function (err, results) {
      if (err) callback(err); 
      
      sql = 'SELECT `unit`.`url` ' +
            'FROM `unit`, `permission`, `user` WHERE ' +
            '`permission`.`id_user` = `user`.`id` AND `permission`.`id_unit` = `unit`.`id` AND ' +
            '`user`.`id`=' + id;

      db.execute(sql, callback);
    });
  }

  function logout (id, callback) {
    // takes an id and callback of the form
    // function (err, results) {};
    var sql = "UPDATE `user` SET `user`.`logged_in`=0 WHERE `user`.`id`=" + sanitize.escape(id);
    return db.execute(sql, callback);
  }

  return authenticate; 

});
