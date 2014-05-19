
var url = require("url");
var querystring = require("querystring");

module.exports = function (db) {
  'use strict';

  // This middleware ensures that projects are correctly assigned
  // for every incoming request.  It is similar to authentication
  // middlewares, but deals only with the assignment of projects
  // to the session

  return function (req, res, next){
    var sql, parsed = url.parse(req.url);

    if (req.session.project_id === undefined) {
      if (parsed.pathname === '/project') {
        if (parsed.query) {
          req.session.project_id = querystring.parse(parsed.query).id;
          return res.send();
        } else {
          sql =
            "SELECT `project`.`id`, `project`.`name`, `project`.`abbr` " +
            "FROM `project` JOIN `project_permission` " +
            "ON `project`.`id` = `project_permission`.`project_id` " +
            "WHERE `project_permission`.`user_id` = \"" + req.session.user_id + "\";";

          db.execute(sql, function (err, rows) {
            if (err) { return next(err); }
            return res.send(rows);
          });
        }
      } else {
        return res.sendfile('./app/project.html');
      }
    } else {
      return next();
    }
  };
};
