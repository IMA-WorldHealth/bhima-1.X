// Module: scripts/tree.js

var parser = require('./database/parser');

module.exports = (function (db) {
  // This module is responsible for constructing each
  // person's tree based on their permissions in the
  // database.
  //
  // FIXME: there seems to be some code repetition.
  // FIXME/TODO: Can this actually load recursively?
  //  seems like it goes one branch deep then stops.

  'use strict';

  function loadTree (userid, query, callback) {
    // this takes in the user id, a query object, and a callback
    // of the form function (err, result) {};
    var field, value;
    field = query.cond[0].cl; //champs concerne de la table
    value = query.cond[0].v; 
    return (value === 0) ? loadRoot(userid, field, value, callback) : loadBranch (userid, value, callback);
  }

  function loadRoot (userid, field, value, callback) {
    // this operation will only happen once a page reload!
    var sql;
    //on demande les fils de la racine
    sql = 'SELECT `unit`.`parent`, `permission`.`id`, `user`.`id` ' + 
               'FROM `unit` JOIN `permission` JOIN `user` ' + 
               'ON `permission`.`id_unit`=`unit`.`id` ' +
                  'AND `permission`.`id_user`=`user`.`id` ' +
                  'AND `permission`.`id_user`=' + userid; 

    db.execute(sql, function (err, results) {
      if (err) callback(err, null);
      if (results.length) {
        // return parents
        var roles = results.map(function (row) {
          return row.parent;
        });
        // make unique
        roles = roles.filter(function (id, idx) {
          return roles.indexOf(id) === idx;
        });
        
        sql = "SELECT `unit`.`id`, `unit`.`name`, `unit`.`description`," +
              " `unit`.`parent`, `unit`.`has_children`, `unit`.`p_url` " +
              "FROM `unit`" +
              "WHERE `unit`.`parent`=" + db.escapestr(value) +
              " AND `unit`.`id` IN (" + roles.join() + ");";

        db.execute(sql, function(err, results) {
          return err ? callback(err, null) : callback(null, results);
        });
      }
    });
  }

  function loadBranch (userid, value, callback) {
    var sql, ids;

    // FIXME: make this native SQL
    sql = db.select({
      'entities':[{t:'permission', c:['id_unit']},{t:'user', c:['id']},{t:'unit', c:['id']}],
      'jcond':[{ts:['permission', 'user'], c:['id_user', 'id'], l:'AND'},{ts:['permission','unit'], c:['id_unit', 'id'], l:'AND'}],
      'cond':[{t:'user', cl:'id', z:'=', v:userid, l:'AND'},{t:'unit', cl:'parent', z:'=', v:value}]
    });

    db.execute(sql, function(err, results) {
      if (err) callback(err, null);
      ids = results.map(function (row) {
        return row.id_unit; 
      });

      if (ids.length) {

        // FIXME: code repetition
        sql = "SELECT `unit`.`id`, `unit`.`name`, `unit`.`description`," +
              " `unit`.`parent`, `unit`.`has_children`, `unit`.`p_url` " +
              "FROM `unit`" +
              "WHERE `unit`.`parent`=" + db.escapestr(value) +
              " AND `unit`.`id` IN (" + ids.join() + ");";

        db.execute(sql, function (err, results) {
          return err ? callback(err, null) : callback(null, results);
        });
      }
    });
  }

  function simpleLoad (userid, callback) {
    // TODO: finish this module
    // a simple loading of the tree,
    // in a non-recursive fashion
    var query = {
      tables : { 
        'permission' : { columns : ['id']},
        'unit': { columns : ['name', 'description', 'parent', 'has_children', 'url', 'p_url']}
      },
      join : ['permission.id_unit=unit.id'],
      where : ['permission.id_user=' + userid]
    };

    db.execute(parser.select(query), callback);

  }

  return {
    loadTree : loadTree,
    simpleLoad : simpleLoad
  };

});
