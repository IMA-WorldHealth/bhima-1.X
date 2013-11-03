// builds the sql queries prior to socket initialization

// ECMAScript 5 strict mode
'use strict';

// module: Composer
var composer = {};

function escapeid (id) {
  return '`' + id + '`';
}

function escapestr(v) {
  var n = Number(v);      // make sure v isn't a number
  return (!Number.isNaN(n) || ~v.indexOf('"')) ? v : "'" + v + "'";
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

function parsewhr (expr) {
  // summary:
  //    Parses and escapes all components of a where
  //    clause separated by an equals sign.
  // eg:
  //  expr = "a.id=b.id";
  //  parsewhr(expr)
  //    => "`a`.`id`=`b`.`id`"
  var res;
  if (expr.length && Object.prototype.toString.call(expr) === '[object Array]') {
    // this is an array
    // recursively compile the condition
    res = whr(expr, "(%search_conditions%)");
  } else { 
    var splitters =['>=', '<=', '!=', '<>', '=', '<', '>'],
      splitter,
      exprarr;

    splitters.some(function (sym) {
      // trick to halt on first expression 
      if (~expr.indexOf(sym)) {
        exprarr = expr.split(sym);
        splitter = sym;
        return true;
      }
    });

    exprarr = exprarr.map(function (exp) {
      if (~exp.indexOf('.')) {
        // this is a table.col
        exp = exp.split('.').map(function (e) { return escapeid(e); }).join('.');
      } else {
        exp = escapestr(exp); // this will check for numbers
      }
      return exp;
    });
    res = exprarr.join(splitter);
  }
  return res;
}

function whr (whrlist, template) {
  // summary:
  //    Runs through an array of where conditions
  //    and calls parsewhr() on each one, then concats
  //    them all together and splices them into a template.
  //    Supports nested conditions (e.g. 'WHERE (1 OR 2) AND 3')
  //    by using nested arrays.
  // eg:
  //    whrlist = ["a.id<5", "AND", 'a.c="jon"'];
  //    template = "WHERE %search_conditions%";
  //    whr(whrlist, template);
  //    =>    '`a`.`id`<5 AND `a`.`c`="jon"';
  var operators, whrs = [];
  operators = ["AND", "OR"];
  whrlist.forEach(function (str) {
    if (~operators.indexOf(str)) { return whrs.push(str); }
    else { whrs.push(parsewhr(str));} 
  });
  return template.replace("%search_conditions%", whrs.join(" "));
}

function jn (specs, tables) {
  // summary:
  //    creates the join condition using MYSQL JOIN
  //    syntax 't1 JOIN t2 ON t1.col1=t2.col2'.  Supports
  //    creation of many join statements.
  var tmpl, t;

  // construct tables part
  tmpl = tables.map(function (t) { return escapeid(t); }).join(' JOIN ');
  tmpl += " ON ";

  // escape column specification
  t = specs.map(function (t) { 
    // first split on equality
    return t.split('=').map(function (s) {
      // then on the full stop
      return s.split('.').map(function(v) {
        // then escape the value 
        return escapeid(v);
      }).join('.');
    }).join('=');
  });

  // glue column defns together
  tmpl += t.join(' AND ');

  return tmpl;
}

composer.select = function(spec) {
  // summary:
  //    builds a select statement from a defn object.
  var base, join, where, groupby, having, limit,
      tables, hasDistinct, hasLimit, hasWhr, t, hasJoin,
      select_item = [],
      table_list = [],
      search_conditions = [];

  // d is DISTINCT
  base = "SELECT %d%%select_item% FROM %table%";
  where = " WHERE %search_conditions%";
  groupby = " GROUP BY %choice%";
  having = " HAVING %search_conditions%";
  limit = " LIMIT %number%";

  tables = spec.tables;
  hasDistinct = !!spec.distinct;
  hasLimit = !!spec.limit;
  hasJoin = !!spec.join;
  hasWhr = !!spec.where;

  select_item = [];
  for (t in tables) {
    select_item.push(createdotmap(t, tables[t].columns));
  }

  base = base.replace('%d%', hasDistinct ? "DISTINCT " : " ").replace("%select_item%", select_item.join(", "));

  // join logic
  if (!hasJoin) {
    base = base.replace("%table%", Object.keys(spec.tables).map(function (t) { return escapeid(t); }).join());
  } else {
    base = base.replace("%table%", "");
    join = jn(spec.join, Object.keys(spec.tables));
    base += join;
  }

  // where logic
  if (hasWhr) {
    where = whr(spec.where, where);
    base += where;
  }

  // limit logic
  if (hasLimit) {
    // mitigate attacks
    if (isInt(spec.limit)) {base += limit.replace("%number%", spec.limit); }
  }

  base += ";";
  return base;
};

composer.delete = function (spec) {
  // summary:
  //   builds a delete statement from a defn object.
  var base, tables, id, table;
  base = "DELETE FROM %table% WHERE %key%;";

  if (!!spec.join) {
    table = escapeid(spec.primary); 
  } else {
    table = escapeid(Object.keys(spec.tables)[0]); 
  }

  id = escapeid(spec.identifier);

  return base.replace("%table%", table).replace("%key%", id + "=%id%");
};

composer.update = function (spec) {
  // summary:
  //    builds an update object from a defn object
  var base, table, id;
  base = "UPDATE %table% SET %expressions% WHERE %key%;";

  if (!!spec.join) {
    table = escapeid(spec.primary);
  } else {
    table = escapeid(Object.keys(spec.tables)[0]); 
  }

  id = escapeid(spec.identifier);

  return base.replace("%table%", table).replace("%key%", id + "=%id%");
};

composer.insert = function (spec) {
  // summary:
  //    builds an insert object from a defn object
  var base, table;
  base = "INSERT INTO %table% SET %expressions%;";

  if (!!spec.join) {
    table = escapeid(spec.primary);
  } else {
    table = escapeid(Object.keys(spec.tables)[0]); 
  }

  return base.replace('%table%', table);
};

module.exports = composer;
