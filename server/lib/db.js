// /scripts/lib/database/db.js

// Module: db.js

// TODO rewrite documentation - this module can now be required by any controller module throughout the application
// TODO Seperate DB wrapper and DB methods - this module should just initialise a new DB instance
// new db(config, etc.) and return it in module exports

// TODO EVERY query to the DB is currently handled on it's own connection, one
// HTTP request can result in tens of connections. Performance checks for
// sharing connections between request sessions (also allowing for shraring a
// transaction between unrelated components)

// The purpose of this module is managing client connections
// and disconnections to a variety of database management systems.
// All query formatting is expected to happen elsewhere.

var q = require('q');

var cfg = require('./../config/environment/server').db;
var uuid = require('./guid');

var db, con, supportedDatabases, dbms;

// Initiliase module on startup - create once and allow db to be required anywhere
function initialise() {
  'use strict';

  cfg = cfg || {};

  // Select the system's database with this variable.
  dbms = cfg.dbms || 'mysql';

  // All supported dabases and their initializations
  supportedDatabases = {
    mysql    : mysqlInit
    // postgres : postgresInit,
    // firebird : firebirdInit,
    // sqlite   : sqliteInit
  };

  // The database connection for all data interactions
  con = supportedDatabases[dbms](cfg);

  //  FIXME reset all logged in users on event of server crashing / terminating - this
  //  should be removed/ implemented into the error/logging module before shipping
  flushUsers(con);
}

function exec(sql, params) {
  var defer = q.defer();

  // uncomment for console.logs().  Warning -- slows down trial balance terribly
  // console.log('[db] [exec]', sql);
  con.getConnection(function (err, connection) {
    if (err) { return defer.reject(err); }

    var query = connection.query(sql, params, function (err, results) {
      if (err) { return defer.reject(err); }
      connection.release();
      defer.resolve(results);
    });

    console.log(query.sql);
  });

  return defer.promise;
}

function execute(sql, callback) {
  // This fxn is formated for mysql pooling, not in all generality
  console.log('[DEPRECATED] [db] [execute]: ', sql);

  con.getConnection(function (err, connection) {
    if (err) { return callback(err); }
    connection.query(sql, function (err, results) {
      connection.release();
      if (err) { return callback(err); }
      return callback(null, results);
    });
  });
}


function getSupportedDatabases() {
  return Object.keys(supportedDatabases);
}

// Depreciated test methods
function requestTransactionConnection() {
  var __connection__;
  var __connectionReady__ = q.defer();

  con.getConnection(function (error, connection) {
    if (error) { return; } // FIXME hadle error
    __connection__ = connection;

    __connection__.beginTransaction(function (error) {
      if (error) { return __connectionReady__.reject(); }
      __connectionReady__.resolve();
    });
  });

  /*Each method should return a promise to be chained
    i.e
      transaction.execute(first)
      .then(transaction.execute(second))
      .then(unrelatedMethod)
      .then(transaction.execute(third))
      .then(transaction.commit)
      .catch(transaction.cancel);
  */

  function execute(query) {
    var deferred = q.defer();

    __connectionReady__.promise.then(function () {
      promiseQuery(__connection__, query)
      .then(function (result) {
        deferred.resolve(result);
      })
      .catch(function (error) {
        deferred.reject(error);
      });
    });

    return deferred.promise;
  }

  function commit() {
    var deferred = q.defer();
    __connectionReady__.promise.then(function () {
      __connection__.commit(function (error) {
        if (error) { return deferred.reject(error); }
        deferred.resolve();
      });
    });

    return deferred.promise;
  }

  function cancel() {
    var deferred = q.defer();
    __connectionReady__.promise.then(function () {
      __connection__.rollback(function () {
        return deferred.resolve();
      });
    });

    return deferred.promise;
  }

  return {
    execute : execute,
    commit : commit,
    cancel : cancel
  };
}

function executeAsTransaction(querries) {
  var deferred = q.defer(), queryStatus = [];
  querries = querries.length ? querries : [querries];

  con.getConnection(function (error, connection) {
    if (error) { return deferred.reject(error); }

    connection.beginTransaction(function (error) {
      if (error) { return deferred.reject(error); }

      queryStatus = querries.map(function (query) {
        return promiseQuery(connection, query);
      });

      q.all(queryStatus)
      .then(function (result) {
        connection.commit(function (error) {
          if (error) {
            connection.rollback(function () {
              return deferred.reject(error);
            });
          }
          console.log('[db][executeAsTransaction] Commited');
          return deferred.resolve(result);
        });
      })
      .catch(function (error) {
        connection.rollback(function () {
          console.log('[db][executeAsTransaction] Rolling back...');
          return deferred.reject(error);
        });
      });
    });
  });
  return deferred.promise;
}

function mysqlInit (config) {
  'use strict';
  var db = require('mysql');
  return db.createPool(config);
}

function flushUsers (db_con) {
  'use strict';
  var permissions, reset;

  // Disable safe mode #420blazeit
  // TODO  This should be optionally set as a flag - and reported (logged)
  permissions = 'SET SQL_SAFE_UPDATES = 0;';
  reset = 'UPDATE `user` SET user.active = 0 WHERE user.active = 1;';

  db_con.getConnection(function (err, con) {
    if (err) { throw err; }
    con.query(permissions, function (err) {
      if (err) { throw err; }
      con.release();
      db_con.getConnection(function (err, con) {
        if (err) { throw err; }
        con.query(reset, function (err) {
          if (err) { throw err; }
        });
      });
    });
  });
}

/*
// TODO: impliment PostgreSQL support
function postgresInit(config) {
  var db = require('pg');
  return true;
}

// TODO: impliment Firebird support
function firebirdInit(config) {
  var db = require('node-firebird');
  return true;
}

// TODO: impliment sqlite support
function sqliteInit(config) {
  var db = require('sqlite3');
  return true;
}
*/

// Utility methods
function promiseQuery(connection, sql) {
  var deferred = q.defer();

  console.log('[db] [Transaction Query]', sql);
  connection.query(sql, function (error, result) {
    if (error) { return deferred.reject(error); }
    return deferred.resolve(result);
  });
  return deferred.promise;
}

function sanitize(x) {
  return con.escape(x);
}

module.exports = {
  initialise : initialise,
  requestTransactionConnection : requestTransactionConnection,
  executeAsTransaction : executeAsTransaction,
  exec : exec,
  execute : execute,
  sanitize : sanitize, // FIXME: is this even used?
  escape : sanitize
};

//module.exports = db;
