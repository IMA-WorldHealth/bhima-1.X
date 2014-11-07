#!/usr/local/bin/node

// import node dependencies
var express      = require('express'),
    https        = require('https'),
    fs           = require('fs'),
    url          = require('url'),
    compress     = require('compression'),
    bodyParser   = require('body-parser'),
    session      = require('express-session'),
    cookieParser = require('cookie-parser');

// import configuration
var cfg = require('./config/server.json'),
    options = { key : fs.readFileSync(cfg.tls.key, 'utf8'), cert : fs.readFileSync(cfg.tls.cert, 'utf8') };

// import lib dependencies
//var parser       = require('./lib/parser')(),
var uuid         = require('./lib/guid'),
    logger       = require('./lib/logger')(cfg.log, uuid);

// TODO Temporary layout for transitioning structure
require('./lib/parser').initialise();
require('./lib/db').initialise(cfg.db, logger, uuid);

// FIXME Remove this when routes are no longer defined in app.js
var db = require('./lib/db');
var parser = require('./lib/parser');

var liberror     = require('./lib/liberror')();

// import middleware
var authorize    = require('./middleware/authorization')(cfg.auth.paths),
    authenticate = require('./middleware/authentication')(),
    projects     = require('./middleware/projects')(db);

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
app.use(authorize);
app.use(projects);
app.use(express.static(cfg.static, { maxAge : 10000 }));

app.get('/', function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
});

// Initialise router
require('./config/routes').initialise(app);

// TODO Sync location API with Jon's recent API and new route structure 
app.get('/location/:villageId?', function (req, res, next) {
  var specifyVillage = req.params.villageId ? ' AND `village`.`uuid`=\'' + req.params.villageId + '\'' : '';

  var sql =
    'SELECT `village`.`uuid` as `uuid`, village.uuid as village_uuid, `village`.`name` as `village`, ' +
      '`sector`.`name` as `sector`, sector.uuid as sector_uuid, `province`.`name` as `province`, province.uuid as province_uuid, ' +
      '`country`.`country_en` as `country`, country.uuid as country_uuid ' +
    'FROM `village`, `sector`, `province`, `country` ' +
    'WHERE village.sector_uuid = sector.uuid AND ' +
      'sector.province_uuid = province.uuid AND ' +
      'province.country_uuid=country.uuid ' + specifyVillage + ';';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/village/', function (req, res, next) {

  var sql =
    'SELECT `village`.`uuid` AS `uuid`,  `village`.`name` AS `village`, ' +
    '`sector`.`uuid` AS `sector_uuid`, `sector`.`name` as `sector` ' +
    'FROM `village`, `sector` ' +
    'WHERE village.`sector_uuid` = sector.uuid';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/sector/', function (req, res, next) {

  var sql = 'SELECT `sector`.`uuid` as `uuid`,  `sector`.`name` as `sector`, `province`.`uuid` '+
            'as `province_uuid`, `province`.`name` as `province` FROM `sector`, `province` '+
            'WHERE `sector`.`province_uuid` = `province`.`uuid`';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/province/', function (req, res, next) {
  var sql =
    'SELECT `province`.`uuid` as `uuid`,  `province`.`name` as `province`, `country`.`uuid` '+
      'AS `country_uuid`, `country`.`country_en` as `country_en`, `country`.`country_fr` as `country_fr` ' +
    'FROM `province`, `country` '+
    'WHERE `province`.`country_uuid` = `country`.`uuid`';
  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.use(logger.error());
app.use(liberror.middleware);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('[app] Secure application running on localhost:' + cfg.port);
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
