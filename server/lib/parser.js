// builds the sql queries that a store will use

var sanitize = require('./sanitize'),
    util = require('./util');

//module: Parser
module.exports = function (options) {
  // The parser module is the composer for all SQL queries
  // to the backend.  Query objects are decoded from the URL
  // and passed into composer's methods.
  'use strict';

  var self = {};
  options = options || {};

  self.templates = options.templates || {
    select: 'SELECT %distinct% %columns% FROM %table% WHERE %conditions% GROUP BY %groups% ORDER BY %order% LIMIT %limit%;',
    update: 'UPDATE %table% SET %expressions% WHERE %key%;',
    delete: 'DELETE FROM %table% WHERE %key%;',
    insert: 'INSERT INTO %table% %values% VALUES %expressions%;',
    insert_ref : 'INSERT INTO %table% %values% SELECT %expressions% from %table% where project_id=%project_id%;'
  };

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

  function arrayToIn (id, ids) {
    var templ = ' %id% IN (%ids%) ';
    ids = ids.map(function (v) {
      return sanitize.escape(v);
    });

    return templ.replace('%id%', id)
                .replace('%ids%', ids.toString());
  }

  // delete
  self.delete = function (table, column, id) {
    var templ = self.templates.delete,
        _id;

    _id = id.split(',');  // FIXME: this is an unreasonable hack
    _id = util.isArray(_id) ?
      '(' + _id.map(function (i) { return sanitize.escape(i); }).join(', ') + ')':
      sanitize.escape(id);

    return templ.replace('%table%', sanitize.escapeid(table))
                .replace('%key%', [sanitize.escapeid(column), 'IN', _id].join(' '));
  };

  // update
  self.update = function (table, data, id) {
    var expressions = [], templ = self.templates.update;
    var identifier = sanitize.escapeid(id); // temporarily defaults to 'id'
    for (var d in data) {
      if (d != id) expressions.push([sanitize.escapeid(d), '=', sanitize.escape(data[d])].join(''));
    }

    return templ.replace('%table%', sanitize.escapeid(table))
                .replace('%expressions%', expressions.join(', '))
                .replace('%key%', [identifier, '=', sanitize.escape(data[id])].join(''));
  };

  // insert
  self.insert = function (table, dataList) {
    // insert allows insertion of multiple rows
    var values = [], k, max, idx,
        expressions = [],
        templ = self.templates.insert;

    // FIXME HACK HACK HACK to make behavoir the same across everything
    if (!dataList.length) dataList = [dataList];

    // find the maximum number of keys for a row object
    max = 0;
    dataList.forEach(function (row, index) {
      var l = Object.keys(row).length;
      if (l > max) {
        max = l;
        idx = index;
      }
    });

    // calculate values
    for (k in dataList[idx]) {
      values.push(k);
    }

    var hasReference = values.indexOf('reference') > -1;
    var project_id;

    if (hasReference) { templ = self.templates.insert_ref; }

    dataList.forEach(function (row) {
      var line = [];
      for (var k in values) {
        // default to null
        if (values[k] !== 'reference') {
          line.push(row[values[k]] !== null ? sanitize.escape(row[values[k]]) : 'null');
        } else {
          line.push('IF(ISNULL(max(reference)), 1, max(reference) + 1)');
        }
        if (values[k] === 'project_id') { project_id = sanitize.escape(row[values[k]]); }
      }
      var concat = hasReference ? line.join(', ') : '(' + line.join(', ') + ')';
      expressions.push(concat);
    });

    return templ
      .replace(/%table%/g, sanitize.escapeid(table))
      .replace('%values%', '(' + values.join(', ') + ')')
      .replace('%expressions%', expressions.join(', '))
      .replace('%project_id%', project_id);

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

    var groups = def.groupby ?
      def.groupby.split('.').map(function (i) { return sanitize.escapeid(i); }) :
      null;

    var order;
    return templ.replace('%distinct% ', def.distinct ? 'DISTINCT ' : '')
      .replace('%columns%', columns.join(', '))
      .replace('%table%', table)
      .replace('%conditions%', conditions)
      .replace(' GROUP BY %groups%', groups ? ' GROUP BY ' + groups.join('.') : '')
      .replace(' ORDER BY %order%', order ? ' ORDER BY ' + order.join('.') : '')
      .replace(' LIMIT %limit%', def.limit ? ' LIMIT ' + def.limit : '');
  };

  return self;

};
