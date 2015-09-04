// Module: scripts/tree.js

var q = require('q'),
    db = require('../lib/db'),
    util = require('../lib/util');

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

  load(req.session.user.id)
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
      'SELECT permission.id, permission.unit_id, unit.name, unit.parent, ' +
        'unit.url, unit.path, unit.key ' +
      'FROM permission JOIN unit ON ' +
        'permission.unit_id = unit.id ' + 
      'WHERE permission.user_id = ' + userId + ' AND ' +
        'unit.parent = ' + parentId + ';';

    db.execute(sql, function (err, result) {
      // FIXME / TODO
      // Impliment proper error handling
      if (err) { console.log(err); }

      var promises;

      promises = result.map(function (row) {
        var p = q.defer();          
        getChildren(row.unit_id)
        .then(function (children) {
          if(children){
            row.children = children;  
          } else {
            row.children = null;
          }          
          p.resolve(row);
        });
        return p.promise;
      });
      d.resolve(q.all(promises));
    });
    return d.promise;
  }

  function main() {
    var sql,  d = q.defer();

    // FIXME
    // This is the worst code known to mankind.  We should
    // really just create a tree here, but that will await
    // another pull request

    // if you have no user, reject the request
    if (!util.isDefined(userId)) {
      d.reject('No user');
    } else {

      sql = 
        'SELECT permission.id, permission.unit_id, unit.name, unit.parent, ' +
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
          getChildren(row.unit_id)
          .then(function (children) {
            if(children){
              row.children = children;  
            }            
            p.resolve(row);
          });
          return p.promise;
        })));
      });
    }


    return d.promise;
  }

  return main();
}

exports.load = load;
