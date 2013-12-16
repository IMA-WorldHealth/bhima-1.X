// server.js
var express      = require('express')
  , fs           = require('fs')
  , queryHandler = require('./lib/database/myQueryHandler')
  , url          = require('url')
  , cfg          = JSON.parse(fs.readFileSync("scripts/config.json"))
  , db           = require('./lib/database/db')(cfg.db)
  , parser       = require('./lib/database/parser')(db)
  , authorize    = require('./lib/auth/authorization')(db, cfg.auth.paths)
  , authenticate = require('./lib/auth/authentication')(db)
  , tree         = require('./lib/tree')(db)
  , report       = require('./lib/logic/report')(db)
  , trialbalance = require('./lib/logic/balance')(db)
  , jr           = require('./lib/logic/journal')
  , ledger       = require('./lib/logic/ledger')(db)
  , fiscal       = require('./lib/logic/fiscal')(db)
  , app          = express();

app.configure(function () {
  app.use(express.compress());
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.session(cfg.session));
  // These are in correct order.  We want to authenticate
  // then authorize access.
  app.use(authenticate);
  app.use(authorize);
  app.use(express.static(cfg.static));
  app.use(app.router);
});

app.get('/', function (req, res, next) {
  // This is to preserve the /#/ path in the url
  res.sendfile('/index.html');
});

app.get('/data/', function (req, res) {
  var cb = function (err, ans) {
    if (err) throw err;
    res.json(ans);
  };
  var myRequest = decodeURIComponent(url.parse(req.url).query);
  var jsRequest;  

  //sfount FIXME - this will NOT always return a JSON object, if the object sent in the URL is not valid JSON (the catch case) it will be stringified and parsed - returning a string
  try{
    jsRequest = JSON.parse(myRequest);
  }catch(e){
    jsRequest = JSON.parse(JSON.stringify(myRequest));
  }  
  var Qo = queryHandler.getQueryObj(jsRequest);  
  if(!Qo.action){
    var sql = db.select(Qo);
  db.execute(sql, cb);
  } else {
    var sql = db.delete(Qo.table, Qo.ids); // en attendant une meilleure solution
    var cbDEL = function (err, ans) {
      if (err) throw err;
      res.send("succes!");
    };
    db.execute(sql, cbDEL);
  }
});

app.put('/data/', function(req, res) {
  var updatesql = db.update(req.body.t, req.body.data, req.body.pk);
  db.execute(updatesql, function(err, ans) { 
    if(err) throw err;
    res.send({status: 200, insertId: ans.insertId});
  });
});

// for inserts only
app.post('/data/', function (req, res) {
  
  var cb = function (err, ans) {
    if (err) throw err;
    res.send({status: 200, insertId: ans.insertId});
  };

  var insertsql = db.insert(req.body.t, req.body.data);
//  temporarily remove debug
//  console.log('[DEBUG SQL]', insertsql);

  db.execute(insertsql, cb);
});

app.delete('/data/:val/:col/:table', function (req, res) {
  // format the query of the form "WHERE col = val;"
  var reqObj = {};
  reqObj[req.params.col] = [req.params.val];
  // execute
  var deleteSql = db.delete(req.params.table, reqObj);
  var cbDEL = function (err, ans) {
      if (err) throw err;
      res.status(200);
      res.send();
  };
  db.execute(deleteSql, cbDEL);
});

//TODO Server should set user details like this in a non-editable cookie
app.get('/user_session', function(req, res, next) {
  res.send({id: req.session.user_id});
});

app.get('/tree', function (req, res, next) {
  // format and process request
  var reqObj, query, userid = req.session.user_id;
  reqObj = JSON.parse(decodeURIComponent(url.parse(req.url).query));
  query = queryHandler.getQueryObj(reqObj);

  // load tree
  tree.loadTree(userid, query, function (err, result) {
    if (err) next(err);
    res.json(result); 
  });
});

app.post('/journal', function(req, res) {
  console.log("recieved post");
  jr.poster(req, res); 
});

app.get('/trial/', function (req, res, next) {
  trialbalance.trial()
  .then(function (result) {
    res.send(result);  // processed the request successfully, and sending NO CONTENT
  }, function (reason) {
    console.log("Reason:", reason);
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

app.get('/journal', function(req,res){
  var cb = function (err, ans) {
    if (err) throw err;
    res.json(ans);
  };
  var myRequest = decodeURIComponent(url.parse(req.url).query);
  var jsRequest;  
  try{
    jsRequest = JSON.parse(myRequest);
  }catch(e){
    jsRequest = JSON.parse(JSON.stringify(myRequest));
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

// repeat paths but for new connect.req() method

app.get('/temp/', function (req, res, next) {
  var dec = JSON.parse(decodeURI(url.parse(req.url).query));
  var sql = parser.select(dec);
  db.execute(sql, function (err, rows) {
    if (err) next(err);
    res.send(rows); 
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
  })
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

app.listen(cfg.port, console.log("Application running on /angularproto:" + cfg.port));
