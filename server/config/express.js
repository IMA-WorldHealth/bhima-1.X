/**
 * Express Server Configuration 
 *
 */
var express       = require('express');
var compress      = require('compression');
var bodyParser    = require('body-parser');
var session       = require('express-session');
var cookieParser  = require('cookie-parser');

var cfg           = require('./../config/environment/server');
var logger        = require('./../lib/logger');
var liberror      = require('./../lib/liberror')(null);

// Accept generic express/ authentication instances (initialised in app.js)
module.exports = function (app, authentication) { 
  console.log('[config/express] Configure express');

  app.use(compress());
  app.use(logger.request());
  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session(cfg.session));
   
  // FIXME Only one static directory should be served
  app.use('/css', express.static('client/dest/css', { maxAge : 10000 }));
  app.use('/lib', express.static('client/dest/lib', { maxAge : 10000 }));
  app.use('/i18n', express.static('client/dest/i18n', { maxAge : 10000 }));
  
  app.use(authentication);
  
  app.use(express.static(cfg.static, { maxAge : 10000 }));
  
  app.use(logger.error());
  app.use(liberror.middleware);
};
