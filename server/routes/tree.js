// Module: scripts/tree.js
// This module is responsible for constructing each
// person's tree based on their permissions in the
// database.
//
var q = require('q');

module.exports = function (db) {
  'use strict';

  function load(userId) {
    var sql =
      'SELECT permission.unit_id AS id, name, description, parent, has_children, ' +
        'unit.url, path, `key` ' +
      'FROM permission JOIN unit ON ' +
        'permission.unit_id = unit.id ' +
      'WHERE permission.user_id = ? AND unit.parent = 0;';

    function getChildren(parentId) {
      var sql =
        'SELECT permission.unit_id AS id, name, description, parent, has_children, ' +
          'unit.url, path, `key` ' +
        'FROM permission JOIN unit ON ' +
          'permission.unit_id = unit.id ' +
        'WHERE permission.user_id = ? AND unit.parent = ?;';

      return db.exec(sql, [userId, parentId])
      .then(function (result) {

        var hasChildren = result.filter(function (row) {
          return row.has_children !== 0;
        });

        return hasChildren.length > 0 ?
            q.all(hasChildren.map(function (row) { return getChildren(row.id); })) :
            q(result);
      });
    }

    return db.exec(sql, [userId])
    .then(function (result) {
      return q.all(result.map(function (row) {
        return row.has_children ?
          getChildren(row.id).then(function (children) { console.log('[row.id]', row); row.children = children; return q(row); }) :
          q(row);
      }));
    });
  }


  return {
    load : load
  };
};
