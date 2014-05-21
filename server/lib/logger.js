// scripts/lib/database/logger.js

// Module: logger

// This module is responsible for timestamping and logging
// queries to the database.

var fs = require('fs');

module.exports = (function (cfg) {
  'use strict';

  cfg = cfg || {};

  var logFile = cfg.file || './scripts/lib/database/db.log',
      delimiter = cfg.delimiter || '\t',
      headers = cfg.headers || [];

  // create our logger
  var io = fs.createWriteStream(logFile);

  // write headers
  io.on('open', function () {
    io.write('/* =================================== */\n');
    io.write('/* Logger opened at ' + new Date().toLocaleTimeString() + ' */\n'); 
    io.write('/* Log file : ' + logFile + ' */\n');
    io.write('/* HEADERS \n');
    headers.forEach(function (header) {
      io.write(' * ' + header + '\n'); 
    });
    io.write('*/\n');
    io.write('/* =================================== */\n');
    io.write(['TimeStamp', 'Query\n'].join(delimiter));
  });

  // logging
  io.on('log', function (data) {
    io.write([new Date().toLocaleTimeString(), data + '\n'].join(delimiter));
  });

  // log connecting
  io.on('connecting', function (credentials) {
    var creds = Object.keys(credentials)
      .map(function (cred) { return [cred, credentials[cred]].join(':'); });
    io.write('Connection with creditentials:' + creds.toString() + '\n');
  });

  // final writes
  io.on('close', function () {
    io.write('/* =================================== */\n');
    io.write('/* Log closed at ' + new Date().toLocaleTimeString() + ' */\n');
  });

  // log errors
  io.on('error', function (err) {
    io.write('ERROR: ' + JSON.stringify(err));
  });

  return io;

});
