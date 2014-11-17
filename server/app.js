var express       = require('express'),
    https         = require('https'),
    fs            = require('fs');

var config        = require('./config/environment/server');

// TLS credentials
var privateKey    = fs.readFileSync(config.tls.key, 'utf8');
var certificate   = fs.readFileSync(config.tls.cert, 'utf8');
var credentials   = {key : privateKey, cert : certificate};

// Session configuration
var db            = require('./lib/db').initialise(); //why we need to keep the null reference in db ?
var authenticate  = require('./middleware/authentication')();

var app = express();

// Configure application middleware stack, inject authentication session
require('./config/express')(app, authenticate);

// Link routes
require('./config/routes').initialise(app);

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
