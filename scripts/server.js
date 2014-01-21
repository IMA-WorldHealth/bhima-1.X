// scripts/server.js

// import node dependencies
var express      = require('express'),
    fs           = require('fs'),
    domain       = require('domain'),
    url          = require('url'),
    querystring  = require('querystring');

// import configuration
var cfg = JSON.parse(fs.readFileSync("scripts/config.json"));

// import app dependencies
var queryHandler = require('./lib/database/myQueryHandler'),
    parser       = require('./lib/database/parser')(),
    db           = require('./lib/database/db')(cfg.db),
    tree         = require('./lib/tree')(db),
    app          = express();

// import middleware
var authorize    = require('./lib/auth/authorization')(db, cfg.auth.paths),
    authenticate = require('./lib/auth/authentication')(db),
    errorHandler = require('./lib/error/handler');

// import routes
var report       = require('./lib/logic/report')(db),
    trialbalance = require('./lib/logic/balance')(db),
    journal      = require('./lib/logic/journal')(db),
    ledger       = require('./lib/logic/ledger')(db),
    fiscal       = require('./lib/logic/fiscal')(db);

app.configure(function () {
  app.use(express.compress());
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.session(cfg.session));
  app.use(authenticate);
  app.use(authorize);
  app.use(express.static(cfg.static, {maxAge : 1000}));
  app.use(app.router);
  app.use(errorHandler);
});

app.get('/', function (req, res, next) {
  // This is to preserve the /#/ path in the url
  res.sendfile('/index.html');
});

app.get('/data/', function (req, res, next) {  
  var dec = JSON.parse(decodeURI(url.parse(req.url).query));
  var sql = parser.select(dec);
  db.execute(sql, function (err, rows) {
    if (err) next(err);
    res.send(rows); 
  });
});

app.put('/data/', function (req, res, next) {
  // TODO: change the client to stop packaging data in an array...
  var updatesql = parser.update(req.body.t, req.body.data[0], req.body.pk[0]);  
  db.execute(updatesql, function(err, ans) { 
    if (err) next(err);
    res.send(200, {insertId: ans.insertId});
  });
});

app.post('/data/', function (req, res, next) {
  // TODO: change the client to stop packaging data in an array...
  var insertsql = parser.insert(req.body.t, req.body.data[0]);  
  db.execute(insertsql, function (err, ans) {
    if (err) next(err);
    res.send(200, {insertId: ans.insertId});
  });
});

app.delete('/data/:table/:column/:value', function (req, res, next) {
  var sql = parser.delete(req.params.table, req.params.column, req.params.value);
  db.execute(sql, function (err, ans) {
    if (err) next(err);
    res.send(200);
  });
});

// TODO Server should set user details like this in a non-editable cookie
app.get('/user_session', function (req, res, next) {
  res.send(200, {id: req.session.user_id});
});


app.get('/trial/', function (req, res, next) {
  var qs = querystring.parse(url.parse(req.url).query).q;
  var ids = qs.replace('(', '').replace(')', '').split(',');

  console.log('looking at ids ', ids);

  trialbalance.run(ids, req.session.user_id, function (err, result) {
    if (err) return next(err);
    res.send(200, result);
  });
});

app.get('/post/:key', function (req, res, next) {
  var qs = querystring.parse(url.parse(req.url).query).q;
  var ids = qs.replace('(', '').replace(')', '').split(',');

  trialbalance.postToGeneralLedger(ids, req.session.user_id, req.params.key, function (err, result) {
    if (err) return next(err);
    res.send(200);
  });

  /*
  trialbalance.post()
  .then(function (results) {
    res.send(204);  // processed the request successfully, and sending NO CONTENT
  }, function (reason) {
    res.send(304, reason); // processed the requuest, but NOT MODIFIED
  });
  */
});

app.get('/journal/:table/:id', function (req, res, next) {
  // What are the params here?
  journal.request(req.params.table, req.params.id, req.session.user_id, function (err, success) {
    if (err) return next(err);
    res.send(200);
  });
});

/*
app.post('/journal', function (req, res, next) {
  // What are the params here?
  journal.poster(req, res, next); 
});
*/

app.get('/max/:id/:table', function(req, res) { 
  var id = req.params.id;
  var table = req.params.table;

  var max_request = "SELECT MAX(" + id + ") FROM " + table;

  db.execute(max_request, function(err, ans) { 
    if (err) {
      res.send(500, {info: "SQL", detail: err});
      console.error(err);
      return;
    }
    //dodgy as ass
    res.send({max: ans[0]['MAX(' + id + ')']});
  });
});

app.get('/ledgers/debitor/:id', function (req, res, next) {
  ledger.debitor(req.params.id, function (err, rows) {
    if (err) next(err);
    res.send(rows);
  });
});

app.get('/fiscal/:enterprise/:startDate/:endDate/:description', function(req, res) { 
  var enterprise = req.params.enterprise;
  var startDate = req.params.startDate;
  var endDate = req.params.endDate;
  var description = req.params.description;

  console.time("FISCAL_KEY");
  //function(err, status);
  fiscal.create(enterprise, startDate, endDate, description, function(err, status) { 
    console.log('create returned', err, status);
    if(err) return res.send(500, err);
    console.timeEnd("FISCAL_KEY");
    res.send(200, status);
  });
});

app.get('/reports/:route/', function(req, res, next) { 
  var route = req.params.route;

  //parse the URL for data following the '?' character
  var query = decodeURIComponent(url.parse(req.url).query);
  
  report.generate(route, query, function(report, err) { 
    if(err) next(err);
    res.send(report);
  });
});

app.get('/tree', function (req, res, next) {
  tree.load(req.session.user_id)
  .then(function (treeData) {
    res.send(treeData);
  }, function (err) {
    res.send(301, err);
  });
});


app.get('/price_list/:id', function (req, res, next) {
  var sql = 
    'SELECT COUNT(`price_list`.`id`) AS `plcount`, `price_list`.`id`, `price_list`.`name`, ' + 
    'COUNT(`price_list_detail`.`list_id`) AS `count` ' + 
    'FROM `price_list` LEFT JOIN `price_list_detail` ON  ' + 
      '`price_list`.`id`=`price_list_detail`.`list_id` ' +
    'WHERE `price_list`.`enterprise_id`=' + db.escapestr(req.params.id) + ';';
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    if (rows.length === 1 && rows[0].plcount === 0) return res.send([]);
    res.send(rows);
  });
});

// ugh.
app.get('/location/:locationId?', function (req, res, next) {
  var specifyLocation = req.params.locationId ? ' AND `location`.`id`=' + req.params.locationId : '';
  var sql = "SELECT `location`.`id`,  `village`.`name` as `village`, `sector`.`name` as `sector`, `province`.`name` as `province`, `country`.`country_en` as `country` " +
            "FROM `location`, `village`, `sector`, `province`, `country` " + 
            "WHERE `location`.`village_id`=`village`.`id` AND `location`.`sector_id`=`sector`.`id` AND `location`.`province_id`=`province`.`id` AND `location`.`country_id`=`country`.`id`" + specifyLocation + ";";
  db.execute(sql, function (err, rows) {
    if (err) return next(err);
    res.send(rows);
  });
});

app.get('/debitorAgingPeriod', function (req, res, next){
  var sql =  "SELECT DISTINCT period.id, period.period_start, period.period_stop FROM period, general_ledger WHERE period.id = general_ledger.`period_id`;";
  db.execute(sql, function (err, rows) {
    if (err) next(err);
    res.send(rows);
  });
});

app.get('/account_balance/:id', function (req, res, next) {
  // FIXME: put this in a module!
  var enterprise_id = req.params.id;

  var sql = 'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, account_type.`type`, temp.`parent`, temp.`fixed`, temp.`balance` FROM ' +
            '(' +
              'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, account.fixed, period_total.credit - period_total.debit as balance ' +
              'FROM account LEFT JOIN period_total ' +
              'ON account.id=period_total.account_id ' +
              'WHERE account.enterprise_id=' + db.escapestr(enterprise_id) +
            ') ' +
            'AS temp JOIN account_type ' +
            'ON temp.account_type_id=account_type.id ORDER BY temp.account_number;';

  db.execute(sql, function (err, rows) {
    if (err) next(err);
    res.send(rows);
  });

});

app.listen(cfg.port, console.log("Application running on /angularproto:" + cfg.port));

// temporary error handling for development!
process.on('uncaughtException', function (err) {
  console.log('uncaughtException:', err);
});

// temporary debugging to see why the process terminates.
process.on('exit', function () { console.log('Process Shutting Down...'); });
