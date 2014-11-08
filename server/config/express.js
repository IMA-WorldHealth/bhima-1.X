/**
 * Express Server Configuration 
 *
 */
var express       = require('express');
var compress      = require('compression');
var bodyParser    = require('body-parser');
var session       = require('express-session');
var cookieParser  = require('cookie-parser');

var logger        = require('./../lib/logger')(null);

// Accept generic express/ authentication instances (initialised in app.js)
module.exports = function (app, authentication) { 
  console.log('[config/express] Initialise Express');

  app.use(compress());
  app.use(logger.request());
  app.use(bodyParser());
  app.use(session(cfg.session));
  
  // FIXME Only one static directory should be served
  
};
