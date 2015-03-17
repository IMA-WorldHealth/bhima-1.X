/**
 * Express Server Configuration 
 *
 */
var fs            = require('fs'),
    express       = require('express'),
    compress      = require('compression'),
    bodyParser    = require('body-parser'),
    session       = require('express-session'),
    cookieParser  = require('cookie-parser'),
    morgan        = require('morgan');

var cfg           = require('./../config/environment/server'),
    liberror      = require('./../lib/liberror')(null);


// Accept generic express/ authentication instances (initialised in app.js)
module.exports = function (app, authentication) { 
  console.log('[config/express] Configure express');

  // compress all req/res objects using gzip
  app.use(compress());
  
  // parse form data objects into req.body
  app.use(bodyParser.urlencoded(cfg.bodyParser));
  app.use(bodyParser.json());

  // parse cookies (connect.sid)
  app.use(cookieParser());

  // set up session variables, assigned to req.session
  app.use(session(cfg.session));

  // set up logging
  // set files to append mode
  var accessLogStream = fs.createWriteStream(cfg.morgan.logFile, { flags : 'a' });
  app.use(morgan(cfg.morgan.format,{ stream : accessLogStream }));
   
  // FIXME Only one static directory should be served
  app.use('/css', express.static('client/dest/css', { maxAge : 10000 }));
  app.use('/lib', express.static('client/dest/lib', { maxAge : 10000 }));
  app.use('/i18n', express.static('client/dest/i18n', { maxAge : 10000 }));
  
  // authenticate
  app.use(authentication);
  
  // configure static directory
  app.use(express.static(cfg.static, { maxAge : 10000 }));
  
  // send errors
  app.use(liberror.middleware);
};
