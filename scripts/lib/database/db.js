//
// Module: db.js
//
// The purpose of this module is simply to manage client connections
// and disconnections to a variety of database management systems.
// All query formatting is expected to happen elsewhere.

// PRIVATE METHODS

var u = require('../util/util');

function mysqlInit (config) {
  // TODO : This module should use mysql connection pooling
  'use strict';

  var db = require('mysql');
  var con = db.createConnection(config);
  con.connect(function (err) {
    console.log('\nConnecting to MySQL ...\n');
    if (err) setTimeout(mysqlInit(config), 500); 
  });

  con.on('error', function (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Lost connection, reconnecting in 500ms');
      mysqlInit(config);
    }
    else throw err;
  });

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

function escape_id (v) {
  return "`" + v.trim() + "`";
}

function escape_str (v) {
  var n = Number(v);      // make sure v isn't a number
  return (!Number.isNaN(n)) ? n : "'" + v + "'";
}

// main db module
module.exports = function (cfg) {
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
  var con = supported_databases[sgbd](cfg);

  //  FIXME reset all logged in users on event of server crashing / terminating - this should be removed/ implemented into the error/ loggin module before shipping
  flushUsers(con);

  return {
    // return all supported databases
    getSupportedDatabases : function() {
      return Object.keys(supported_databases);
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
};
