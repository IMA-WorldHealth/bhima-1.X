// Module: scripts/tree.js

var q = require('q');
var db = require('./../lib/db');
var parser = require('./../lib/parser');

// This module is responsible for constructing each
// person's tree based on their permissions in the
// database.
//
// FIXME: there seems to be some code repetition.
// TODO : Use db.exec() instead of db.execute()

/*
 * HTTP Controllers
*/
exports.generate = function (req, res, next) { 
  /* jshint unused : false*/

  load(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  })
  .catch(function (err) {
    res.send(301, err);
  })
  .done();
};

function load(userId) {

  // we assume the root node/unit has id 0
  var ROOT_NODE = 0;

  // TODO
  // These two functions look like they could
  // be combined into a single recursive function
  // something like `return getChildren(ROOT);`

  function getChildren(parentId) {
    var sql, d = q.defer();

    sql = 
      'SELECT permission.id, permission.unit_id, unit.name, unit.parent, unit.has_children, ' +
        'unit.url, unit.path, unit.key ' +
      'FROM permission JOIN unit ON ' +
        'permission.unit_id = unit.id ' + 
      'WHERE permission.user_id = ' + userId + ' AND ' +
        'unit.parent = ' + parentId + ';';

    db.execute(sql, function (err, result) {
      // FIXME / TODO
      // Impliment proper error handling
      if (err) { console.log(err); }

      var haveChildren, promises;

      haveChildren = result.filter(function (row) {
        return row.has_children;
      });

      if (haveChildren.length > 0) {
        promises = haveChildren.map(function (row) {
          return getChildren(row.unit_id);
        });
        d.resolve(q.all(promises));
      } else {
        d.resolve(result);
      }
    });

    return d.promise;
  }

  function main() {
    var sql,  d = q.defer();

    sql = 
      'SELECT permission.id, permission.unit_id, unit.name, unit.parent, unit.has_children, ' +
        'unit.url, unit.path, unit.key ' +
      'FROM permission JOIN unit ON ' +
        'permission.unit_id = unit.id ' + 
      'WHERE permission.user_id = ' + userId + ' AND ' +
        'unit.parent = ' + ROOT_NODE + ';';

    // this is freakin' complex. DO NOT TOUCH.
    db.execute(sql, function (err, result) {
      
      // FIXME / TODO
      // Impliment proper error handling
      if (err) { console.log(err); }

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

exports.load = load;
