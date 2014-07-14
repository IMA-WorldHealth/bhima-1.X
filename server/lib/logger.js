// scripts/lib/database/logger.js
/* jshint unused : false */

// Module: Logger
// This module is responsible for logging all requests to
// the express server, plus requests to external (asynchronous)
// modules, such as the database connector.
//
// Logs look like:
// --------------------------------------------------------------------------
// | source | ip | uuid | timestamp | type |  description | status | userID |
// --------------------------------------------------------------------------

var fs = require('fs'),
    os = require('os');

/* Writers */
function getTime() {
  return new Date().toLocaleTimeString();
}

module.exports = function Logger (cfg, uuid) {
  'use strict';
  var types, headers, io, writer;

  if (!cfg) {
    throw new Error('No configuration file found!');
  }

  /* import loggers */
  types = {
    'csv'      : require('./loggers/csv'),
    'html'     : require('./loggers/html'),
    'markdown' : require('./loggers/markdown'),
    'tsv'      : require('./loggers/tab'),
    'tab'      : require('./loggers/tab'),
  };

  headers = [
    'SOURCE',
    'IP',
    'UUID',
    'TIMESTAMP',
    'METHOD',
    'DESCRIPTION',
    'TYPE',
    'USER'
  ];

  io = fs.createWriteStream(cfg.file + '.' + cfg.type);
  writer = new types[cfg.type](io, headers);
  writer.writeHeader();

  function request() {
    var source = 'HTTP';
    return function (req, res, next) {
      req.uuid = uuid();
      var userId = req.session ? req.session.user_id : null;
      writer.writeContent(source, req.ip, req.uuid, getTime(), req.method, decodeURI(req.url), null, userId);
      next();
    };
  }

  function external(source) {
    if (!source) {
      throw new Error('Must specify an external module in log.');
    }
    return function (uuid, desc, user_id) {
      writer.writeContent(source, null, uuid, getTime(), null, desc, null, user_id);
    };
  }

  function error() {
    var source = 'ERROR';
    return function (err, req, res, next) {
      var type = err.type || 404;
      var userId = req.session ? req.session.user_id : null;
      writer.writeContent(source, req.ip, req.uuid, getTime(), req.method, err.message, type, userId);
      next(err);
    };
  }

  function exit() {
    console.log('Cleaning up logger files');
  }

  return {
    request  : request,
    external : external,
    error    : error
  };
};
