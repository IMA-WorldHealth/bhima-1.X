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
  , balance      = require('./lib/logic/balance')(db) // TODO
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

app.delete('/data/:id/:table', function(req, res){
  var deleteSql = db.delete(req.params.table, {id:[req.params.id]});
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

app.get('/trialbalance/', function (req, res, next) {
  // temp API
  balance(function (err, result) {
    if (err) throw err;
    else res.send(result); 
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

app.get('/fiscal/:enterprise', function(req, res) {
  /*
  * summary:
  *   calculate the 'previous' fiscal given an enterprise, return null if no fiscal year exists
  * TODO replace literal SQL commands with db interface - does not support multiple databases */
  var enterprise = req.params.enterprise;

  var head_request = "SELECT `id` FROM `fiscal_year` WHERE `previous_fiscal_year` IS NULL";
  var iterate_request = "SELECT `id`, `previous_fiscal_year` FROM `fiscal_year` WHERE `previous_fiscal_year`=";

  var iterations = 0;
  var time_stamp = Date.now();

  //find head of list (if it exists)
  db.execute(head_request, function(err, ans) {
    if(ans.length > 1) {
      return;
    }
    if(ans.length < 1) {
      //no fiscal years - create the first one
      res.send({previous_fiscal_year: null});
      return;
    }
    iterateList(ans[0].id);
  });

  function iterateList(id) {
    iterations++;
    db.execute(iterate_request + id, function(err, ans) {
      if(err) return;
      if(ans.length===0) {
        return respond(id);
      }
      return iterateList(ans[0].id);
    });
  }

  function respond(previous_id) {
    res.send({previous_fiscal_year: previous_id});
  }

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

app.post('/temp/:table/', function (req, res, next) {
  var tmp = {};
  var sql = parser.post(tmp);
});

app.put('/temp/:table/:id', function (req, res, next) {
  // TODO:
});

app.delete('/temp/:table/:id', function (req, res, next) {
  // TODO:
});

app.get('/ledgers/debitor/:id', function (req, res, next) {
  ledger.debitor(req.params.id, res);
});

app.get('/fiscal/', function(req, res) { 
  fiscal.create(1, 2, 3, 4);
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
