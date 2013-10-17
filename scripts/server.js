// server.js
var express         = require('express')
  , db              = require('./lib/database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}})
  , queryHandler    = require('./lib/database/myQueryHandler')
  , url             = require('url')
  , qs              = require('querystring')
  , path            = require('path')
  , auth            = require('./lib/auth')
  , error           = require('./lib/error/404.js')
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
  app.use(error);
});


function serialize(json) { return JSON.stringify(json); }
function deserialize(json) { return JSON.parse(json); }

// wserror
//    Fired upon unsuccessful completion of
// a websocket request. Fired with method 'error'
function wserror(err, socket) {
  console.log("Called wserror()");
  socket.send(serialize({
    method: 'error',
    error: err.stack
  }));
}

// wscreate
//    Fired upon reception of new data to put
// in the database.  Does not return to client.
// FIXME: Error Handling?  Do we do timestamps?
// No commit until succes is received?  Or try 
// to develop a system of rollbacks?
// FIXME: This throws an error if not all
// fields are specified "ER_NO_DEFAULT_FOR_FIELD"
// Does this necessitate database changes?
function wscreate(msg, socket) {
  var tabledescriptor = msg.tabledescriptor, table, 
      columns, base, data, columnstring, datalist;

  console.log('Called wscreate()');

  table = tabledescriptor.table;
  columns = tabledescriptor.columns;
  data = msg.data;
 
  base = 'INSERT INTO %table% (%columns%) VALUES %data%;';

  // make (col1, col2, ... )
  columnstring = columns.map(function(column) {
    return '`' + column + '`';
  }).join(', ');

  base = base.replace('%table%', table).replace('%columns%', columnstring);

  // make (value1, value2, ...)
  datalist = [];
  for (var d in data) {
    datalist.push(data[d]);
  }

  base = base.replace('%data%', '(' + datalist.join(', ') + ')');

  db.query(base, function(err, success) {
    if (err) {
      wserror(err, socket);
    } else {
      console.log('Inserted:', base, 'successfully.\n');
    }
  });
}

// wsupdate
//    Fired upon reception of new data to update
// the database.  Does not return to client.
function wsupdate(msg, socket) {
  console.log('Called wsupdate');
  var tabledescriptor = msg.tabledescriptor, table,
      columns, where, base, data, columnstring, datalist;
  table = tabledescriptor.table;
  columns = tabledescriptor.columns;
  where = msg.where;
  data = msg.data;

  base = "UPDATE %table% SET %conditions%;";

  datalist = []; 
  for (var d in data) {
    datalist.push('`' + table + '`.`' + d + '`='+data[d]);
  }

  base = base.replace('%table%', table).replace('%conditions%', datalist.join(', ')); // FIXME: how does update structure it's queries??

  db.query(base, function(err, result) {
    if (err) {
      wserror(err, socket);
    } else {
      console.log("Updated:", base);
    }
  });
}

// wsdelete
//    Fired upon reception of ids to delete
// from the database.  Does not return to
// client.
function wsdelete(msg, socket) {
  console.log('Called wsdelete()');
  var tabledescriptor = msg.tabledescriptor, table,
      where, base, data, columnstring;
  table = tabledescriptor.table;
  id = msg.data;

  base = "DELETE FROM %table% WHERE id=%id%";

  base = base.replace('%table%', table).replace('%id%', id);

  db.query(base, function(err, result) {
    if (err) {
      wserror(err, socket);
    } else {
      console.log("Deleted:", base);
    }
  });
}

// wsread
//    Fired upon initialization of a socket or
// upon refresh of a socket.  Fires the socket's
// .tabledescriptor to reload new data from the
// database, and returns with method 'refresh'.
// FIXME: Is method: 'update' the the best idea?  
// Shouldn't we delete all extra data in the store 
// so that it is completely in sync with the 
// database? 
// PROPOSED CHANGE: create a client side 'refresh'
// method that deletes everything in the 
// database and resets.
function wsread(msg, socket) {
  console.log('Called wsread()');
  var tabledescriptor = msg.tabledescriptor, table, 
      columns, where, base;
  table = tabledescriptor.table;
  columns = tabledescriptor.columns;
  where = tabledescriptor.where;
  base = (where) ? 'SELECT %columns% FROM %tables% WHERE %conditions%;' : 'SELECT %columns% FROM %tables%;';
  // FIXME: break these out into modules
  var columnstring = columns.map(function (column) {
    return '`' + table.trim() + '`.`' + column.trim() + '`';
  }).join(', ');
  base = base.replace('%columns%', columnstring).replace('%tables%', table);
  if (where) base = base.replace('%conditions%', where);
  
  // execute the sql query
  db.query(base, function(err, result) {
    if (err) {
      wserror(err, socket);
    } else {
      socket.send(serialize({
        socketid  : msg.socketid,
        sessionid : msg.sessionid,
        method    : 'create',
        data      : result
      }));
      console.log('Executed:', base, 'successfully.');
    }
  });
}

// Web Sockets Area
// FIXME/TODO: Put this in a module somewhere hidden
var namespaces = new data.Store(); // idProperty: 'id'
var incrimentor = 0; // ids for sockets

// define routes
var router = {
  'PUT'    : put,
  'REMOVE' : remove,
  'INIT'   : init
};

function put () {}
function remove() {}

// initialize namespaces and connection
function init (msg, socket) {
  var space = {
    id: incrimentor++,
    table: msg.table,
    columns: msg.columns,
    socket: socket
  };
  
  namespaces.put(space);

  // compose an sql query here
  var query = "SELECT %columns% FROM %table%";
  query = query.replace('%columns%', msg.columns.join()).replace('%table%', msg.table);
  console.log("Received query:", query);

  db.execute(query, function(err, res) {
    if (err) { throw err ;}
    else { 
      socket.send(serialize({
        method: 'INIT',
        data: res
      }));
      console.log('sent');
    }
  });
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
