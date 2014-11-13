var sanitize = require('./sanitize'),
    util = require('./util');

// Key:
//  %T%  tables
//  %C%  columns
//  %G%  group by
//  %W%  where conditions
//  %I%  id(s)
//  %V%  values
//  %E%  expressions
//  %L%  limit
var templates = {
  select: 'SELECT %DISTINCT% %C% FROM %T% WHERE %W% GROUP BY %G% ORDER BY %O% LIMIT %L%;',
  update: 'UPDATE %T% SET %E% WHERE %key%;',
  delete: 'DELETE FROM %T% WHERE %key%;',
  insert: 'INSERT INTO %T% %V% VALUES %E%;',
  insert_ref : 'INSERT INTO %T% %V% SELECT %E% FROM %T% WHERE project_id = %project_id%;'
};

exports.delete = function (table, column, id) {
  'use strict';
  var _id, sql, template = templates.delete;

  // split the ids, escape, and rejoin in pretty fmt
  // Must use string in case id is an integer
  _id = String(id)
          .split(',')
          .map(sanitize.escape)
          .join(', ');

  // SQL closure
  _id = '(' + _id + ')';

  // format the query
  sql = template.replace('%T%', sanitize.escapeid(table))
                .replace('%key%', [sanitize.escapeid(column), 'IN', _id].join(' '));
  return sql;
};

exports.update = function (table, data, id) {
  'use strict';
  var _key, value, sql, expressions = [],
      template = templates.update,
      _id = sanitize.escapeid(id);

  // For each property, escape both the key and value and push it into
  // the sql values array
  for (var key in data) {
    if (key !== id) {
      value = data[key];
      _key = sanitize.escapeid(key);

      // FIXME : This function allows values to be null.
      // Is that really what we want?

      if (value === null) {
        expressions.push([_key, '=', 'NULL'].join(''));
      } else {
        expressions.push([_key, '=', sanitize.escape(value)].join(''));
      }
    }
  }

  sql = template.replace('%T%', sanitize.escapeid(table))
              .replace('%E%', expressions.join(', '))
              .replace('%key%', [_id, '=', sanitize.escape(data[id])].join(''));

  return sql;
};

// FIXME
//    This function is confusing because data can either by an array
//    of objects or a single object.  We can correct this with proper API
//    design.
exports.insert = function (table, data) {
  'use strict';
  var sql, key, max, idx, values = [],
      expressions = [],
      template = templates.insert;

  // TODO
  //   This checks if data is an array and stuffs it
  //   into an array if it is not.  This should be done either on the
  //   client (by Connect) or before this point (in the /data/ routes)
  if (!util.isArray(data)) { data = [data]; }

  // find the maximum number of keys for a row object
  max = 0;
  data.forEach(function (row, index) {
    var l = Object.keys(row).length;
    if (l > max) {
      max = l;
      idx = index;
    }
  });

  // calculate values
  for (key in data[idx]) {
    values.push(key);
  }

  var hasReference = values.indexOf('reference') > -1;
  var project_id;

  if (hasReference) {
    template = templates.insert_ref;
  }

  data.forEach(function (row) {
    var line = [];
    for (var key in values) {
      // default to null
      if (values[key] !== 'reference') {
        line.push(row[values[key]] !== null ? sanitize.escape(row[values[key]]) : 'null');
      } else {
        line.push('IF(ISNULL(MAX(reference)), 1, MAX(reference) + 1)');
      }
      if (values[key] === 'project_id') { project_id = sanitize.escape(row[values[key]]); }
    }
    var concat = hasReference ? line.join(', ') : '(' + line.join(', ') + ')';
    expressions.push(concat);
  });

  sql = template.replace(/%T%/g, sanitize.escapeid(table))
          .replace('%V%', '(' + values.join(', ') + ')')
          .replace('%E%', expressions.join(', '))
          .replace('%project_id%', project_id);

  return sql;

};

exports.select = function (def) {
  'use strict';
  var identifier, table, conditions,
    columns = [],
    template = templates.select,
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
        return col.split('.').map(sanitize.escapeid).join('.');
      }).join('=');
    }).join(' AND ');
  } else {
    table = tables.join('');
  }

  // default to 1
  conditions = (def.where) ? parseWhere(def.where) : 1;

  var groups = def.groupby ?
    def.groupby.split('.').map(sanitize.escapeid) :
    null;

  // TODO
  //    Order by should support ASC, DESC notation
  //    Perhaps orderby : ['+date', '-project'] or
  //    something like that.
  var order;
  if (def.orderby) {
    order = def.orderby.map(function (o) {
      return o.split('.').map(sanitize.escapeid).join('.');
    });
  }

  return template.replace('%DISTINCT% ', def.distinct ? 'DISTINCT ' : '')
    .replace('%C%', columns.join(', '))
    .replace('%T%', table)
    .replace('%W%', conditions)
    .replace(' GROUP BY %G%', groups ? ' GROUP BY ' + groups.join('.') : '')
    .replace(' ORDER BY %O%', order ? ' ORDER BY ' + order.join(', ') : '')
    .replace(' LIMIT %L%', def.limit ? ' LIMIT ' + def.limit : '');
};

function cdm(table, columns) {
  // creates a 'dot map' mapping on table
  // to multiple columns.
  // e.g. `table`.`column1`, `table`.`column2`
  return columns.map(function (c) {
    return [table, '.', sanitize.escapeid(c)].join('');
  }).join(', ');
}

function parseWhere(array) {
  var ops = ['AND', 'OR'];
  return array
    .map(function (cond) {
      return ~ops.indexOf(cond) ? cond : subroutine(cond);
    })
    .join(' ');
}

function subroutine(cond) {
  // summary:
  //    Parses and escapes all components of a where
  //    clause separated by an equals sign.
  // eg:
  //  expr = 'a.id=b.id';
  //  parsewhr(expr)
  //    => '`a`.`id`=`b`.`id`'
  var conditions, operator,
      operators = ['>=', '<=', '!=', '<>', '=', '<', '>'];

  if (util.isArray(cond)) {
    // recursively compile the condition
    return '(' + parseWhere(cond) + ')';
  }

  // halts on true
  operators.some(function (op) {
    if (~cond.indexOf(op)) {
      conditions = cond.split(op);
      operator = op;
      return true;
    }
  });

  // escape values
  return conditions
    .map(function (exp) {
      return ~exp.indexOf('.') ? exp.split('.').map(sanitize.escapeid).join('.') : sanitize.escape(exp);
    })
    .join(operator);
}

function arrayToIn(id, ids) {
  var _ids, template = ' %id% IN (%ids%) ';
  _ids = ids.map(sanitize.escape).toString();

  return template.replace('%id%', id)
                 .replace('%ids%', _ids);
}
