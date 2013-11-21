// builds the sql queries that a store will use

// sanitization utils
var sanitize = {
  escapeid : function (id) { return ['`', id, '`'].join(''); },
  escape: function (str) { return (!Number.isNaN(Number(str)) || ~str.indexOf('"')) ? str : '"' + str + '"'; },
  isInt : function (i) { return (Math.floor(n) === Number(n)); },
  isIn : function (s) {  return String(s).indexOf('(') > -1; },
  isArray : function (a) { return a.length && Object.prototype.toString.call(a) === '[object Array]'; }
};

//module: Parser 
module.exports = (function (options) {
  // The parser module is the composer for all SQL queries
  // to the backend.  Query objects are decoded from the URL
  // and passed into composer's methods.  
  'use strict';
  var self = {};
  options = options || {};

  self.templates = options.templates || {
    select: 'SELECT %distinct% %columns% FROM %table% WHERE %conditions% LIMIT %limit%;',
    update: 'UPDATE %table% SET %expressions% WHERE %key%;',
    delete: 'DELETE FROM %table% WHERE %key%;',
    insert: 'INSERT INTO %table% SET %expressions%;'
  };

  function getTable (def) {
    // Returns the 'primary' table as defined by the spec.
    // If the query definition is a join, use the primary table.
    // If not, use the first table in the 'tables' property of the
    // definition object.
    return sanitize.escapeid(def.join ? def.primary: Object.keys(def.tables)[0]);
  }

  function cdm (table, columns) {
    // creates a 'dot map' mapping on table
    // to multiple columns.
    // e.g. `table`.`column1`, `table`.`column2`   
    return columns.map(function (c) { 
      return [table, '.', sanitize.escapeid(c)].join('');
    }).join(', ');
  }

  function parseWhere (list) {
    var ops = ['AND', 'OR'];
    return list.map(function (cond) {
      return ~ops.indexOf(cond) ? cond : subroutine(cond); 
    }).join(' ');
  }

  function subroutine (cond) {
    // summary:
    //    Parses and escapes all components of a where
    //    clause separated by an equals sign.
    // eg:
    //  expr = 'a.id=b.id';
    //  parsewhr(expr)
    //    => '`a`.`id`=`b`.`id`'
    var ops = ['>=', '<=', '!=', '<>', '=', '<', '>'],
      conditions,
      operator; 

    if (sanitize.isArray(cond)) {
      // recursively compile the condition
      return '(' + parseWhere(cond) + ')';
    }
  
    // halts on true 
    ops.some(function (op) {
      if (~cond.indexOf(op)) {
        conditions = cond.split(op);
        operator = op;
        return true;
      }
    });

    // escape values
    return conditions.map(function (exp) {
      return ~exp.indexOf('.') ? exp.split('.').map(function (e) { return sanitize.escapeid(e); }).join('.') : sanitize.escape(exp);
    }).join(operator);
  }

  // delete
  self.delete = function (def, id) {
    var identifier, table, templ = self.templates.delete;
    table = getTable(def);
    identifier = sanitize.escapeid(def.identifier);
    return templ.replace('%table%', table)
                .replace('%key%', [identifier, '=', sanitize.escape(id)].join(''));
  };

  // update
  self.update = function (def, obj, id) {
    var identifier, table, expressions = [], templ = self.templates.update;
    table = getTable(def);
    identifier = sanitize.escapeid(def.identifier);
    for (var e in obj) {
      expressions.push([sanitize.escapeid(e), '=', sanitize.escape(obj[e])].join(''));
    }
    return templ.replace('%table%', table)
                .replace('%expressions%', expressions.join(', '))
                .replace('%key%', [identifier, '=', sanitize.escape(id)].join(''));
  };

  // insert
  //  Should we only allow setting columns specified in the def?
  self.insert = function (def, obj) {
    var identifier, table, expressions = [], templ = self.templates.insert;
    table = getTable(def);
    identifier = sanitize.escapeid(def.identifier);

    for (var e in obj) {
      expressions.push([sanitize.escapeid(e), '=', sanitize.escape(obj[e])].join(''));
    }
  
    return templ.replace('%table%', table)
                .replace('%expressions%', expressions.join(', '));  
  };

  // select
  self.select = function (def) {
    var identifier, table, conditions,
      columns = [],
      templ = self.templates.select,
      join = def.join,
      tables = Object.keys(def.tables).map(function (t) { return sanitize.escapeid(t); });
  
    for (var t in def.tables) {
      columns.push(cdm(sanitize.escapeid(t), def.tables[t].columns));
    }

    if (join) {
      // parse the join condition
      table = tables.join(' JOIN ') + ' ON ';
      // escape column specification
      table += join.map(function (exp) { 
        // first split on equality
        return exp.split('=').map(function (col) {
          // then on the full stop
          return col.split('.').map(function(value) {
            // then escape the values
            return sanitize.escapeid(value);
          }).join('.');
        }).join('=');
      }).join(' AND ');
    } else {
      table = tables.join('');
    }

    // default to 1
    conditions = (def.where) ? parseWhere(def.where) : 1;

    return templ.replace('%distinct% ', def.distinct ? 'DISTINCT ' : '')
                .replace('%columns%', columns.join(', '))
                .replace('%table%', table)
                .replace('%conditions%', conditions)
                .replace(' LIMIT %limit%', def.limit ? ' LIMIT ' + def.limit : '');
  };

  return self;

});

// tests

var so = {
  identifier: 'id',
  tables: {
    'account' : {
      columns : ["id", "number", "flag"] 
    }
  }
};

var no = {
  identifier: 'id',
  primary: "account",
  tables: {
    'account' : {
      columns : ["id", "name", "account_type_id"] 
    },
    "account_type" : {
      columns: ["id", "type"]
    }
  },
  join: ["account.account_type_id=account_type.id"]
};
