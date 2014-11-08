var express      = require('express'),
    https        = require('https'),
    fs           = require('fs'),
    compress     = require('compression'),
    bodyParser   = require('body-parser'),
    session      = require('express-session'),
    cookieParser = require('cookie-parser');

// import configuration
var cfg = require('./config/server.json'),
    options = { key : fs.readFileSync(cfg.tls.key, 'utf8'), cert : fs.readFileSync(cfg.tls.cert, 'utf8') };

// import lib dependencies
var uuid         = require('./lib/guid'),
    logger       = require('./lib/logger')(cfg.log, uuid);

// Configure database 
// TODO @sfount - Move database initialisation to a config/ file, DB continues to sit in lib
require('./lib/db').initialise(cfg.db, logger, uuid);

var liberror     = require('./lib/liberror')();

// import middleware
var authenticate = require('./middleware/authentication')();

// create app
var app = express();

// middleware configuration
app.use(compress());
app.use(logger.request());
app.use(bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
app.use(cookieParser());
app.use(session(cfg.session));
app.use('/css', express.static('client/dest/css', { maxAge : 10000 })); // FIXME Hardcoded routes to static folder, seperate static and authenticate
app.use('/lib', express.static('client/dest/lib', { maxAge : 10000 }));
app.use('/i18n', express.static('client/dest/i18n', { maxAge : 10000 }));
// app.use('/assets', express.static('client/dest/assets', {maxAge:10000}));
app.use(authenticate);
app.use(express.static(cfg.static, { maxAge : 10000 }));
app.use(logger.error());
app.use(liberror.middleware);

// Configure router
require('./config/routes').initialise(app);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('[app] BHIMA server running on port ' + cfg.port);
});

// temporary error handling for development!
process.on('uncaughtException', function (err) {
  console.log('[uncaughtException]', err);
  process.exit();
});
// temporary debugging to see why the process terminates.
process.on('exit', function () {
  console.log('Process shutting down...');
});
