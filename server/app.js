var express       = require('express'),
    https         = require('https'),
    fs            = require('fs');

var config        = require('./config/environment/server');

// SSL credentials
var privateKey    = fs.readFileSync(config.tls.key, 'utf8');
var certificate   = fs.readFileSync(config.tls.cert, 'utf8');
var credentials   = { key : privateKey, cert : certificate };

// Set the appropriate timezone for interpretting the server's data
// NOTE : In a proper installation, this should be an environmental variable
process.env.TZ = 'UTC';

// Session configuration
var db            = require('./lib/db').initialise(); // FIXME why we need to keep the null reference in db ?

// Only allow routes to use /login if session not exists
var authenticate  = function (req, res, next) {
  if (req.session.user === undefined && req.path !== '/login') {
    res.status(401).send('ERR_NOT_LOGGED_IN');
  } else {
    next();
  }
};

var app = express();

// Configure application middleware stack, inject authentication session
require('./config/express')(app, authenticate);

// Link routes
require('./config/routes').initialise(app);

// Load and configure plugins
require('../plugins/pluginManager')(app, config);

https.createServer(credentials, app).listen(config.port, logApplicationStart);

process.on('uncaughtException', forceExit);

function logApplicationStart() {
  console.log('[app] BHIMA server started on port :', config.port);
}

function forceExit(err) {
  console.error('[uncaughtException]', err.message);
  console.error(err.stack);
  process.exit(1);
}
