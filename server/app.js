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
var authenticate = require('./middleware/authentication')();
  
// Routes not factored in to server_structure branch
var taxPayment        = require('./routes/taxPayment')(db, parser),
    donation          = require('./routes/postingDonation')(db, parser);

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

// routers
//app.use('/location', locationRouter);

app.get('/', function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
});

/* new locations API */
//app.use('/location', locationRouter);

// Initialise router
require('./config/routes').initialise(app);


app.use(logger.error());
app.use(liberror.middleware);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('[app] Secure application running on localhost:' + cfg.port);
});

//New methods
//------------------
// New methods to server_structure
// -------------------------------
app.post('/payTax/', function (req, res, next) {
  taxPayment.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
});

app.post('/posting_donation/', function (req, res, next) {
  donation.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
});

app.get('/cost_periodic/:id_project/:cc_id/:start/:end', function(req, res, next) {
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`cc_id`=' + sanitize.escape(req.params.cc_id) + 
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {cost : 0};}
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });


    var cost = availablechargeAccounts.reduce(function (x, y) {
      return x + (y.debit - y.credit);

    }, 0);

    return {cost : cost};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('ccc_periodic', req.params.id_project, {cc_id : req.params.cc_id, start : req.params.start, end : req.params.end, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
});


app.get('/profit_periodic/:id_project/:pc_id/:start/:end', function(req, res, next) {

  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`pc_id`=' + sanitize.escape(req.params.pc_id) + 
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {profit : 0};}
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });

    var profit = availableprofitAccounts.reduce(function (x, y) {
      return x + (y.credit - y.debit);

    }, 0);

    return {profit : profit};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('pcv_periodic', req.params.id_project, {pc_id : req.params.pc_id, start : req.params.start, end : req.params.end, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
});

app.get('/getAccount7/', function (req, res, next) {
  var sql ="SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE '7%' AND account_type_id <> '3'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/taxe_ipr_currency/', function (req, res, next) {
  var sql = "SELECT t.id,t.taux,t.tranche_annuelle_debut,t.tranche_annuelle_fin,t.tranche_mensuelle_debut,t.tranche_mensuelle_fin,t.ecart_annuel,t.ecart_mensuel,t.impot_annuel,t.impot_mensuel,t.cumul_annuel,t.cumul_mensuel,t.currency_id,c.symbol FROM taxe_ipr t, currency c WHERE t.currency_id = c.id";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

//Obtention de periode de paiement

app.get('/getReportPayroll/', function (req, res, next) {
  var sql = "SELECT paiement.uuid, paiement.employee_id, paiement.paiement_period_id, paiement.currency_id,"
          + " paiement.net_before_tax, paiement.net_after_tax, paiement.net_after_tax, paiement.net_salary,"
          + " employee.code, employee.prenom, employee.name, employee.postnom, employee.dob, employee.sexe"
          + " FROM paiement"
          + " JOIN employee ON employee.id = paiement.employee_id"
          + " WHERE paiement_period_id = " + sanitize.escape(req.query.period_id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

// Information sur la fiche de paiement
app.get('/getDataPaiement/', function (req, res, next) {
  var sql = "SELECT paiement.uuid, paiement.employee_id, paiement.paiement_period_id, paiement_period.dateFrom,"
          + " paiement_period.dateTo, paiement.currency_id,"
          + " paiement.net_before_tax, paiement.net_after_tax, paiement.net_after_tax, paiement.net_salary,"
          + " paiement.working_day, paiement.paiement_date, employee.code, employee.prenom, employee.name,"
          + " employee.postnom, employee.dob, employee.sexe, employee.nb_spouse, employee.nb_enfant,"
          + " employee.grade_id, grade.text, grade.code AS 'codegrade', grade.basic_salary"
          + " FROM paiement"
          + " JOIN employee ON employee.id = paiement.employee_id"
          + " JOIN grade ON grade.uuid = employee.grade_id "
          + " JOIN paiement_period ON paiement_period.id = paiement.paiement_period_id"
          + " WHERE paiement.uuid = " + sanitize.escape(req.query.invoiceId);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getDataRubrics/', function (req, res, next) {
  var sql = "SELECT rubric_paiement.id, rubric_paiement.paiement_uuid, rubric_paiement.rubric_id, rubric.label,"
          + " rubric.is_discount, rubric_paiement.value"
          + " FROM rubric_paiement"
          + " JOIN rubric ON rubric.id = rubric_paiement.rubric_id"
          + " WHERE rubric_paiement.paiement_uuid= " + sanitize.escape(req.query.invoiceId);
          
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getDataTaxes/', function (req, res, next) {
  var sql = "SELECT tax_paiement.id, tax_paiement.paiement_uuid, tax_paiement.tax_id, tax.label,"
          + " tax_paiement.value, tax.is_employee"
          + " FROM tax_paiement"
          + " JOIN tax ON tax.id = tax_paiement.tax_id"
          + " WHERE tax.is_employee = '1' AND tax_paiement.paiement_uuid = " + sanitize.escape(req.query.invoiceId);
          
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

// Fin de l'information sur la fiche de paiement

app.get('/getEmployeePayment/:id', function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, e.creditor_uuid, p.uuid as paiement_uuid, p.currency_id, t.label, t.abbr, z.tax_id, z.value, z.posted"
          + " FROM employee e "
          + " JOIN paiement p ON e.id=p.employee_id "
          + " JOIN tax_paiement z ON z.paiement_uuid=p.uuid "
          + " JOIN tax t ON t.id=z.tax_id "
          + " WHERE p.paiement_period_id=" + sanitize.escape(req.params.id) + " AND t.is_employee=1 ";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.put('/setTaxPayment/', function (req, res, next) {
  var sql = "UPDATE tax_paiement SET posted=1"
          + " WHERE tax_paiement.paiement_uuid=" + sanitize.escape(req.body.paiement_uuid) + " AND tax_paiement.tax_id=" + sanitize.escape(req.body.tax_id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getDistinctInventories/', function (req, res, next) {
  var sql = "SELECT DISTINCT inventory.code, inventory.text, stock.inventory_uuid FROM stock"
          + " JOIN inventory ON stock.inventory_uuid=inventory.uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getEnterprisePayment/:employee_id', function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, e.creditor_uuid, p.uuid as paiement_uuid, p.currency_id, t.label, t.abbr, z.tax_id, z.value, z.posted"
          + " FROM employee e "
          + " JOIN paiement p ON e.id=p.employee_id "
          + " JOIN tax_paiement z ON z.paiement_uuid=p.uuid "
          + " JOIN tax t ON t.id=z.tax_id "
          + " WHERE p.paiement_period_id=" + sanitize.escape(req.params.employee_id) + " AND t.is_employee=0 ";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});


//Obtention de periode d'une annee fiscal'

app.get('/getPeriodeFiscalYear/', function (req, res, next) {
  console.log(req.query.fiscal_year_id);
  var sql = "SELECT * FROM period WHERE fiscal_year_id = " + sanitize.escape(req.query.fiscal_year_id);
  console.log(sql);
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

// temporary error handling for development!
app.get('/getExploitationAccount/', function (req, res, next) {
  console.log(req.query.fiscal_year_id);
  var sql = "SELECT period_total.period_id, account.account_number, account.account_txt, period_total.credit, period_total.debit"
          + " FROM period_total"
          + " JOIN account ON account.id = period_total.account_id"
          + " WHERE period_total.period_id = " + sanitize.escape(req.query.period_id)
          + " AND (account.account_number LIKE '6%' OR account.account_number LIKE '7%')"
          + " ORDER BY account.account_number ASC";

  console.log(req.query.period_id);
  if(req.query.period_id === 'all'){
    var sql = "SELECT period_total.period_id, account.account_number, account.account_txt, SUM(period_total.credit) AS 'credit',"
            + " SUM(period_total.debit) AS 'debit'"
            + " FROM period_total"
            + " JOIN account ON account.id = period_total.account_id"
            + " WHERE period_total.fiscal_year_id = " + sanitize.escape(req.query.fiscal_year_id)
            + " AND (account.account_number LIKE '6%' OR account.account_number LIKE '7%')"
            + " GROUP BY account.account_number"
            + " ORDER BY account.account_number ASC";    
  }

  req.query.fiscal_year_id
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
