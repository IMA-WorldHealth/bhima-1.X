// Module: server/controllers/tree.js
// This module is responsible for constructing each
// person's tree based on their permissions in the
// database.

var q = require('q'),
    db = require('../lib/db');

/*
 * HTTP Controllers
*/
exports.generate = function (req, res, next) {
  /* jshint unused : false*/

  // builds a unit tree
  buildTree(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  })
  .catch(next)
  .done();
};


// This method builds a tree data structure of
// units and children of a specified parentId.
function getChildren(units, parentId) {
  var children;

  // Base case: There are no child units
  // Return null
  if (units.length === 0) { return null; }

  // Returns all units where the parent is the
  // parentId
  children = units.filter(function (unit) {
    return unit.parent === parentId;
  });

  // Recursively call getChildren on all child units
  // and attach them as childen of their parent unit
  children.forEach(function (unit) {
    unit.children = getChildren(units, unit.id);
  });

  return children;
}


// builds a unit tree based of a user's permissions
// level and returns it
function buildTree(userId) {
  'use strict';

  var sql, ROOT_NODE, tree;

  // we assume the root node/unit has id 0
  ROOT_NODE = 0;

  // NOTE
  // For this query to render properly on the client, the user
  // must also have permission to access the parents of leaf nodes
  sql =
      'SELECT unit.id, unit.name, unit.parent, ' +
        'unit.url, unit.path, unit.key ' +
      'FROM permission JOIN unit ON ' +
        'permission.unit_id = unit.id ' +
      'WHERE permission.user_id = ?';

  return db.exec(sql, [userId])
  .then(function (units) {

    // builds a tree of units on the ROOT_NODE
    tree = getChildren(units, ROOT_NODE);
    return q(tree);
  });
}
