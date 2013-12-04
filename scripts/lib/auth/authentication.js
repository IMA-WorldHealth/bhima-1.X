// scripts/lib/auth/authentication.js

var url = require('url');

// Middleware: authenticate

module.exports = (function (db) {


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
            else req.session = null; 
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
            "FROM `user` WHERE `user`.`username`=" + db.escapestr(usr) +
            " AND `user`.`password`=" + db.escapestr(pwd);
          db.execute(sql, function (err, results) {
            if (err) next(err);
            // TODO: client-side logic not implimented for this.
            if (!results.length) res.send({error : "incorrect username/password combination."});

            var user = results.pop();
            if (user.logged_in) {
              res.send({error: "user already logged in."});
              next(new Error ("user already logged in."));
            } else {
              login(user.id, usr, pwd, function (err, results) {
                if (err) next (err);
                if (results.length) {
                  req.session.logged_in = true;
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
    id = db.escapestr(id);
    sql = "UPDATE `user` SET `user`.`logged_in`=1 WHERE `user`.`id`=" + id;

    db.execute(sql, function (err, results) {
      if (err) callback(err); 
      
      sql = ["SELECT `unit`.`url` ",
            "FROM `unit`, `permission`, `user` WHERE ",
            "`permission`.`id_user` = `user`.`id` AND `permission`.`id_unit` = `unit`.`id` AND ",
            "`user`.`id`=", id].join('');

      db.execute(sql, callback);
    });
  }

  function logout (id, callback) {
    var sql = "UPDATE `user` SET `user`.`logged_in`=0 WHERE `user`.`id`=" + db.escapestr(id);
    return db.execute(sql, callback);
  }

  return authenticate; 

});
