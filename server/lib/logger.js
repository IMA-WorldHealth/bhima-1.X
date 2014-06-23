// scripts/lib/database/logger.js
/* jshint unused : false */

// Module: Logger
// This module is responsible for logging all requests to
// the express server, plus requests to external (asynchronous)
// modules, such as the database connector.
//
// Logs look like:
// ---------------------------------------------------------------------
// | source | uuid | timestamp | type |  description | status | userID |
// ---------------------------------------------------------------------

var fs = require('fs'),
    os = require('os');

module.exports = function Logger (cfg, uuid) {
  'use strict';

  if (!cfg) {
    throw new Error('No configuration file found!');
  }

  var types = {
    'csv' : {
      delimiter : ','
    },
    'tsv' : {
      delimiter : '\t'
    },
    'tab' : {
      delimiter : '\t'
    }
  };

  var io = fs.createWriteStream(cfg.file);
  var delimiter = types[cfg.type].delimiter;

  function write () {
    var data = Array.prototype.slice.call(arguments)
      .join(delimiter)
      .concat(os.EOL);
    io.write(data);
  }

  function getTime() {
    return new Date().toLocaleTimeString();
  }

  function request() {
    var source = 'HTTP';
    return function (req, res, next) {
      req.uuid = uuid();
      var userId = req.session ? req.session.user_id : null;
      write(source, req.uuid, getTime(), req.method, req.url, null, userId);
      next();
    };
  }

  function external(source) {
    if (!source) {
      throw new Error('Must specify an external module in log.');
    }
    return function (uuid, desc, user_id) {
      write(source, uuid, getTime(), null, desc, null, user_id);
    };
  }

  function error() {
    var source = 'ERROR';
    return function (err, req, res, next) {
      var type = err.type || 404;
      var userId = req.session ? req.session.user_id : null;
      write(source, req.uuid, getTime(), req.method, err.message, type, userId);
      next(err);
    };
  }

  write('SOURCE', 'UUID', 'TIMESTAMP', 'METHOD', 'DESCRIPTION', 'TYPE', 'USER');

  function generic() {
    write(arguments);
  }

  return {
    request  : request,
    external : external,
    error    : error,
    generic  : generic
  };
};
