// scripts/server.js

// import node dependencies
var express      = require('express'),
    fs           = require('fs'),
    domain       = require('domain'),
    url          = require('url');

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
app.get('/user_session', function(req, res, next) {
  res.send(200, {id: req.session.user_id});
});

app.post('/journal', function(req, res) {
  journal.poster(req, res); 
});

app.get('/trial/', function (req, res, next) {
  trialbalance.trial()
  .then(function (result) {
    res.send(200, result);  // processed the request successfully, and sending NO CONTENT
  }, function (reason) {
    res.send(304, reason);  // processed the requuest, but NOT MODIFIED
  });
});

app.get('/post/', function (req, res, next) {
  trialbalance.post()
  .then(function (results) {
    res.send(204);  // processed the request successfully, and sending NO CONTENT
  }, function (reason) {
    res.send(304, reason); // processed the requuest, but NOT MODIFIED
  });
});

app.get('/journal', function (req,res) {
  var cb = function (err, ans) {
    if (err) next(err);
    res.json(ans);
  };
  var myRequest = decodeURIComponent(url.parse(req.url).query);
  var jsRequest;  
  try {
    jsRequest = JSON.parse(myRequest);
  } catch (e) {
    throw e;
  }  
  var Qo = queryHandler.getQueryObj(jsRequest);
  var sql = db.select(Qo);
  db.execute(sql, cb);  
});

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
  ledger.debitor(req.params.id, res);
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

app.get('/reports/:route/', function(req, res) { 
  var route = req.params.route;

  //parse the URL for data following the '?' character
  var query = decodeURIComponent(url.parse(req.url).query);
  
  console.log('query', query);

  //TODO update to err, ans standard of callback methods
  report.generate(route, query, function(report) { 
    if (report) return res.send(report);
    res.send(500, 'Server could not produce report');
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

// ugh.
app.get('/location', function (req, res, next) {
  var sql = "SELECT `location`.`id`,  `village`.`name` as `village`, `sector`.`name` as `sector`, `province`.`name` as `province`, `country`.`country_en` as `country` " +
            "FROM `location`, `village`, `sector`, `province`, `country` " + 
            "WHERE `location`.`village_id`=`village`.`id` AND `location`.`sector_id`=`sector`.`id` AND `location`.`province_id`=`province`.`id` AND `location`.`country_id`=`country`.`id`;";
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

process.on('exit', function () { console.log('Process Shutting Down...'); });
