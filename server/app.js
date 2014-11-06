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
    errorCodes = require('./config/errors.json'),
    options = { key : fs.readFileSync(cfg.tls.key, 'utf8'), cert : fs.readFileSync(cfg.tls.cert, 'utf8') };

// import lib dependencies
//var parser       = require('./lib/parser')(),
var uuid         = require('./lib/guid'),
    logger       = require('./lib/logger')(cfg.log, uuid);
    //db           = require('./lib/db')(cfg.db, logger, uuid),

// TODO Temporary layout for transitioning structure
require('./lib/parser').initialise();
require('./lib/db').initialise(cfg.db, logger, uuid);

// FIXME Remove this when routes are no longer defined in app.js
var db = require('./lib/db');
var parser = require('./lib/parser');

var sanitize     = require('./lib/sanitize'),
    util         = require('./lib/util'),
    validate     = require('./lib/validate')(),
    store        = require('./lib/store'),
    liberror     = require('./lib/liberror')();

// import middleware
var authorize    = require('./middleware/authorization')(cfg.auth.paths),
    authenticate = require('./middleware/authentication')(db, sanitize),
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




app.get('/errorcodes', function (req, res, next) {
  /* jshint unused : false */
  res.send(errorCodes);
});

app.get('/getAccount6/', function (req, res, next) {
  var sql ="SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE '6%' AND account_type_id <> '3'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/available_payment_period/', function (req, res, next) {
  var sql = "SELECT p.id, p.config_tax_id, p.config_rubric_id, p.label, p.dateFrom, p.dateTo, r.label AS RUBRIC, t.label AS TAX, a.label AS ACCOUNT FROM paiement_period p, config_rubric r, config_tax t, config_accounting a WHERE p.config_tax_id = t.id AND p.config_rubric_id = r.id AND a.id=p.config_accounting_id ORDER BY p.id DESC";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.use(logger.error());
app.use(liberror.middleware);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('[app] Secure application running on localhost:' + cfg.port);
});


app.get('/getConsuptionDrugs/', function (req, res, next) {

  var sql = "SELECT consumption.uuid,  SUM(consumption.quantity) AS quantity, consumption.date, inventory.code, inventory.text"
          + " FROM consumption"
          + " JOIN stock ON stock.tracking_number = consumption.tracking_number"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
          + " WHERE consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss )"
          + " AND ((consumption.date >= '"+ req.query.dateFrom +"') AND (consumption.date <= '" + req.query.dateTo + "'))"
          + " GROUP BY inventory.uuid ORDER BY inventory.text ASC";

  db.exec(sql)
  .then(function (result) {
    console.log(result);
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getItemInConsumption/', function (req, res, next) {
  var sql = "SELECT consumption.uuid,  SUM(consumption.quantity) AS quantity, consumption.date, inventory.code, inventory.text"
          + " FROM consumption "
          + " JOIN stock ON stock.tracking_number = consumption.tracking_number"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
          + " WHERE consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss )"
          + " AND inventory.code = '" + req.query.code + "' AND ((consumption.date >= '"+ req.query.dateFrom +"')"
          + " AND (consumption.date <= '" + req.query.dateTo + "'))"
          + " GROUP BY consumption.date";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getTop10Consumption/', function (req, res, next) {
  var sql = "SELECT inventory.text, SUM(consumption.quantity) as 'quantity', inventory.uuid, stock.inventory_uuid "
          + " FROM consumption"
          + " JOIN stock ON stock.tracking_number = consumption.tracking_number"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
          + " WHERE consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss )"
          + " GROUP BY stock.inventory_uuid ORDER BY quantity DESC, inventory.text ASC LIMIT 10";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getPurchaseOrders/', function (req, res, next) {
  var sql;
  if(req.query.request == 'OrdersPayed'){
    sql = "SELECT COUNT(uuid) AS 'count' FROM `purchase` WHERE paid = '1'";  
  } else if (req.query.request == 'OrdersWatingPayment'){
    sql = "SELECT COUNT(uuid) AS 'count' FROM `purchase` WHERE paid = '0'";  
  } else if (req.query.request == 'OrdersReceived'){
    sql = "SELECT COUNT(uuid) AS 'count' FROM `purchase` WHERE closed = '1'";  
  } else if (req.query.request == 'InWatingReception'){
    sql = "SELECT COUNT(uuid) AS 'count' FROM `purchase` WHERE closed = '0' AND confirmed = '1'";  
  }  
  
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getTop10Donor/', function (req, res, next) {
  var sql = "SELECT donor.id, donor.name, donations.date, COUNT(date) AS 'dates' "
          + " FROM donations JOIN donor ON donor.id = donations.donor_id"
          + " GROUP BY donations.date, donor.id ORDER BY donations.date DESC Limit 10";
          
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getConsumptionTrackingNumber/', function (req, res, next) {
  var sql = "SELECT consumption.tracking_number, SUM(consumption.quantity) AS 'quantity'"
          + " FROM consumption"
          + " GROUP BY consumption.tracking_number";   

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getExpiredTimes/', function (req, res, next) {
  var sql;
  if(req.query.request == 'expired'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date, SUM(stock.quantity) AS quantity"
        + " FROM stock"
        + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE stock.expiration_date <= CURDATE()"
        + " GROUP BY stock.tracking_number";  

  } else if(req.query.request == 'expiredDellai'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date,"
        + " SUM(stock.quantity) AS quantity"
        + " FROM stock JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE ((DATEDIFF(stock.expiration_date ,CURDATE()) > '" + req.query.inf + "')"
        + " AND ((DATEDIFF(stock.expiration_date ,CURDATE()) <  '" + req.query.sup + "')))"
        + " GROUP BY stock.tracking_number";  
  } else if(req.query.request == 'oneYear'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date,"
        + " SUM(stock.quantity) AS quantity"
        + " FROM stock JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE (DATEDIFF(stock.expiration_date ,CURDATE()) > '365')"
        + " GROUP BY stock.tracking_number";  
  }     
    
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

//     TOTAL DES ENTREES PAR RAPPORT A UN INVENTORY UUID
app.get('/getStockEntry/', function (req, res, next) {
  var sql = "SELECT stock.inventory_uuid, stock.entry_date, stock.tracking_number, SUM(stock.quantity) AS 'quantity', inventory.text"
          + " FROM stock"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
          + " GROUP BY stock.inventory_uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

//     TOTAL DES CONSOMMATIONS PAR RAPPORT A UN INVENTORY UUID
app.get('/getStockConsumption/', function (req, res, next) {
  var sql = "SELECT inventory.text, SUM(consumption.quantity) AS 'quantity', inventory.uuid, stock.inventory_uuid"
          + " FROM consumption RIGHT JOIN stock ON stock.tracking_number = consumption.tracking_number"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid "
          + " GROUP BY stock.inventory_uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getNombreMoisStockControl/:inventory_uuid', function (req, res, next) {
  var sql = "SELECT COUNT(DISTINCT(MONTH(c.date))) AS nb"
          + " FROM consumption c"
          + " JOIN stock s ON c.tracking_number=s.tracking_number "
          + " JOIN inventory i ON i.uuid=s.inventory_uuid "
          + " WHERE (c.date BETWEEN DATE_SUB(CURDATE(),INTERVAL 6 MONTH) AND CURDATE()) "
          + " AND s.inventory_uuid=" + sanitize.escape(req.params.inventory_uuid);

  db.exec(sql)
  .then(function (result) {
    console.log(result);
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/monthlyConsumptions/:inventory_uuid/:nb', function (req, res, next) {
  var sql = "SELECT c.uuid, c.date, SUM(c.quantity) AS quantity, s.inventory_uuid "
          + " FROM consumption c "
          + " JOIN stock s ON s.tracking_number=c.tracking_number "
          + " JOIN inventory i ON i.uuid=s.inventory_uuid "
          + " WHERE s.inventory_uuid=" + sanitize.escape(req.params.inventory_uuid)
          + " AND c.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss )"
          + " AND (c.date BETWEEN DATE_SUB(CURDATE(),INTERVAL " + sanitize.escape(req.params.inventory_uuid) + " MONTH) AND CURDATE())"
          + " GROUP BY i.uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getDelaiLivraison/:id', function (req, res, next) {
  var sql = "SELECT ROUND(AVG(CEIL(DATEDIFF(s.entry_date,p.purchase_date)/30))) AS dl"
          + " FROM purchase p"
          + " JOIN stock s ON p.uuid=s.purchase_order_uuid "
          + " JOIN purchase_item z ON p.uuid=z.purchase_uuid "
          + " JOIN inventory i ON s.inventory_uuid=i.uuid "
          + " WHERE z.inventory_uuid=s.inventory_uuid "
          + " AND s.inventory_uuid=" + sanitize.escape(req.params.id);

  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getCommandes/:id', function (req, res, next) {
  var sql = "SELECT p.purchase_date AS date_commande"
          + " FROM purchase p"
          + " JOIN purchase_item z ON p.uuid=z.purchase_uuid "
          + " JOIN inventory i ON z.inventory_uuid=i.uuid "
          + " WHERE z.inventory_uuid=" + sanitize.escape(req.params.id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getMonthsBeforeExpiration/:id', function (req, res, next) {
  var sql = "SELECT s.tracking_number, s.lot_number, FLOOR(DATEDIFF(s.expiration_date,CURDATE())/30) AS months_before_expiration"
          + " FROM stock s"
          + " JOIN inventory i ON s.inventory_uuid=i.uuid "
          + " WHERE s.inventory_uuid=" + sanitize.escape(req.params.id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
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
