// server.js
var express         = require('express')
  , db              = require('./lib/database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler    = require('./lib/database/myQueryHandler')
  , url             = require('url')
  , auth            = require('./lib/auth')
  , um              = require('./lib/util/userManager')
  , jr              = require('./lib/logic/journal')
  , ws              = require("./lib/ws/ws") // This is the socket server
  , app             = express();

app.set('env', 'production'); // Change this to change application behavior

app.configure('production', function () {
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.session({secret: 'open blowfish', cookie: {httpOnly: false}}));
  app.use(auth);
  app.use(express.static('app'));
  app.use(app.router);
});

// TODO: Deprecate this code and use sockets
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
    console.log('JSON:'+Qo+' sql :'+sql);
  db.execute(sql, cb);
  } else {
    var sql = db.delete(Qo.table, Qo.ids); //en attendant une meilleure solution
    var cbDEL = function (err, ans) {
      if (err) throw err;
      res.send("succes!");
    };
    db.execute(sql, cbDEL);
  }
});

//dojo store forces an ID to be passed with a PUT request, the server must match this pattern, even if the db.js API doesn't require it
app.put('/data/', function(req, res) { 
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
    console.log("Post success", ans);
    res.send({status: 200, insertId: ans.insertId});
  };  
  
  console.log("Request for", req.body.t, req.body.data);

  var insertsql = db.insert(req.body.t, req.body.data);
  console.log(insertsql);
  db.execute(insertsql, cb);
});

app.get('/tree', function(req, res, next) {
  um.manageUser(req, res, next);
});

app.post('/journal', function(req, res) {
  jr.poster(req, res); 
});

app.post('/gl', function(req, res) {
  console.log('ok', req.body);
 
});

app.get('/journal', function(req,res){
  var cb = function (err, ans) {
    if (err) throw err;
    for(var i = 0; i<ans.length; i++){
      console.log('journal record :', ans[i]);
    }
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
  console.log('JSON:'+Qo+' sql :'+sql);
  db.execute(sql, cb);  
});



app.listen(8080, console.log('Environment:', app.get('env'), "/angularproto:8080"));
