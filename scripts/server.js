// server.js
var express = require('express')
  , db = require('./lib/database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler = require('./lib/database/myQueryHandler')
  , url = require('url')
  , qs = require('querystring')
  , path = require('path')
  , auth = require('./lib/auth')
  , error = require('./lib/error/404.js')
  , um = require('./lib/util/userManager')
  , app = express();

app.set('env', 'production'); // Change this to change application behavior

//FIXME: Removed auth from middleware - should be put back
app.configure('production', function () {
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.static('app'));
  app.use(app.router);
  app.use(error);
});

// work in progress for logger
// FIXME: will move this to middleware
// to be more unobtrusive
/*
app.all('/data/', function(req, res, next) {
  
  function decode(req) {
    var query = decodeURIComponent(url.parse(req.url).query);
    return JSON.parse(query);
  }

  function decodeGet(req) {
    var query = decode(req); 
    var sql = db.select(query);
  }

  function decodePost(req) {
    var query = decode(req);
    var body = req.body;
    var sql = db.insert(query);
  }

  function decodePut(req) {
    var query = decode(req);
    var body = req.body;
    var sql = db.update(query);
  }

  function decodeDelete(req) {
    var query = decode(req);
    var sql = db.delete(query);
  }

  var methodmap = {
    'GET' : decodeGet,
    'PUT' : decodePut,
    'DELETE' : decodeDelete,
    'INSERT' : decodeSelect
  };
  // methodmap[req.method](req);
  console.log(req.method);
  console.log(req.url);
  next();
});
*/

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
    var sql = db.delete(Qo.table, Qo.ids); //en attendant une meilleure solution
    console.log(sql);
    var cbDEL = function (err, ans) {
      if (err) throw err;
      res.send("succes!");
    };
    db.execute(sql, cbDEL);
  }
});

//dojo store forces an ID to be passed with a PUT request, the server must match this pattern, even if the db.js API doesn't require it
app.put('/data/:id', function(req, res) { 
  var updatesql = db.update(req.body.t, req.body.data, req.body.pk);
  db.execute(updatesql, function(err, ans) { 
    if(err) throw err;
    res.status(200);
  });
});

// for inserts only
app.post('/data/', function (req, res) {
  
  var cb = function (err, ans) {
    if (err) throw err;
    res.send("succes!;");
  };

  var insertsql = db.insert(req.body.t, req.body.data);
  db.execute(insertsql, cb);
});

app.get('/tree', function(req, res, next) {
  um.manageUser(req, res, next);
});

app.listen(8080, console.log('Environment:', app.get('env'), "/angularproto:8080"));
