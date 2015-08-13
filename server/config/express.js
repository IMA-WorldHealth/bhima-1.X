/**
 * Express Server Configuration
 */
var express       = require('express'),
    compress      = require('compression'),
    bodyParser    = require('body-parser'),
    session       = require('express-session'),
    FileStore     = require('session-file-store')(session),
    morgan        = require('morgan'),
    fs            = require('fs');

var cfg           = require('./../config/environment/server');

// Accept generic express/ authentication instances (initialised in app.js)
module.exports = function (app, authentication) {
  console.log('[config/express] Configure express');

  // middleware
  app.use(compress());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // stores session in a file store so that server restarts do
  // not interrupt sessions.
  app.use(session({
    store             : new FileStore(),
    secret            : cfg.session.secret,
    saveUninitialized : cfg.session.saveUninitialized,
    resave            : cfg.session.resave,
    unset             : 'destroy',
    cookie            : { secure : true }
  }));

  // morgan logger setup
  // options: combined | common | dev | short | tiny |
  // Recommend 'combined' for production settings.
  //
  // Uncomment if you want logs written to a file instead
  // of piped to standard out (default).
  //var logFile = fs.createWriteStream(__dirname + '/access.log', {flags : 'a'});
  //app.use(morgan('short', { stream : logFile }));
  app.use(morgan('short'));

  // serve static files from a single location
  // NOTE the assumption is that this entire directory is public - 
  // there is no need to authenticate users to access the public
  // directory.
  var days = 1000 * 60 * 60 * 24;
  app.use(express.static('client/dest/', { maxAge : 7*days }));

  // require login for contained routes
  app.use(authentication);

  // new error handler
  app.use(function (err, req, res, next) {
    console.log('[ERROR]', err);
    res.status(500).json(err);
  });
};
