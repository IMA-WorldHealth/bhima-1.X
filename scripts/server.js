// server.js
var express      = require('express')
  , fs           = require('fs')
  , queryHandler = require('./lib/database/myQueryHandler')
  , url          = require('url')
  , cfg          = JSON.parse(fs.readFileSync("scripts/config.json"))
  , db           = require('./lib/database/db')(cfg.db)
  , parser       = require('./lib/database/parser')(db)
  , auth         = require('./lib/auth')(db)
//  , balance      = require('./lib/logic/balance')(db)
  , um           = require('./lib/util/userManager')
  , jr           = require('./lib/logic/journal')
  , app          = express();

app.configure(function () {
  app.use(express.compress());
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.session(cfg.session));
  app.use(auth);
  app.use(express.static(cfg.static));
  app.use(app.router);
});

app.get('/data/', function (req, res) {
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

app.get('/tree', function(req, res, next) {
  um.manageUser(req, res, next);
});

app.post('/journal', function(req, res) {
  console.log(req.body);
  jr.poster(req, res); 
});

app.post('/gl', function(req, res) {
  console.log('le tableau recu est ', req.body);
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

// repeat paths but for new connect.req() method

app.get('/temp/', function (req, res, next) {
  var dec = JSON.parse(decodeURI(url.parse(req.url).query));
  var sql = parser.select(dec);
  console.log(['[sql] Executing : ', sql].join(''));
  db.execute(sql, function (err, rows) {
    if (err) next(err);
    res.send(rows); 
  });
});

app.post('/temp/:table/', function (req, res, next) {
  var tmp = {};
  var sql = parser.post(tmp);
  console.log(['[sql] Executing : ', sql]);
});

app.put('/temp/:table/:id', function (req, res, next) {
  // TODO:
});

app.delete('/temp/:table/:id', function (req, res, next) {
  // TODO:
});

app.listen(cfg.port, console.log("Application running on /angularproto:" + cfg.port));
