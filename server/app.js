var express       = require('express'),
    https         = require('https'),
    fs            = require('fs');

var config        = require('./config/environment/server');

// SSL credentials
var privateKey    = fs.readFileSync(config.tls.key, 'utf8');
var certificate   = fs.readFileSync(config.tls.cert, 'utf8');
var credentials   = { key : privateKey, cert : certificate };

// Session configuration
var db            = require('./lib/db').initialise();

var app = express();

// Configure application middleware stack, inject authentication session
require('./config/express')(app);

// Link routes
require('./config/routes').initialise(app);

// Load and configure plugins
require('./lib/pluginManager')(app, config.plugins);

// start the server
https.createServer(credentials, app).listen(config.port, logApplicationStart);

process.on('uncaughtException', forceExit);

function logApplicationStart() {
  console.log('[app] BHIMA server started on port :', config.port);
}

function forceExit(err) {
  console.error('[uncaughtException]', err, err.message);
  console.error(err.stack);
  process.exit(1);
}
