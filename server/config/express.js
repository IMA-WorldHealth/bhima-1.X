/**
 * Express Server Configuration 
 */
var express       = require('express');
var compress      = require('compression');
var bodyParser    = require('body-parser');
var session       = require('express-session');
var cookieParser  = require('cookie-parser');
var morgan        = require('morgan');
var fs            = require('fs');

var cfg           = require('./../config/environment/server');
var liberror      = require('./../lib/liberror')(null);

// Accept generic express/ authentication instances (initialised in app.js)
module.exports = function (app, authentication) { 
  console.log('[config/express] Configure express');
  
  // middleware
  app.use(compress());
  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session(cfg.session));
  
  // morgan logger setup
  // options: combined | common | dev | short | tiny |
  // Recommend 'combined' for production settings.
  //
  // Uncomment if you want logs written to a file instead
  // of piped to standard out (default).
  //var logFile = fs.createWriteStream(__dirname + '/access.log', {flags : 'a'});
  //app.use(morgan('short', { stream : logFile }));
  app.use(morgan('short'));
   
  // FIXME Only one static directory should be served
  app.use('/css', express.static('client/dest/css', { maxAge : 10000 }));
  app.use('/lib', express.static('client/dest/lib', { maxAge : 10000 }));
  app.use('/i18n', express.static('client/dest/i18n', { maxAge : 10000 }));
  
  app.use(authentication);
  
  app.use(express.static(cfg.static, { maxAge : 10000 }));
  app.use(liberror.middleware);
};
