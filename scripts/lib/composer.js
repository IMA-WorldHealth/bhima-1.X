// builds the sql queries prior to socket initialization

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

function extract (str) {
  var combo = str.split("="), arr,
      tables = [],
      columns = [];
  combo.forEach(function (cbo) {
    arr = cbo.split('.');
    tables.push(escapeid(arr[0]));
    columns.push(escapeid(arr[1]));
  });
  return {tables : tables, columns: columns};
}

function jn (specs, template) {
  var join = [], extracted, tables,
      columns, expr, fin;
  
  specs.forEach(function (jnstr) {
    extracted = extract(jnstr);
    tables = extracted.tables;
    columns = extracted.columns;
    expr = [];
    for (i = 0, l = 2; i < l; i++) {
      expr.push(tables[i] + "." + columns[i]); 
    }

    fin = template.replace("%table1%", tables[0]).replace("%table2%", tables[1]).replace("%value%", expr.join("="));

    join.push(fin);
  
  });
  return join.join(', ');
}

composer.select = function(spec) {
  // summary:
  //    builds a select statement from a defn object.
  var base, join, where, groupby, having, limit,
      tables, hasDistinct, hasLimit, t, hasJoin,
      select_item = [],
      table_list = [],
      search_conditions = [];

  // d is DISTINCT
  base = "SELECT %d%%select_item% FROM %table%";
  join = "%table1% JOIN %table2% ON %value%"; // default left join
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
    join = jn(spec.join, join);
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
  var base, tables, id;
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
