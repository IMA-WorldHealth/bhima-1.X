var WebSocketServer = require('ws').Server,
      ws            = new WebSocketServer({port: 8000}),
      db            = require('./database/db')({config: {user: 'bika', database: 'bika', host: 'localhost', password: 'HISCongo2013'}});
      data          = require('./data.js');



function escapeid (id) {
  return '`' + id + '`';
}

function escapestr(v) {
  var n = Number(v);      // make sure v isn't a number
  return (!Number.isNaN(n)) ? n : "'" + v + "'";
}

function isInt(n) {
  return (Math.floor(n) === Number(n));
}

function isIn(s) {
  return String(s).indexOf('(') > -1;
}


function createdotmap (table, columns) {
  // summary:
  //    Constructs a dot-map with escaping for 
  //    each column.
  // eg:
  //  table = "table", columns = ["col1", "col2"]
  //  createdotmap(table, columns)
  //    => ["`table`.`col1`", "`table`.`col2`"] 
  return columns.map(function (col) {
   return escapeid(table)  + '.' + escapeid(col);
  }); 
}

function parsejoin (expr) {
  // summary:
  //    Parses the join conditions and returns an escaped 
  //    version of the join statement.
  // eg:
  //    expr = "account.id=account_type.id"
  //    parsejoin(expr)
  //      => "`account`.`id`=`account_type`.`id`"
  var splitters =['>=', '<=', '!=', '<>', '=', '<', '>'],
      dotmaps = [],
      splitter;

  splitters.some(function (sym) {
    if (~expr.indexOf(sym)) {
      dotmaps = dotmaps.concat(expr.split(sym));
      splitter = sym;
      return true;
    }
  });

  if (dotmaps.lenght < 1) { throw new Error("[ws.js] No table/columns mappings."); }

  console.log(dotmaps);
  var split, i, l = 2; // l never changes so we can set it here.
  dotmaps = dotmaps.map(function (dm) {
    split = dm.split('.');
    return split.map(function (s) {
      return escapeid(s);
    }).join('.');
  });

  return dotmaps.join(splitter);
}



function parsewhr (expr) {
  var splitters =['>=', '<=', '!=', '<>', '=', '<', '>'],
    splitter,
    exprarr;

  splitters.some(function (sym) {
    if (~expr.indexOf(sym)) {
      exprarr = expr.split(sym);
      splitter = sym;
      return true;
    }
  });

  exprarr.map(function (exp) {
    if (~exp.indexOf('.')) {
      // this is a table.col
      exp = exp.split('.').map(function (e) { return escapeid(e); }).join('.');
    } else {
      exp = escapestr(exp); // this will check for numbers
    }
    return exp;
  });

  return exprarr.join(splitter);
}

function selectbuilder (options) {
  var table, where, group, having, statement,
    select_expr = [],
    tbl_refs = [],
    whr_cond = [],
    jcond = [],
    tables = options.tables,
    dotmap;

  // Prepared Statements
 // This syntax is taken from the MySQL 5.5 Reference Manual
  // generated on 2011-12-09.
  statement = "SELECT %select_expr% FROM %tbl_refs%";

  where = " WHERE %jcond% AND %whr_cond%";
  group = " GROUP BY %choice%"; // unimplimented
  having = " HAVING %whr_conditions%"; // unimplimented

  select_expr = [];
  tbl_refs = [];

  for (table in tables) {
    console.log('tables', tables)
    console.log('table', table, 'columns', tables[table].columns);
    tbl_refs.push(escapeid(table));
    dotmap = createdotmap(table, tables[table].columns);
    select_expr.push(dotmap);
  }

  console.log("got past table in tables");

  // parse joins
  if (tbl_refs.length > 2) {
    var join = options.join,
      expr;
    // Catch errors
    if (!join) { 
      throw new Error("[ws.js] Multiple tables specified, but not join condition.");
    }
   
    for (expr in join) {
      jcond.push(parsejoin(expr));
    }
  }

  console.log("got passed joins");

  // parse where conditions
  if (options.where) {
     var whr = options.where,
        logical_expr = ["OR", "AND", "NOT", "IN"];

     whr.forEach(function (cond) {
        if (~logical_expr.indexOf(cond)) { whr_cond.push(cond); }
        else { whr_cond.push(parsewhr(cond)); }
     });
  }

  console.log("got passed wheres");

  statement = statement.replace("%select_expr%", select_expr.join(", ")).replace("%tbl_refs%", tbl_refs.join(", "));
  if (jcond.length > 0 || whr_cond.length > 0) {
    where = (jcond) ? where.replace("%jcond%", jcond.join(" AND ")) : where.replace("%jcond%", "");
    where = (whr_cond) ? where.replace("%whr_cond%", whr_cond.join(" ")) : where.replace("%whr_cond%", "");
    statement += where;
  } 

  return statement;
}

function createpreparedstatements (msg) {
  var sqlselect, sqlupdate, sqldelete, sqlinsert;

  sqlselect = "SELECT ?select_expr FROM ?tbl_refs"; // minimal
  sqlupdate = "UPDATE ?tbl_refs SET ?expr WHERE ?whr";
  sqldelete = "DELETE ?tbl_refs FROM ?tbl_refs WHERE ?whr";
  sqlinsert = "INSERT INTO ?tbl_name VALUES ?values";

  if (msg.where && msg.join) {
    sqlselect += " WHERE ?join AND ?whr"; 
  } else if (msg.where) {
      sqlselect += " WHERE ?whr";
  } else if (msg.join) {
      sqlselect += " WHERE ?join";
  }

  return {
    "SELECT" : sqlselect,
    "UPDATE" : sqlupdate,
    "DELETE" : sqldelete,
    "INSERT" : sqlinsert
  };
}

function escapeincoming (tables) {

}

// helper functions
function serialize(json) { return JSON.stringify(json); }
function deserialize(json) { return JSON.parse(json); }


var store = new data.Store(), // idProperty: 'id'
    namespaces = {},          // {'table': [{},{},..]} maps to socket ids
    incrimentor = 0;          // ids for sockets

// define routes
var router = {
  'UPDATE' : update,
  'INSERT' : insert,
  'REMOVE' : remove,
  'INIT'   : init
};

// initialize namespaces and connection
function init (msg, socket) {
  var socketid = incrimentor++, // generate a "unique" id for a socket
      space,
      query,
      statements = createpreparedstatements(msg),
      tables = escapeincoming(msg.tables);

  
  
  space = {
    id         : socketid,
    statements : statements,
    tables     : tables,
    identifier : msg.identifier,
    socket     : socket
  };
 
  // store the socket
  store.put(space);
  
  // register it's namespace and push the socket there
  if (namespaces[msg.table]) namespaces[msg.table].push(socketid);
  else namespaces[msg.table] = [socketid];

  // compose an sql query here
  query = "SELECT %columns% FROM %table%";
  query = query.replace('%columns%', msg.columns.join(', '))
               .replace('%table%', msg.table) + ';';

  db.execute(query, function(err, res) {
    if (err) { throw err ;}
    // assign the socket id, and send inital dataset
    else { send({socketid: socketid, method: 'INIT', data: res}, socket); }
  });
}

function update (msg, socket) {
  var defn = store.get(msg.socketid),
      table = defn.table,
      columns = defn.columns,
      identifier = defn.identifier,
      data = msg.data,
      expressions = [],
      identifiers = [],
      query;

  query = "UPDATE %table% SET %expressions% WHERE %identifiers%";

  // this should be filtered in the final analysis
  // this is also a cool expression, but overly complicated.
  // maybe back in the day when string concatonation was a problem
  // but now it just looks like I'm a nerd.
  // Sigh...
  for (var k in data) {
    if (k != identifier) { expressions.push([k, data[k]].join('=')); }
    else { identifiers.push([k, data[k]].join('=')); }
  }

  query = query.replace('%table%', table)
               .replace('%expressions%', expressions.join(', '))
               .replace('%identifiers%', identifiers.join(', ')) + ";";

  console.log("query:", query);
  /*
  db.execute(query, function (err, res) {
    if (err) { throw err; } 
    console.log('Updated successfully!');
  });*/
}

function insert (msg, socket) {
  var defn = store.get(msg.socketid),
      table = defn.table,
      columns = defn.columns,
      data = msg.data,
      values = [],
      query;

  query = "INSERT INTO %table% (%columns%) VALUES (%values%)";

  for (var k in data) { values.push(data[k]); }
  query = query.replace('%table%', table)
               .replace('%columns%', columns.join(', '))
               .replace('%values%', values.join(', ')) + ";";

  console.log("query:", query);

  // uncomment this when you are ready for awesomeness
  /*
  db.execute(query, function (err, res) {
     if (err) throw err;
     console.log("Insert Success!");
  });
  */
}

// DELETE from the database
function remove (msg, socket) {
  var defn = store.get(msg.socketid),
      table = defn.table,
      columns = defn.columns,
      identifier = defn.identifier,
      data = msg.data,
      condition = '', // at the moment, we are deleting only by ids.
      query;

  query = "DELETE FROM %table% WHERE %condition%";

  condition = [identifier, msg.data].join('=');

  query = query.replace('%table%', table)
               .replace('%condition%', condition) + ';';

  console.log("query:", query);
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

    console.log("Socket:", msg.socketid, "Method:", msg.method);
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

// export this
module.exports = ws;
