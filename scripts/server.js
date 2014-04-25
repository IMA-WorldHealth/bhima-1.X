// scripts/server.js

// import node dependencies
var express      = require('express'),
    domain       = require('domain'),
    url          = require('url');

// import configuration
var cfg = require('./config.json');

// import app dependencies
var parser       = require('./lib/database/parser')(),
    dblogger     = require('./lib/database/logger')(cfg.log),
    db           = require('./lib/database/db')(cfg.db, dblogger),
    sanitize     = require('./lib/util/sanitize'),
    util         = require('./lib/util/util'),
    tree         = require('./lib/tree')(db),
    app          = express();

// import middleware
var authorize    = require('./lib/auth/authorization')(db, cfg.auth.paths),
    authenticate = require('./lib/auth/authentication')(db),
    projects     = require('./lib/auth/projects')(db),
    errorHandler = require('./lib/error/handler');

// import routes
var report       = require('./lib/logic/report')(db),
    trialbalance = require('./lib/logic/trialbalance')(db),
    ledger       = require('./lib/logic/ledger')(db),
    fiscal       = require('./lib/logic/fiscal')(db),
    synthetic    = require('./lib/logic/synthetic')(db, sanitize),
    journal      = require('./lib/logic/journal')(db, synthetic),
    createSale   = require('./lib/logic/createSale')(db, parser, journal),
    createPurchase = require('./lib/logic/createPurchase')(db, parser, journal);

var uuid         = require('./lib/util/guid');

app.configure(function () {
  app.use(express.compress());
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.session(cfg.session));
  app.use('/css', express.static('app/css', {maxAge:10000}));
  app.use('/lib', express.static('app/lib', {maxAge:10000}));
  app.use('/i18n', express.static('app/i18n', {maxAge:100000}));
  app.use(authenticate);
  app.use(authorize);
  app.use(projects);
  app.use(express.static(cfg.static, {maxAge : 10000}));
  app.use(app.router);
  app.use(errorHandler);
});

app.get('/', function (req, res, next) {
  // This is to preserve the /#/ path in the url
  res.sendfile('/index.html');
});

app.get('/data/', function (req, res, next) {
  var decode = JSON.parse(decodeURI(url.parse(req.url).query));
  var sql = parser.select(decode);
  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.put('/data/', function (req, res, next) {
  // TODO: change the client to stop packaging data in an array...
  var updatesql = parser.update(req.body.table, req.body.data[0], req.body.pk[0]);

  db.exec(updatesql)
  .then(function (ans) {
    res.send(200, {insertId: ans.insertId});
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.post('/data/', function (req, res, next) {
  // TODO: change the client to stop packaging data in an array...
  var insertsql = parser.insert(req.body.table, req.body.data);

  db.exec(insertsql)
  .then(function (ans) {
    res.send(200, {insertId: ans.insertId});
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.delete('/data/:table/:column/:value', function (req, res, next) {
  var sql = parser.delete(req.params.table, req.params.column, req.params.value);
  db.exec(sql)
  .then(function (ans) {
    res.send(200);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.post('/purchase', function(req, res, next) {
  // TODO duplicated methods

  console.log('createPurchase', createPurchase);
  createPurchase.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) return next(err);
    res.send(200, {purchaseId: ans});
  });
});

app.post('/sale/', function (req, res, next) {
  createSale.execute(req.body, req.session.user_id, function (err, ans) {
    if (err) return next(err);
    res.send(200, {saleId: ans});
  });
});

app.get('/currentProject', function (req, res, next) {
  // TODO sorry
  var sql =
    "SELECT `project`.`id`, `project`.`name`, `project`.`abbr`, `project`.`enterprise_id`, `enterprise`.`currency_id`, `enterprise`.`location_id`, `enterprise`.`name` as 'enterprise_name', `enterprise`.`phone`, `enterprise`.`email`, `village`.`name` as 'village', `sector`.`name` as 'sector' " +
    "FROM `project` JOIN `enterprise` ON `project`.`enterprise_id`=`enterprise`.`id` JOIN `village` ON `enterprise`.`location_id`=`village`.`uuid` JOIN `sector` ON `village`.`sector_uuid`=`sector`.`uuid` " +
    "WHERE `project`.`id`=" + req.session.project_id + ";";
  db.execute(sql, function (err, result) {
    if (err) { return next(err); }
    res.send(result[0]);
  });
});

// FIXME: this is terribly insecure.  Please remove
app.get('/user_session', function (req, res, next) {
  res.send(200, {id: req.session.user_id});
});

app.get('/pcash_transfert_summers', function (req, res, next) {
  var sql =
    "SELECT `primary_cash`.`reference`, `primary_cash`.`date`, `primary_cash`.`cost`, `primary_cash`.`currency_id` "+
    "FROM `primary_cash` WHERE `primary_cash`.`origin_id`= (SELECT DISTINCT `primary_cash_module`.`id` FROM `primary_cash_module` "+
    "WHERE `primary_cash_module`.`text`='transfert') ORDER BY date, reference DESC LIMIT 20;"; //FIX ME : this request doesn't sort
  db.execute(sql, function (err, result) {
    if (err) { return next(err); }
    var d = []; //for now
    res.send(d);
  });
});

app.get('/trialbalance/initialize', function (req, res, next) {
  trialbalance.run(req.session.user_id, function (err, result) {
    if (err) { return next(err); }
    res.send(200, result);
  });
});

app.get('/trialbalance/submit/:key/', function (req, res, next) {
  trialbalance.postToGeneralLedger(req.session.user_id, req.params.key)
  .then(function (result) {
    res.send(200);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

app.get('/editsession/authenticate/:pin', function (req, res, next) {
  var decrypt = req.params.pin >> 5;
  var sql = "SELECT pin FROM user WHERE user.id = " + req.session.user_id +
    " AND pin = '" + decrypt + "';";
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
  journal.request(req.params.table, req.params.id, req.session.user_id, function (err, success) {
    if (err) return next(err);
    res.send(200);
  });
});

//FIXME receive any number of tables using regex
app.get('/max/:id/:table/:join?', function(req, res, next) {
  var id = req.params.id, table = req.params.table, join = req.params.join;

  var max_request = "SELECT MAX(" + id + ") FROM ";

  max_request += "(SELECT MAX(" + id + ") AS `" + id + "` FROM " + table;
  if(join) {
    max_request += " UNION ALL SELECT MAX(" + id + ") AS `" + id + "` FROM " + join + ")a;";
  } else {
    max_request += ")a;";
  }

  db.execute(max_request, function(err, ans) {
    if (err) {
      res.send(500, {info: "SQL", detail: err});
      console.error(err);
      return;
    }
    res.send({max: ans[0]['MAX(' + id + ')']});
  });
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

app.get('/fiscal/:enterprise/:startDate/:endDate/:description', function(req, res, next) {
  var enterprise = req.params.enterprise;
  var startDate = req.params.startDate;
  var endDate = req.params.endDate;
  var description = req.params.description;

  //console.time("FISCAL_KEY");
  //function(err, status);
  fiscal.create(enterprise, startDate, endDate, description, function(err, status) {
    if(err) return res.send(500, err);
    //console.timeEnd("FISCAL_KEY");
    res.send(200, status);
  });
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
  // var sql = "SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = '"+req.params.id_enterprise+"'"+
  // " AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'";
  var sql = "SELECT account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = '"+req.params.id_enterprise+"'";
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(process(rows));
  });

  function process(accounts){
    var InExAccounts = accounts.filter(function(item){
      return item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0;
    });
    return InExAccounts;
  }

});

app.get('/availablechargeAccounts/:id_enterprise/', function(req, res, next) {
  var sql = "SELECT account.id, account.account_number, account.account_txt FROM account WHERE account.enterprise_id = '"+req.params.id_enterprise+"' AND account.parent <> 0 AND account.cc_id = '-1'";

  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(process(rows));
  });

  function process(accounts){
    var availablechargeAccounts = accounts.filter(function(item){
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

});

app.get('/costCenterAccount/:id_enterprise/:cost_center_id', function(req, res, next) {
  // var sql = "SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = '"+req.params.id_enterprise+"'"+
  // " AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'";
  var sql = "SELECT account.id, account.account_number, account.account_txt FROM account, cost_center WHERE account.cc_id = cost_center.id "+
            "AND account.enterprise_id = '"+req.params.id_enterprise+"' AND account.parent <> 0 AND account.cc_id='"+req.params.cost_center_id+"'";

  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(process(rows));
  });

  var process = function(accounts){
    var availablechargeAccounts = accounts.filter(function(item){
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  };
});

app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', function(req, res, next) {
  // var sql = "SELECT TRUNCATE(account.account_number * 0.1, 0) AS dedrick, account.id, account.account_number, account.account_txt, parent FROM account WHERE account.enterprise_id = '"+req.params.id_enterprise+"'"+
  // " AND TRUNCATE(account.account_number * 0.1, 0)='6' OR TRUNCATE(account.account_number * 0.1, 0)='7'";
  var sql = "SELECT account.id, account.account_number, account.account_txt FROM account, auxiliairy_center WHERE account.auxiliairy_center_id = auxiliairy_center.id "+
            "AND account.enterprise_id = '"+req.params.id_enterprise+"' AND account.parent <> 0 AND account.auxiliairy_center_id='"+req.params.auxiliairy_center_id+"'";

  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(process(rows));
  });

  function process(accounts){
    var availablechargeAccounts = accounts.filter(function(item){
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }
});

app.get('/tree', function (req, res, next) {
  tree.load(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  })
  .catch(function (err) {
    res.send(301, err);
  })
  .done();
});

app.get('/location/:villageId?', function (req, res, next) {
  var specifyVillage = req.params.villageId ? ' AND `village`.`uuid`=\"' + req.params.villageId + '\"' : '';

  var sql =
    'SELECT `village`.`uuid` as `uuid`,  `village`.`name` as `village`, ' +
      '`sector`.`name` as `sector`, `province`.`name` as `province`, ' +
      '`country`.`country_en` as `country` ' +
    'FROM `village`, `sector`, `province`, `country` ' +
    'WHERE village.sector_uuid = sector.uuid AND ' +
      'sector.province_uuid = province.uuid AND ' +
      'province.country_uuid=country.uuid ' + specifyVillage + ';';

  db.execute(sql, function (err, rows) {
    if (err) { return next(err); }
    res.send(rows);
  });
});

// New API for locations
/*
app.get('/location/:type/:id?', function (req, res, next) {

});
*/

app.get('/village/', function (req, res, next) {

  var sql =
    'SELECT `village`.`uuid` AS `uuid`,  `village`.`name` AS `village`, ' +
    '`sector`.`uuid` AS `sector_uuid`, `sector`.`name` as `sector` ' +
    'FROM `village`, `sector` ' +
    'WHERE village.`sector_uuid` = sector.uuid';

  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(rows);
  });
});

app.get('/sector/', function (req, res, next) {

  var sql = "SELECT `sector`.`uuid` as `uuid`,  `sector`.`name` as `sector`, `province`.`uuid` "+
            "as `province_uuid`, `province`.`name` as `province` FROM `sector`, `province` "+
            "WHERE `sector`.`province_uuid` = `province`.`uuid`";
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(rows);
  });
});

app.get('/province/', function (req, res, next) {
  var sql =
    "SELECT `province`.`uuid` as `uuid`,  `province`.`name` as `province`, `country`.`uuid` "+
    "AS `country_uuid`, `country`.`country_en` as `country_en`, `country`.`country_fr` as `country_fr` FROM `province`, `country` "+
    "WHERE `province`.`country_uuid` = `country`.`uuid`";
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(rows);
  });
});

// FIXME : make this code more modular
app.get('/visit/:patient_id', function (req, res, next) {
  var patient_id = req.params.patient_id;
  var sql =
    "INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES " +
    "(\"" + uuid() + "\"," + [patient_id, req.session.user_id].join(', ') + ");";
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send();
  });
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
  // FIXME: put this in a module!
  var enterprise_id = req.params.id;

  var sql = 'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, account_type.`type`, temp.`parent`, temp.`fixed`, temp.`balance` FROM ' +
    '(' +
      'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, account.fixed, period_total.credit - period_total.debit as balance ' +
      'FROM account LEFT JOIN period_total ' +
      'ON account.id=period_total.account_id ' +
      'WHERE account.enterprise_id=' + sanitize.escape(enterprise_id) +
    ') ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id=account_type.id ORDER BY temp.account_number;';

  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(rows);
  });
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
    "SELECT id, fiscal_year_id FROM period " +
    "WHERE period_start <= " + date + " AND period_stop >= " + date + " LIMIT 1";

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
  res.send('Under Contruction');
});

app.listen(cfg.port, console.log("Application running on localhost:" + cfg.port));

// temporary error handling for development!
process.on('uncaughtException', function (err) {
  console.log('uncaughtException:', err);
  process.exit();
});

// temporary debugging to see why the process terminates.
process.on('exit', function () { console.log('Process Shutting Down...'); });
