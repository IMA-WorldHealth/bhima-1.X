// /scripts/lib/database/db.js

// Module: db.js

// The purpose of this module is managing client connections
// and disconnections to a variety of database management systems.
// All query formatting is expected to happen elsewhere.

var u = require('../util/util'),
    q = require('q');

function mysqlInit (config) {
  'use strict';
  var db = require('mysql');
  console.log('Creating connection pool...');
  return db.createPool(config);
}

function flushUsers (db_con) {
  'use strict';
  var permissions, reset;

  // Disable safe mode #420blazeit
  permissions = 'SET SQL_SAFE_UPDATES = 0;';
  reset = 'UPDATE `kpk`.`user` SET `logged_in`="0" WHERE `logged_in`="1";';

  // Mwahahahaha
  db_con.getConnection(function (err, con) {
    if (err) throw err;
    con.query(permissions, function (err, res) {
      if (err) throw err;
      con.release();
      db_con.getConnection(function (err, con) {
        if (err) throw err;
        con.query(reset, function (err) {
          if (err) throw err;
          console.log('[db.js] (*) user . logged_in set to 0');
        });
      });
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

// Utility methods
function promiseQuery(connection, sql) { 
  var deferred = q.defer();
  
  console.log('[db] [Transaction Query]', sql);
  connection.query(sql, function (error, result) { 
    if (error) return deferred.reject(error);
    deferred.resolve(result);
  });
  return deferred.promise;
}

module.exports = function (cfg, logger) {
  'use strict';

  cfg = cfg || {};

  // Select the system's database with this variable.
  var dbms = cfg.dbms || 'mysql';

  // All supported dabases and their initializations
  var supported_databases = {
    mysql    : mysqlInit,
    postgres : postgresInit,
    firebird : firebirdInit,
    sqlite   : sqliteInit
  };

  // The database connection for all data interactions
  var con = supported_databases[dbms](cfg);
  logger.emit('credentials', cfg);

  //  FIXME reset all logged in users on event of server crashing / terminating - this should be removed/ implemented into the error/ loggin module before shipping
  flushUsers(con);

  return {
    // return all supported databases
    getSupportedDatabases : function() {
      return Object.keys(supported_databases);
    },

    execute: function(sql, callback) {
      // This fxn is formated for mysql pooling, not in all generality
      console.log("[db] [execute]: ", sql);

      con.getConnection(function (err, connection) {
        if (err) { return callback(err); }
        connection.query(sql, function (err, results) {
          connection.release();
          if (err) { return callback(err); }
          return callback(null, results);
        });
      });
    },

    exec : function (sql) {
      // this fxn is formatted for mysql pooling
      // uses promises

      console.log("[db] [execute]: ", sql);
      var defer = q.defer();

      con.getConnection(function (err, connection) {
        if (err) { return defer.reject(err); }
        connection.query(sql, function (err, results) {
          connection.release();
          if (err) { return defer.reject(err); }
          defer.resolve(results);
        });
      });

      return defer.promise;
    },

    executeAsTransaction : function (querries) { 
      var deferred = q.defer(), queryStatus = [];
      querries = querries.length ? querries : [querries];
      
      con.getConnection(function (error, connection) { 
        if (error) return deferred.reject(error);
        
        connection.beginTransaction(function (error) { 
          if (error) return deferred.reject(error);
           
          queryStatus = querries.map(function (query) { 
            return promiseQuery(connection, query);
          });
          
          q.all(queryStatus)
          .then(function (result) { 
            connection.commit(function (error) { 
              if (error) connection.rollback(function () { 
                return deferred.reject(error); 
              });
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
    },
    
    requestTransactionConnection : function() { 
      var __connection__;
      var __connectionReady__ = q.defer();

      con.getConnection(function (error, connection) { 
        if (error) return; // FIXME hadle error

        __connection__ = connection;
        
        // Test transaction and calls seperate
        __connection__.beginTransaction(function (error) { 
          if (error) return; // FIXME handle error
          __connectionReady__.resolve();
        });
      });
  

      // Each method should return a promise to be chained
      // i.e 
      // transaction.execute(first)
      // .then(transaction.execute(second))
      // .then(unrelatedMethod)
      // .then(transaction.execute(third))
      // .then(transaction.commit)
      // .catch(transaction.cancel);
      function execute(query) { 
        var deferred = q.defer();

        console.log('[db][requestTransactionConnection] execute');
        __connectionReady__.promise.then(function () { 
          return promiseQuery(__connection__, query);
        });

        return deferred.promise;
      }

      function commit() { 
        __conectionReady__.promise.then(function () { 
          __connection__.commit(function (error) { 
            if (error) return; // FIXME handle error
          });
        });
      }

      function cancel() { 
        __conectionReady__.promise.then(function () { 
          __connection__.rollback(function () { 
            // Handle error 
          });
        });
      }

      return { 
        execute : execute,
        commit : commit,
        cancel : cancel
      };
    }
  };
};
