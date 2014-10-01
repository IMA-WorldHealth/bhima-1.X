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
var parser       = require('./lib/parser')(),
    uuid         = require('./lib/guid'),
    logger       = require('./lib/logger')(cfg.log, uuid),
    db           = require('./lib/db')(cfg.db, logger, uuid),
    sanitize     = require('./lib/sanitize'),
    util         = require('./lib/util'),
    validate     = require('./lib/validate')(),
    store        = require('./lib/store'),
    liberror     = require('./lib/liberror')();

// import middleware
var authorize    = require('./middleware/authorization')(cfg.auth.paths),
    authenticate = require('./middleware/authentication')(db, sanitize),
    projects     = require('./middleware/projects')(db);

// import routes
var report            = require('./routes/report')(db, sanitize, util),
    trialbalance      = require('./routes/trialbalance')(db, sanitize, util, uuid),
    ledger            = require('./routes/ledger')(db, sanitize),
    fiscal            = require('./routes/fiscal')(db),
    synthetic         = require('./routes/synthetic')(db, sanitize),
    journal           = require('./routes/journal')(db, sanitize, util, validate, store, uuid),
    createSale        = require('./routes/createSale')(db, parser, journal, uuid),
    createPurchase    = require('./routes/createPurchase')(db, parser, journal, uuid),
    depotRouter       = require('./routes/depot')(db, sanitize, store),
    tree              = require('./routes/tree')(db, parser),
    drugRouter        = require('./routes/drug')(db),
    locationRouter    = require('./routes/location')(db, express.Router()),
    dataRouter        = require('./routes/data')(db, parser, express.Router()),
    serviceDist       = require('./routes/serviceDist')(db, parser, journal, uuid),
    consumptionLoss   = require('./routes/consumptionLoss')(db, parser, journal, uuid),
    donation          = require('./routes/postingDonation')(db, parser, journal, uuid);

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

// routers
app.use('/data', dataRouter);
app.use('/location', locationRouter);

app.get('/', function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
});

/* this is required for location select */
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

app.post('/purchase', function (req, res, next) {
  createPurchase.run(req.session.user_id, req.body)
  .then(function (id) {
    res.status(200).send({ purchaseId : id });
  })
  .catch(next)
  .done();
});

app.post('/sale/', function (req, res, next) {

  createSale.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({saleId: ans});
  });
});

app.post('/service_dist/', function (req, res, next) {
  serviceDist.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({dist: ans});
  });
});

app.post('/consumption_loss/', function (req, res, next) {
  consumptionLoss.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({dist: ans});
  });
});

app.post('/posting_donation/', function (req, res, next) {
  donation.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
});

app.get('/services/', function (req, res, next) {
  var sql =
    'SELECT `service`.`id`, `service`.`name` AS `service`, `service`.`project_id`, `service`.`cost_center_id`, `service`.`profit_center_id`, `cost_center`.`text` AS `cost_center`, `profit_center`.`text` AS `profit_center`, `project`.`name` AS `project` '+
    'FROM `service` JOIN `cost_center` JOIN `profit_center` JOIN `project` ON `service`.`cost_center_id`=`cost_center`.`id` AND `service`.`profit_center_id`=`profit_center`.`id` '+
    'AND `service`.`project_id`=`project`.`id`';
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/available_cost_center/', function (req, res, next) {
  var sql =
    'SELECT `cost_center`.`text`, `cost_center`.`id`, `cost_center`.`project_id`, `service`.`name` '+
    'FROM `cost_center` LEFT JOIN `service` ON `service`.`cost_center_id`=`cost_center`.`id`';

  function process(ccs) {
    var costCenters = ccs.filter(function(item) {
      return !item.name;
    });
    return costCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
});


app.get('/employee_list/', function (req, res, next) {
  var sql =

    "SELECT " +
    "`employee`.`id`, `employee`.`code` AS `code_employee`, `employee`.`prenom`, `employee`.`name`, " +
    "`employee`.`postnom`, `employee`.`sexe`, `employee`.`dob`, `employee`.`date_embauche`, `employee`.`service_id`, " +
    "`employee`.`nb_spouse`, `employee`.`nb_enfant`, `employee`.`grade_id`, `grade`.`text`, `grade`.`basic_salary`, " +
    "`employee`.`phone`, `employee`.`email`, `employee`.`adresse`, `employee`.`bank`, `employee`.`bank_account`, `employee`.`daily_salary`, `employee`.`location_id`, " +  
    "`grade`.`code` AS `code_grade`, `debitor`.`uuid` as `debitor_uuid`, `debitor`.`text` AS `debitor_text`,`debitor`.`group_uuid` as `debitor_group_uuid`, " + 
    "`creditor`.`uuid` as `creditor_uuid`, `creditor`.`text` AS `creditor_text`, `creditor`.`group_uuid` as `creditor_group_uuid` " +
    "FROM " +
    "`employee`, `grade`, `debitor`, `creditor` " +
    "WHERE " +
    "`employee`.`grade_id` = `grade`.`uuid` AND " + 
    "`employee`.`debitor_uuid` = `debitor`.`uuid` AND " +
    "`employee`.`creditor_uuid` = `creditor`.`uuid` "


  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/journal_list/', function (req, res, next) {

  var sql =
    "SELECT `posting_journal`.`uuid`, `posting_journal`.`fiscal_year_id`, `posting_journal`.`period_id`, " + 
    "`posting_journal`.`trans_id`, `posting_journal`.`trans_date`, `posting_journal`.`doc_num`, " + 
    "`posting_journal`.`description`, `posting_journal`.`account_id`, `posting_journal`.`debit`, " +
    "`posting_journal`.`credit`, `posting_journal`.`currency_id`, `posting_journal`.`deb_cred_uuid`, " +
    "`posting_journal`.`deb_cred_type`, `posting_journal`.`inv_po_id`, " +
    "`posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, `posting_journal`.`currency_id`, " + 
    "`posting_journal`.`comment`, `posting_journal`.`user_id`, `posting_journal`.`pc_id`, " + 
    "`posting_journal`.`cc_id`, `account`.`account_number`, `user`.`first`, " +
    "`user`.`last`, `currency`.`symbol`, `cost_center`.`text` AS `cc`, " +
    "`profit_center`.`text` AS `pc` " +
    "FROM `posting_journal` JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` " + 
    "JOIN `user` ON `posting_journal`.`user_id`=`user`.`id` " + 
    "JOIN `currency` ON `posting_journal`.`currency_id`=`currency`.`id` " + 
    "LEFT JOIN `cost_center` ON `posting_journal`.`cc_id`=`cost_center`.`id` " + 
    "LEFT JOIN `profit_center` ON `posting_journal`.`pc_id`=`profit_center`.`id`"

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/hollyday_list/:pp/:employee_id', function (req, res, next) {
  var pp = JSON.parse(req.params.pp);
  var sql =
    "SELECT `hollyday`.`id`, `hollyday`.`label`, `hollyday`.`dateFrom`, `hollyday`.`dateTo` " + 
    "FROM `hollyday` WHERE " + 
    "((`hollyday`.`dateFrom`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " +
    "(`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " + 
    "(`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ")) AND " +
    "`hollyday`.`employee_id`=" + sanitize.escape(req.params.employee_id) + ";"; 

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});


app.get('/period_paiement/', function (req, res, next) {
  // var sql =

  //   "SELECT " +
  //   "`"
  //   "FROM " +
  //   "`employee`, `grade`, `debitor`, `creditor` " +
  //   "WHERE " +
  //   "`employee`.`grade_id` = `grade`.`uuid` AND " + 
  //   "`employee`.`debitor_uuid` = `debitor`.`uuid` AND " +
  //   "`employee`.`creditor_uuid` = `creditor`.`uuid` "


  // db.exec(sql)
  // .then(function (result) {
  //   res.send(result);
  // })
  // .catch(function (err) { next(err); })
  // .done();
});

app.get('/available_profit_center/', function (req, res, next) {
  var sql =
    'SELECT `profit_center`.`text`, `profit_center`.`id`, `profit_center`.`project_id`, `service`.`name` '+
    'FROM `profit_center` LEFT JOIN `service` ON `service`.`profit_center_id`=`profit_center`.`id`';

  function process(pcs) {
    var profitCenters = pcs.filter(function(item) {
      return !item.name;
    });
    return profitCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();

});

app.get('/currentProject', function (req, res, next) {
  var sql =
    'SELECT `project`.`id`, `project`.`name`, `project`.`abbr`, `project`.`enterprise_id`, `enterprise`.`currency_id`, `enterprise`.`location_id`, `enterprise`.`name` as \'enterprise_name\', `enterprise`.`phone`, `enterprise`.`email`, `village`.`name` as \'village\', `sector`.`name` as \'sector\' ' +
    'FROM `project` JOIN `enterprise` ON `project`.`enterprise_id`=`enterprise`.`id` JOIN `village` ON `enterprise`.`location_id`=`village`.`uuid` JOIN `sector` ON `village`.`sector_uuid`=`sector`.`uuid` ' +
    'WHERE `project`.`id`=' + req.session.project_id + ';';
  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
});

// FIXME: this is terribly insecure.  Please remove
app.get('/user_session', function (req, res) {
  res.send({ id: req.session.user_id });
});

app.get('/pcash_transfer_summers', function (req, res, next) {
  var sql =
    'SELECT `primary_cash`.`reference`, `primary_cash`.`date`, `primary_cash`.`cost`, `primary_cash`.`currency_id` '+
    'FROM `primary_cash` WHERE `primary_cash`.`origin_id`= (SELECT DISTINCT `primary_cash_module`.`id` FROM `primary_cash_module` '+
    'WHERE `primary_cash_module`.`text`=\'transfer\') ORDER BY date, reference DESC LIMIT 20;'; //FIX ME : this request doesn't sort
  db.exec(sql)
  .then(function () {
    var d = []; //for now
    res.send(d);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/trialbalance/initialize', function (req, res, next) {
  trialbalance.run(req.session.user_id, function (err, result) {
    if (err) { return next(err); }
    res.send(200, result);
  });
});

app.get('/trialbalance/submit/:key/', function (req, res, next) {
  trialbalance.postToGeneralLedger(req.session.user_id, req.params.key)
  .then(function () {
    res.send(200);
  })
  .catch(next)
  .done();
});

app.get('/editsession/authenticate/:pin', function (req, res, next) {
  var decrypt = req.params.pin >> 5;
  var sql = 'SELECT pin FROM user WHERE user.id = ' + req.session.user_id +
    ' AND pin = \'' + decrypt + '\';';
  db.exec(sql)
  .then(function (rows) {
    res.send({ authenticated : !!rows.length });
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/journal/:table/:id', function (req, res, next) {
  // What are the params here?
  journal.request(req.params.table, req.params.id, req.session.user_id, function (err) {
    if (err) { return next(err); }
    res.send(200);
  });
});

//FIXME receive any number of tables using regex
app.get('/max/:id/:table/:join?', function (req, res) {
  var maxRequest, id = req.params.id,
      table = req.params.table,
      join = req.params.join;

  maxRequest = 'SELECT MAX(' + id + ') FROM ';

  maxRequest += '(SELECT MAX(' + id + ') AS `' + id + '` FROM ' + table;
  if (join) {
    maxRequest += ' UNION ALL SELECT MAX(' + id + ') AS `' + id + '` FROM ' + join + ')a;';
  } else {
    maxRequest += ')a;';
  }

  db.exec(maxRequest)
  .then(function (ans) {
    res.send({max: ans[0]['MAX(' + id + ')']});
  })
  .catch(function (err) {
    res.send(500, {info: 'SQL', detail: err});
    console.error(err);
    return;
  })
  .done();
});

app.get('/ledgers/debitor/:id', function (req, res, next) {
  ledger.debitor(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});

app.get('/ledgers/debitor_group/:id', function (req, res, next) {
  ledger.debitor_group(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});

app.get('/ledgers/distributableSale/:id', function (req, res, next) {
  ledger.distributableSale(req.params.id)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
});


app.get('/fiscal/:enterprise/:startDate/:endDate/:description', function (req, res) {
  var enterprise = req.params.enterprise;
  var startDate = new Date(Number(req.params.startDate));
  var endDate = new Date(Number(req.params.endDate));
  var description = req.params.description;

  fiscal.create(enterprise, startDate, endDate, description)
  .then(function (status) {
    res.status(200).send(status);
  })
  .catch(function (err) {
    res.status(500).send(err);
  })
  .done();
});

app.get('/reports/:route/', function(req, res, next) {
  var route = req.params.route;

  //parse the URL for data following the '?' character
  var query = decodeURIComponent(url.parse(req.url).query);

  report(route, query, function(report, err) {
    if (err) { return next(err); }
    res.send(report);
  });
});

app.get('/InExAccounts/:id_enterprise/', function(req, res, next) {
  // var sql = 'SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = ''+req.params.id_enterprise+'''+
  // ' AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'';
  var sql =
    'SELECT account.id, account.account_number, account.account_txt, parent ' +
    'FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ';';
  function process(accounts) {
    var InExAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0;
    });
    return InExAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/availableAccounts/:id_enterprise/', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/availableAccounts_profit/:id_enterprise/', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});


app.get('/cost/:id_project/:cc_id', function(req, res, next) {
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`cc_id` = ' + sanitize.escape(req.params.cc_id) + 
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
    synthetic('ccc', req.params.id_project, {cc_id : req.params.cc_id, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
});


app.get('/profit/:id_project/:service_id', function(req, res, next) {
  function process (values) {
    if (values.length <= 0) { return {profit : 0}; }
    var som = 0;
    values.forEach(function (value) {
      som+= value.credit;
    });
    return {profit:som};
  }

  synthetic('sp', req.params.id_project, {service_id : req.params.service_id}, function (err, data) {
    if (err) { return next(err); }
    res.send(process(data));
  });
});

app.get('/costCenterAccount/:id_enterprise/:cost_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN cost_center ' +
    'ON account.cc_id = cost_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.cc_id = ' + sanitize.escape(req.params.cost_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/profitCenterAccount/:id_enterprise/:profit_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN profit_center ' +
    'ON account.pc_id = profit_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.pc_id = ' + sanitize.escape(req.params.profit_center_id) + ';';

  function process(accounts) {
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availableprofitAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/removeFromCostCenter/:tab', function(req, res, next) {
  var tabs = JSON.parse(req.params.tab);

  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`cc_id` = NULL WHERE `account`.`id` IN ('+tabs.join(',')+')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});

app.get('/removeFromProfitCenter/:tab', function(req, res, next) {
  var tabs = JSON.parse(req.params.tab);
  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`pc_id` = NULL WHERE `account`.`id` IN (' + tabs.join(',') + ')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
});


app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', function(req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN auxiliairy_center ' +
    'ON account.auxiliairy_center_id = auxiliairy_center.id ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.auxiliairy_center_id = ' + sanitize.escape(req.params.auxiliairy_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
});

app.get('/getCheckHollyday/', function (req, res, next) {
  var sql = "SELECT id, employee_id, label, dateTo, dateFrom FROM hollyday WHERE employee_id = '"+ req.query.employee_id +"'"
          + " AND ((dateFrom >= '" + req.query.dateFrom +"') OR (dateTo >= '" + req.query.dateFrom + "') OR (dateFrom >= '"+ req.query.dateTo +"')"
          + " OR (dateTo >= '" + req.query.dateTo + "'))"
          + " AND ((dateFrom <= '" + req.query.dateFrom +"') OR (dateTo <= '" + req.query.dateFrom + "') OR (dateFrom <= '"+ req.query.dateTo +"')"
          + " OR (dateTo <= '" + req.query.dateTo + "'))"
  if (req.query.line !== ""){
    sql += " AND id <> '" + req.query.line + "'";
  }

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getCheckOffday/', function (req, res, next) {
  var sql ="SELECT * FROM offday WHERE date = '" + req.query.date + "' AND id <> '" + req.query.id +"'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});


/* new locations API */
app.use('/location', locationRouter);

app.get('/tree', function (req, res, next) {
  /* jshint unused : false*/

  tree.load(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  })
  .catch(function (err) {
    res.send(301, err);
  })
  .done();
});

app.get('/village/', function (req, res, next) {
  /*jshint unused : false*/

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

  /*jshint unused : false*/
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
  /*jshint unused : false*/
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

// FIXME : make this code more modular
app.get('/visit/:patientId', function (req, res, next) {
  var sql, id = req.params.patientId;
  sql =
    'INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES (?, ?, ?);';

  db.exec(sql, [uuid(), id, req.session.user_id])
  .then(function () {
    res.send();
  })
  .catch(next)
  .done();
});

app.get('/caution/:debitor_uuid/:project_id', function (req, res, next) {
  var sql, debitor_uuid = sanitize.escape(req.params.debitor_uuid),
      project_id = sanitize.escape(req.params.project_id);
  //prochaine enterprise_id sera obtenue par requette via debitor_id

  sql =
    'SELECT `enterprise`.`currency_id` ' +
    'FROM `enterprise` ' +
    'WHERE `enterprise`.`id` = (SELECT `project`.`enterprise_id` FROM `project` WHERE `project`.`id`='+project_id+')';

  db.exec(sql)
  .then(function (ans) {
    var currency_id = ans.pop().currency_id;
    sql =
      'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `t`.`debit_equiv` AS `debit`, ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`description`, `t`.`account_id` ' +
        'FROM (' +
          'SELECT `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`account_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit_equiv`, ' +
            '`posting_journal`.`credit_equiv`, `posting_journal`.`deb_cred_uuid`, ' +
            '`posting_journal`.`trans_id`, `posting_journal`.`description` ' +
          'FROM `posting_journal` WHERE `posting_journal`.`deb_cred_uuid` = ' + debitor_uuid +
        ' UNION ' +
          'SELECT `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`account_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit_equiv`, ' +
            '`general_ledger`.`credit_equiv`, `general_ledger`.`deb_cred_uuid`, ' +
            '`general_ledger`.`trans_id`, `general_ledger`.`description` ' +
          'FROM `general_ledger` WHERE `general_ledger`.`deb_cred_uuid` = ' + debitor_uuid +
        ') AS `t` JOIN `account` ON `t`.`account_id` = `account`.`id` ' +
        'WHERE `t`.`account_id` IN (' +
          'SELECT `caution_box_account_currency`.`account_id` FROM `caution_box_account_currency` ' +
          'WHERE `caution_box_account_currency`.`currency_id`=' +currency_id +
          ' AND `caution_box_account_currency`.`caution_box_id`= (SELECT distinct `caution_box`.`id` FROM `caution_box` WHERE `caution_box`.`project_id`='+ project_id +'));';
    return db.exec(sql);
  })
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/account_balance/:id', function (req, res, next) {
  // TODO : put this in a module!
  var enterprise_id = req.params.id;

  var sql =
    'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, account_type.`type`, temp.`parent`, temp.`fixed`, temp.`balance` FROM ' +
    '(' +
      'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, account.fixed, period_total.credit - period_total.debit as balance ' +
      'FROM account LEFT JOIN period_total ' +
      'ON account.id=period_total.account_id ' +
      'WHERE account.enterprise_id = ' + sanitize.escape(enterprise_id) +
    ') ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id = account_type.id ' +
    'ORDER BY temp.account_number;';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (err) { next(err); })
  .done();
});


app.get('/synthetic/:goal/:project_id?', function (req, res, next) {
  var query = decodeURIComponent(url.parse(req.url).query);
  synthetic(req.params.goal, req.params.project_id, query, function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/period/:date', function (req, res, next) {
  var date = sanitize.escape(util.toMysqlDate(new Date(Number(req.params.date))));

  var sql =
    'SELECT id, fiscal_year_id FROM period ' +
    'WHERE period_start <= ' + date + ' AND period_stop >= ' + date + ' LIMIT 1';

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/lot/:inventory_uuid', function (req, res, next) {
  var sql = 'SELECT expiration_date, lot_number, tracking_number, quantity, code, uuid, text FROM stock, inventory WHERE inventory.uuid = stock.inventory_uuid AND stock.inventory_uuid='+sanitize.escape(req.params.inventory_uuid);
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/max_trans/:project_id', function (req, res, next) {
  var project_id = sanitize.escape(req.params.project_id);
  var sql =
    'SELECT abbr, max(increment) AS increment FROM (' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ' ' +
      'UNION ' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ')c;';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/print/journal', function (req, res, next) {
  /*jshint unused : false*/
  res.send('Under Contruction');
});

app.get('/inventory/depot/:depot/*', function (req, res, next) {
  depotRouter(req.url, req.params.depot)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/inventory/drug/:code', function (req, res, next) {
  drugRouter(req.params.code)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/stockIn/:depot_uuid/:df/:dt', function (req, res, next) {
  var sql;
  var condition =
    'WHERE stock.expiration_date >= ' + sanitize.escape(req.params.df) + ' ' +
    'AND stock.expiration_date <= ' + sanitize.escape(req.params.dt);
  condition += (req.params.depot_uuid === '*') ? '' : ' AND consumption.depot_uuid = ' + sanitize.escape(req.params.depot_uuid) + ' ';

  if (req.params.depot_uuid === '*') {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, stock.lot_number, SUM(consumption.quantity) AS consumed, ' +
        'stock.expiration_date, stock.quantity as initial ' +
      'FROM stock LEFT JOIN consumption ON ' +
        'stock.tracking_number=consumption.tracking_number '+condition+
        'GROUP BY stock.tracking_number;';

  } else {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, '+
      'stock.lot_number, stock.quantity, SUM(consumption.quantity) AS consumed,'+
      'movement.quantity, ';
  }

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});


app.get('/expiring/:depot_uuid/:df/:dt', function (req, res, next) {
  //TODO : put it in a separate file

  db.exec(req.params.depot_uuid === '*' ? genSql() : speSql())
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

  function genSql () {
    return 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.quantity as initial, stock.expiration_date, inventory.text '+
          'FROM stock JOIN inventory ON stock.inventory_uuid = inventory.uuid '+
          'WHERE DATE(stock.expiration_date) >=DATE('+sanitize.escape(req.params.df)+')'+
          ' AND DATE(stock.expiration_date) <=DATE('+sanitize.escape(req.params.dt)+')';
  }

  function speSql() {
    return 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, (movement.quantity*-1))) as current, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS initial, inventory.text FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
          'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') AND stock.expiration_date>='+sanitize.escape(req.params.df)+
          ' AND stock.expiration_date<='+sanitize.escape(req.params.dt)+' GROUP BY movement.tracking_number';
  }
});

app.get('/expiring_complete/:tracking_number/:depot_uuid', function (req, res, next) {
  //TODO : put it in a separate file
  db.exec(req.params.depot_uuid === '*' ? genSql() : speSql())
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

  function genSql () {
    return 'SELECT SUM(consumption.quantity) AS consumed FROM stock LEFT JOIN consumption '+
           'ON stock.tracking_number = consumption.tracking_number WHERE stock.tracking_number='+sanitize.escape(req.params.tracking_number);
  }

  function speSql () {
    return 'SELECT SUM(consumption.quantity) AS consumed FROM stock LEFT JOIN consumption '+
         'ON stock.tracking_number = consumption.tracking_number WHERE stock.tracking_number='+sanitize.escape(req.params.tracking_number)+
         ' AND consumption.depot_uuid='+sanitize.escape(req.params.depot_uuid);
  }
});

app.get('/serv_dist_stock/:depot_uuid', function (req, res, next) {
  //TODO : put it in a separate file
 var sql= 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS entered, SUM(if (movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS moved,  inventory.text, inventory.code, inventory.purchase_price  FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
          'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') GROUP BY stock.tracking_number';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
      next(err);
  })
  .done();
});

app.get('/inv_in_depot/:depot_uuid', function (req, res, next){
  var sql = 'SELECT '+
            'distinct inventory.text, '+
            'inventory.uuid, '+
            'inventory.code '+
            'FROM stock JOIN inventory JOIN ON stock.inventory_uuid = inventory.uuid '+
            'WHERE stock.depot_uuid='+sanitize.escape(req.params.depot_uuid);

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
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

app.get('/getAccount7/', function (req, res, next) {
  var sql ="SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE '7%' AND account_type_id <> '3'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/available_payment_period/', function (req, res, next) {
  var sql = "SELECT p.id, p.config_tax_id, p.config_rubric_id, p.config_accounting_id, p.label, p.dateFrom, p.dateTo, r.label AS RUBRIC, t.label AS TAX, a.label AS ACCOUNT FROM paiement_period p, config_rubric r, config_tax t, config_accounting a WHERE p.config_tax_id = t.id AND p.config_rubric_id = r.id AND a.id=p.config_accounting_id ORDER BY p.id DESC";
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

app.use(logger.error());
app.use(liberror.middleware);

https.createServer(options, app)
.listen(cfg.port, function () {
  console.log('Secure application running on localhost:' + cfg.port);
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

app.get('/getNombreMoisStockControl/:inventory_uuid', function (req, res, next) {

  var sql = "SELECT COUNT(DISTINCT(MONTH(c.date))) AS nb"
          + " FROM consumption c"
          + " JOIN stock s ON c.tracking_number=s.tracking_number "
          + " JOIN inventory i ON i.uuid=s.inventory_uuid "
          + " WHERE (c.date BETWEEN DATE_SUB(CURDATE(),INTERVAL 6 MONTH) AND CURDATE()) "
          + " AND s.inventory_uuid=" + sanitize.escape(req.params.inventory_uuid);

  db.exec(sql)
  .then(function (result) {
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
          + " AND (c.date BETWEEN DATE_SUB(CURDATE(),INTERVAL " + sanitize.escape(req.params.nb) + " MONTH) AND CURDATE())";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
});

app.get('/getDelaiLivraison/:id', function (req, res, next) {

  var sql = "SELECT " + 
  "ROUND(AVG(ROUND(DATEDIFF(s.entry_date, p.purchase_date) / 30))) AS dl " +
  "FROM purchase p " +
  "JOIN stock s ON p.uuid=s.purchase_order_uuid " +
  "JOIN purchase_item z ON p.uuid=z.purchase_uuid " +
  "JOIN inventory i ON s.inventory_uuid=i.uuid " +
  "WHERE z.inventory_uuid=s.inventory_uuid AND s.inventory_uuid=" + sanitize.escape(req.params.id);

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
  var sql = "SELECT s.tracking_number, s.lot_number, FLOOR(DATEDIFF(s.expiration_date, CURDATE()) / 30) AS months_before_expiration"
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

app.get('/getEmployeePayment/:id', function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, p.uuid, p.currency_id, t.label, t.abbr, z.tax_id, z.value, z.posted"
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

// temporary error handling for development!
process.on('uncaughtException', function (err) {
  console.log('[uncaughtException]', err);
  process.exit();
});

// temporary debugging to see why the process terminates.
process.on('exit', function () {
  console.log('Process shutting down...');
});
