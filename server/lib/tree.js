// Module: scripts/tree.js

var parser = require('./database/parser')();
var q = require('q');

module.exports = function (db) {
  // This module is responsible for constructing each
  // person's tree based on their permissions in the
  // database.
  //
  // FIXME: there seems to be some code repetition.

  'use strict';

  function load (userid) {
    var defer = q.defer();

    function getChildren (parent_id) {
      var d = q.defer();
      var sql = parser.select({
        tables : {
          'permission' : { columns : ['id', 'user_id'] },
          'unit' : { columns: ['name', 'description', 'parent', 'has_children', 'url', 'path', 'key']}
        },
        join : ['permission.unit_id=unit.id'],
        where : ['permission.user_id='+userid, 'AND', 'unit.parent='+parent_id]
      });

      db.execute(sql, function (err, result) {
        if (err) throw err;
        var have_children = result.filter(function (row) {
          return row.has_children;
        });
        if (have_children.length) {
          var promises = have_children.map(function (row) {
            return getChildren(row.unit_id);
          });
          d.resolve(q.all(promises));
        } else {
          d.resolve(result);
        }
      });

      return d.promise;
    }

    function main () {
      var d = q.defer();
      var query = parser.select({
        tables : {
          'permission' : { columns : ['id', 'unit_id']},
          'unit': { columns : ['name', 'description', 'parent', 'has_children', 'url', 'path', 'key']}
        },
        join : ['permission.unit_id=unit.id'],
        where : ['permission.user_id=' + userid, 'AND', 'unit.parent=0'] // This assumes root is always "0"
      });

      // this is freakin' complex. DO NOT TOUCH.
      db.execute(query, function (err, result) {
        if (err) throw err;
        d.resolve(q.all(result.map(function (row) {
          var p = q.defer();
          if (row.has_children) {
            getChildren(row.unit_id)
            .then(function (children) {
              row.children = children;
              p.resolve(row);
            });
          }
          else { p.resolve(row); }
          return p.promise;
        })));
      });

      return d.promise;
    }

    return main();
  }

  return {
    load : load
  };

};
