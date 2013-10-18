// server.js
var express         = require('express')
  , db              = require('./lib/database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler    = require('./lib/database/myQueryHandler')
  , url             = require('url')
  , auth            = require('./lib/auth')
  , um              = require('./lib/util/userManager')
  , WebSocketServer = require('ws').Server
  , ws              = new WebSocketServer({port: 8000})
  , data            = require('./lib/data.js') // has data.Store
  , app             = express();

app.set('env', 'production'); // Change this to change application behavior

//FIXME: Removed auth from middleware - should be put back
app.configure('production', function () {
  app.use(express.bodyParser()); // FIXME: Can we do better than body parser?  There seems to be /tmp file overflow risk.
  app.use(express.cookieParser());
  app.use(express.static('app'));
  app.use(app.router);
});

// helper functions
function serialize(json) { return JSON.stringify(json); }
function deserialize(json) { return JSON.parse(json); }

// Web Sockets Area
// FIXME/TODO: Put this in a module somewhere hidden
var store = new data.Store(); // idProperty: 'id'
var namespaces = {};          // {'table': [{},{},..]} maps to socket ids
var incrimentor = 0;          // ids for sockets

// define routes
var router = {
  'PUT'    : put,
  'REMOVE' : remove,
  'INIT'   : init
};

// initialize namespaces and connection
function init (msg, socket) {
  var socketid = incrimentor++; // generate a "unique" id for a socket
  var space = {
    id      : socketid,
    table   : msg.table,
    columns : msg.columns,
    socket  : socket
  };
 
  // store the socket
  store.put(space);
  
  // register it's namespace and push the socket there
  if (namespaces[msg.table]) namespaces[msg.table].push(socketid);
  else namespaces[msg.table] = [socketid];

  // compose an sql query here
  var query = "SELECT %columns% FROM %table%";
  query = query.replace('%columns%', msg.columns.join()).replace('%table%', msg.table);
  console.log("Received query:", query);

  db.execute(query, function(err, res) {
    if (err) { throw err ;}
    // assign the socket id, and send inital dataset
    else { send({socketid: socketid, method: 'INIT', data: res}, socket); }
  });
}


function send (msg, socket) {
  // summary
  //    Serializes and sends the data to the client
  socket.send(serialize(msg));
}


function put (msg, socket) {
  var table = store.get(msg.socketid).table;
  console.log("Stored Socket Table:", table);
 
  console.log("Namespaces with this table:", namespaces[table]);
  console.log("PUT Data:", msg.data);

  var query = ""; // DISCUSS: What about distinguishing between UPDATE and INSERT?
                  // The socket store can change the methods base on whether or not 
                  // it found that data when store.put() fires, but is this necessary?
                  // Is there not a general method?  Is that bad programming?

}

function remove (msg, socket) {
  console.log("stored socket:", store.get(msg.socketid));
}


// Set up web sockets connection
ws.on('connection', function(socket) {
  // onconnection
  //    On every new socket connection, we must make
  // sure to register the socket's database representation
  // in some form of namespace to be able to push to 
  // it if the underlying data changes.

  // onmessage
  //    The bulk of the work is done here. All the socket
  // routing must be configured and properly done.
  socket.on('message', function(msg) {
    // deserialize the message for general consumption
    msg = deserialize(msg);

    console.log('Received a new socket! The method is :', msg.method);
    // route the message appropriately.
    router[msg.method](msg, socket);
  });

  socket.on('close', function() {
    console.log('Socket:', socket.sessionid, 'is closing!');
  });

  socket.on('error', function(err) {
    console.log('err:', err);
  });
});

// HTTP Server

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
