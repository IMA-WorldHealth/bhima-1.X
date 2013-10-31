var WebSocketServer = require('ws').Server,
    ws              = new WebSocketServer({port: 8000}),
    db              = require('./database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}}),
    composer        = require('./composer'),
    data            = require('./data.js');


// helper functions
function serialize(json) { return JSON.stringify(json); }
function deserialize(json) { return JSON.parse(json); }

var store = new data.Store(), // idProperty: 'id'
    namespaces = {},          // {'table': [{},{},..]} maps to socket ids
    incrimentor = 0;          // ids for sockets

// define routes
var router = {
  'UPDATE'  : update,
  'INSERT'  : insert,
  'REMOVE'  : remove,
  'INIT'    : init,
  'REFRESH' : refresh
};

function refresh (msg, socket) {
  var meta = store.get(msg.socketid);
  meta.select = composer.select(msg);

  // replace the old query
  store.put(meta);

  db.execute(meta.select, function (err, res){
    if (err) { throw err; }
    else { send ({socketid: msg.socketid, method: 'REFRESH', data: res}, socket); }
  });
}

// initialize namespaces and connection
function init (msg, socket) {
  var socketid = incrimentor++, // generate a "unique" id for a socket
      space,
      query;

  space = {
    id         : socketid,
    identifier : msg.identifier,
    socket     : socket,
    namespace  : msg.primary || Object.keys(msg.tables)[0],
    insert     : composer.insert(msg),
    delete     : composer.delete(msg),
    select     : composer.select(msg),
    update     : composer.update(msg),
    tables     : msg.tables
  };

  // store the socket
  store.put(space);
  
  // register it's namespace and push the socket there
  if (!namespaces[space.namespace]) { namespaces[space.namespace] = []; }
  namespaces[space.namespace].push(space.id);

  console.log("Initializing socket with namespace:", space.namespace);
  console.log("All namespaces:", namespaces);

  
  console.log("Executing...", space.select);

  // execute an sql query here
  db.execute(space.select, function(err, res) {
    if (err) { throw err ;}
    // assign the socket id, and send inital dataset
    else { send({socketid: socketid, method: 'INIT', data: res}, socket); }
  });
}

function update (msg, socket) {
  var meta = store.get(msg.socketid),
      sql = meta.update;

  console.log("update data:", msg.data);
  console.log("sql:", meta.update);

  /*db.execute(sql, function (err, res) {
    if (err) { throw err; } 
    console.log('Updated successfully!');
  });*/
}

function insert (msg, socket) {
  var meta = store.get(msg.socketid),
      sql = meta.insert;

  console.log("insert data:", msg.data);
  console.log("SQL:", meta.insert);

  /*db.execute(query, function (err, res) {
     if (err) throw err;
     console.log("Insert Success!");
  });*/
}

// DELETE from the database
function remove (msg, socket) {
  var sql = store.get(msg.socketid).delete;

  console.log("remove data:", msg.data);
  console.log('SQL:', sql.replace("%id%", msg.data));

  /*
  db.execute(query, function (err, res) {
    if (err) throw err;
    console.log("Delete Successful.");
  });
  */
}

function send (msg, socket) {
  // summary
  //    Serializes and sends the data to the client
  socket.send(serialize(msg));
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

    // route the message appropriately.
    router[msg.method](msg, socket);
  });

  socket.on('close', function() {
    console.log('Socket is closing!');
  });

  socket.on('error', function(err) {
    console.log('err:', err);
  });
});

// export this
module.exports = ws;
