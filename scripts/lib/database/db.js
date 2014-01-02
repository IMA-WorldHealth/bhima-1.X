//
// Module: db.js
//
// The purpose of this module is simply to manage client connections
// and disconnections to a variety of database management systems.
// All query formatting is expected to happen elsewhere.

// PRIVATE METHODS

var u = require('../util/util');

function mysqlInit (config) {
  // FIXME: This module should use mysql connection pooling
  'use strict';

  var db = require('mysql');
  var con = db.createConnection(config);
  con.connect();

//  FIXME reset all logged in users on event of server crashing / terminating - this should be removed/ implemented into the error/ loggin module before shipping
  flushUsers(con);

  return con;  // c'est pas necessaire pour mysql de retourne cette variable, mais peut-etre ca va necessaire pour autre base des donnees
}

function flushUsers (db_con) {
  'use strict';
  var permissions, reset;

//  Disable safe mode #420blazeit
  permissions = 'SET SQL_SAFE_UPDATES = 0;';
  reset = 'UPDATE `kpk`.`user` SET `logged_in`="0" WHERE `logged_in`="1";';

//  Update columns that are set to logged in
  db_con.query(permissions, function(err, res) {
    if (err) throw err;
    db_con.query(reset, function(err, res) {
      if (err) throw err;
      console.log('[db.js] (*) user . logged_in set to 0');
    });
  });
}


// TODO: impliment PostgreSQL support
function postgresInit(config) {
  db = require('pg');
  return true;
}

// TODO: impliment Firebird support
function firebirdInit(config) {
  db = require('node-firebird');
  return true;
}

// TODO: impliment sqlite support
function sqliteInit(config) {
  db = require('sqlite3');
  return true;
}

// UTILS

/* [fr]
 * Cette methode transformer un tableau dans une chaine
 * avec braces.
 * @param values : TABLEAU
 * EX:
 * tuplify(['id', 'nom', 'location'])
 *  ==> '(id, nom, location)'
 */
function tuplify (values) {
  return '(' + values.join(', ') + ')';
}

function isIn(s) {
  return String(s).indexOf('(') > -1;
}

function escape_id(v) {
  return "`" + v.trim() + "`";
}

function escape_str(v) {
  var n = Number(v);      // make sure v isn't a number
  return (!Number.isNaN(n)) ? n : "'" + v + "'";
}


// WHY IS THIS GLOBAL?
//var con;

// main db module
function db (cfg) {
  'use strict';

  cfg = cfg || {};

  // Select the system's database with this variable.
  var sgbd = cfg.sgbd || 'mysql';

  // All supported dabases and their initializations
  var supported_databases = {
    mysql    : mysqlInit,
    postgres : postgresInit,
    firebird : firebirdInit,
    sqlite   : sqliteInit
  };

  // load external configuration if it exists.
  // Else, default to this configuration
  // The database connection for all data interactions
  // FIXME: research connection pooling in MySQL
  // if (!con) con = supported_databases[sgbd](cfg);
  var con = supported_databases[sgbd](cfg);

  return {
    // return all supported databases
    getSupportedDatabases : function() {
      return Object.keys(supported_databases);
    },

    // update: function
    //    Updates a single row in the database.
    // NOTE: pk MUST exist to change one line.
    // If pk does not exist, catastrophic changes
    // may occur (SET the whole database with changes).
    // Pk is expected to be a list of primary keys
    // FIXME: Update documentation concerning this
    // method.
    update: function(table, data, pk) {
      var sets = [], where = [], row, value, base;

      table = escape_id(table);

      function inArr(arr, v) {
        return ~arr.indexOf(v);
      }
      
      for (var j in data) {
        row = data[j];
        for (var k in row) {
          value = row[k];
          if (!u.isInt(value) && !isIn(value)) value = escape_str(value);
          if (!inArr(pk, k)) {
            sets.push(escape_id(k) + "=" + value);
          } else {
            // k in pk
            where.push(escape_id(k) + "=" + value);
          }
        }
      }

      base = "UPDATE " + table + " SET " + sets.join(", ") + " WHERE " + where.join(" AND ") + ";";
      return base;
    },


    delete: function(table, ids) {
      var statement = 'DELETE FROM ', joiner = ' IN ',
            ander = ' AND ';
      var id, in_block;

      table = escape_id(table);
      statement += table + ' WHERE ';

      function escapeNonInts(i) { return u.isInt(i) ? i : escape_str(i); }
    
      for (id in ids) { 
        if (ids[id] && ids.hasOwnProperty(id) && ids.propertyIsEnumerable(id)) {
          in_block = tuplify(ids[id].map(escapeNonInts)); // escapes non-ints, reassembles
          statement += escape_id(id) + joiner + in_block + ander;
        }
      }
      statement = statement.substring(0, statement.lastIndexOf(ander)) + ';';
      return statement;
    },

    insert: function (table, rows) {
      var statement = 'INSERT INTO ', vals,
          keys = [], groups = [], insert_value;
      
      table = escape_id(table);
      statement += table+' ';

      rows.forEach(function (row) {
        var key;
        vals = [];
        for (key in row) {
          if (keys.indexOf(key) < 0) { keys.push(key); }  // cree un tableau pour cle unique
          insert_value = u.isString(row[key]) ? escape_str(row[key]) : row[key];
          vals.push(insert_value);
        }
        groups.push(tuplify(vals));
      });

      statement += tuplify(keys) + ' VALUES ';
      statement += groups.join(', ').trim() + ';';
      return statement;
    },

    execute: function(sql, callback) {
      console.log("[db] [execute]: ", sql);
      return con.query(sql, callback);
    },

    escape: function (id) {
      return escape_id(id);
    },
    
    escapestr : function (str) {
      return escape_str(str); 
    }
  };
}

module.exports = db;
