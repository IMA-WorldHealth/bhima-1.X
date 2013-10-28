/*
 * Ce module retouche a pour role d'interagir avec les bases des donnees.
* On trouvera ici trois grandes fonctionnalites a savoir :
* 1. le pretraitement (Sanitize)
* 2. la gestion d'erreur (Error Handling)
* 3. Interfaces de manipulation des bases des donnees  (A generic interface for all database actions)
*/

// PRIVATE METHODS

function mysqlInit(config) {
  var connectConfig, db, con; //FIXME: Look up connection pooling in MySQL.
  if (config) connectConfig = config;
  db = require('mysql');
  con = db.createConnection(connectConfig);
  con.connect();
  return con;  // c'est pas necessaire pour mysql de retourne cette variable, mais peut-etre ca va necessaire pour autre base des donnees
}


// TODO: impliment PostgreSQL support
function postgresInit(config) {
  db = require('pg');
  return true;
}

// TODO: impliment Firebird support
function firebirdInit(config) {
  db = require('node-firebird');
  return true;
}

// TODO: impliment sqlite support
function sqliteInit(config) {
  db = require('sqlite3');
  return true;
}

// UTILS

/* [fr]
 * Cette methode transformer un tableau dans une chaine
 * avec braces.
 * @param values : TABLEAU
 * EX:
 * tuplify(['id', 'nom', 'location'])
 *  ==> '(id, nom, location)'
 */
function tuplify(values) {
  return '(' + values.join(', ') + ')';
}

/* [fr]
 * Cette methode transforme un tableau des chaines de caractere
 * en une chaine avec un motif au debut et  separee par un element
 *  passe en parametre
 * @param chaines : tableau qui represente la chaine
 * @param motif   : chaine des caracteres a souder
 * @param sep : separateur
*/

function souder(chaines, motif, sep) {
  var chaine = '', i = 0, l = chaines.length;
  for(i; i < l; i++) { 
    chaine += motif + escape_id(chaines[i]) + sep;
  }
  return chaine;
}

/* [fr]
 * Cette fonction s'occupe de la suppression des espaces
 * dans une chaine des caracteres, resout les problemes lies
 * aux accents.
 * @param chaine: la chaine a traiter.
*/

function desinfecter(chaine) {
  chaine = chaine.replace(new RegExp("\\s", 'g'),"");
  chaine = chaine.replace(new RegExp("[àáâãäå]", 'g'),"a");
  chaine = chaine.replace(new RegExp("æ", 'g'),"ae");
  chaine = chaine.replace(new RegExp("ç", 'g'),"c");
  chaine = chaine.replace(new RegExp("[èéêë]", 'g'),"e");
  chaine = chaine.replace(new RegExp("[ìíîï]", 'g'),"i");
  chaine = chaine.replace(new RegExp("ñ", 'g'),"n");                            
  chaine = chaine.replace(new RegExp("[òóôõö]", 'g'),"o");
  chaine = chaine.replace(new RegExp("œ", 'g'),"oe");
  chaine = chaine.replace(new RegExp("[ùúûü]", 'g'),"u");
  chaine = chaine.replace(new RegExp("[ýÿ]", 'g'),"y");
  chaine = chaine.replace(new RegExp("\\W", 'g'),"");
  return chaine;
}

function isInt(n) {
  return (Math.floor(n) === Number(n));
}

function isIn(s) {
  return String(s).indexOf('(') > -1;
}

function escape_id(v) {
  return "`" + v.trim() + "`";
}

function escape_str(v) {
  var n = Number(v);      // make sure v isn't a number
  return (!Number.isNaN(n)) ? n : "'" + v + "'";
}

// SELECT helper functions

// takes in entities
function formatTables(e) {
  var table_list = [],
      column_list = [],
      base = "SELECT ";

  e.forEach(function(p) {
    table_list.push(escape_id(p.t));
    column_list = column_list.concat(p.c.map(function(c) { // format columns like [`table`.`col`, ... ]
      return escape_id(p.t) + '.' + escape_id(c);
    })); // trust me this works.
  });

  return base + column_list.join(', ') + ' FROM ' + table_list.join(', ');
}

function formatJoins(j) {
  var joins = [], links = [], from_table,
    from_col, to_table, to_col, i = 0, str;

  j.forEach(function(p) {  // FIXME: change from use 'ts' syntax 
    if (p.l) links.push(' ' + p.l.trim() + ' ');
    from_table = escape_id(p.ts[0]);
    from_col = escape_id(p.c[0]);
    to_table = escape_id(p.ts[1]);
    to_col = escape_id(p.c[1]);
    joins.push(from_table +  '.' + from_col + ' = ' + to_table + '.' +to_col);
  });

  str = ''; 
  for (i; i < joins.length; i++) {
    str += joins[i] + (links[i] || '');
  }

  return str; 
}

//var x = { entities:[ {t: 'account', c: ["id"]}], cond: [{t: 'account', cl: 'id', z: 'IN', v: '(1,2)'}]};

function formatConditions(c) {
  var conditions = [], links = [], table, col,
      value, eq, i = 0, str = '';

  c.forEach(function(p) { 
    if (p.l) links.push(' ' + p.l.trim() + ' ');
    table = escape_id(p.t);
    col = escape_id(p.cl);
    value = (isInt(p.v) || isIn(p.v)) ? p.v : escape_str(p.v); // escape strings, except in conditions
    eq = p.z.trim();
    conditions.push(table + '.' + col + " " + eq + " " + value);
  });

  for (i; i < conditions.length; i++) {
    str += conditions[i] + (links[i] || '');
  }

  return str;
}

function formatOrderBy(o) {
  var base = " ORDER BY ", dir,
      orders = [];

  o.forEach(function(p) {
    dir = (p.v === '+') ? ' ASC' : ' DESC';
    orders.push(escape_id(p.t) + "." + escape_id(p.c) + dir);
  });

  return base + orders.join(', ');
}

function formatLimit(l) {
  var base = " LIMIT ";
  return base + l;
}


// main db module
function db(options) {
  var supported_databases, con, config;
  options = options || {};

  // Select the system's database with this variable.
  sgbd = options.sgbd || 'mysql';

  // All supported dabases and their initialization
  supported_databases = {
    mysql    : mysqlInit,
    postgres : postgresInit,
    firebird : firebirdInit,
    sqlite   : sqliteInit
  };

  // load external configuration if it exists.
  // Else, default to this configuration
  var default_config = {
    host     : 'localhost',
    user     : 'bika',
    password : 'HISCongo2013',
    database : 'bika'
  };
  config = options.config || default_config;

  // The database connection for all data interactions
  // FIXME: researdh connection pooling in MySQL
  con = supported_databases[sgbd](config); //on a l'objet connection

  return {
    // return all supported databases
    getSupportedDatabases : function() {
      return Object.keys(supported_databases);
    },

    // update: function
    //    Updates a single row in the database.
    // NOTE: pk MUST exist to change one line.
    // If pk does not exist, catastrophic changes
    // may occur (SET the whole database with changes).
    // Pk is expected to be a list of primary keys
    // FIXME: Update documentation concerning this
    // method.
    update: function(table, data, pk) {
      var sets = [], where = [], row, value, base;

      table = escape_id(table);

      function inArr(arr, v) {
        return arr.some(function(i) {
          return i == v;
        });
      }
      
      for (var j in data) {
        row = data[j];
        for (var k in row) {
          value = row[k];
          if (!isInt(value) && !isIn(value)) value = escape_str(value);
          if (!inArr(pk, k)) {
            sets.push(escape_id(k) + "=" + value);
          } else {
            // k in pk
            where.push(escape_id(k) + "=" + value);
          }
        }
      }

      base = "UPDATE " + table + " SET " + sets.join(", ") + " WHERE " + where.join(" AND ") + ";";
      return base;
    },

    execute: function(sql, callback) {
      return con.query(sql, callback);
    },

    delete: function(table, ids) {
      var statement = 'DELETE FROM ', joiner = ' IN ',
            ander = ' AND ';
      var id, in_block;

      table = escape_id(table);
      statement += table + ' WHERE ';

      function escapeNonInts(i) { return isInt(i) ? i : escape_str(i); }
    
      for (id in ids) { 
        if (ids[id] && ids.hasOwnProperty(id) && ids.propertyIsEnumerable(id)) {
          in_block = tuplify(ids[id].map(escapeNonInts)); // escapes non-ints, reassembles
          statement += escape_id(id) + joiner + in_block + ander;
        }
      }
      statement = statement.substring(0, statement.lastIndexOf(ander)) + ';';
      return statement;
    },

    insert: function (table, rows) {
      var statement = 'INSERT INTO ', vals,
          keys = [], groups = [], insert_value;
      
      table = escape_id(table);
      statement += table+' ';

      console.log("insert:", table, rows);

      rows.forEach(function (row) {
        var key;
        vals = [];
        for (key in row) {
          if (keys.indexOf(key) < 0) { keys.push(key); }  // cree un tableau pour cle unique
          insert_value = (typeof row[key] === 'string') ? escape_str(row[key]) : row[key];
          vals.push(insert_value);
        }
        groups.push(tuplify(vals));
      });

      statement += tuplify(keys) + ' VALUES ';
      statement += groups.join(', ').trim() + ';';
      return statement;
    },

    select: function (data) {
      var item, map, parts = [];
    
      map = {
        'entities' : formatTables,
        'jcond'    : formatJoins,
        'cond'     : formatConditions,
        'orderby'  : formatOrderBy,
        'limit'    : formatLimit
      };
    
      parts.push(formatTables(data.entities));
    
      if (data.jcond || data.cond) parts.push(' WHERE ');
    
      for (item in data) {
        if (item !== 'entities') parts.push(map[item](data[item])); // took care of that above.
      }
    
      return parts.join("") + ";";
    }
  };
}

module.exports = db;
