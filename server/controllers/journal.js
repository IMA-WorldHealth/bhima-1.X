var q = require('q');

var db = require('./../lib/db');
var sanitize = require('./../lib/sanitize');
var Store = require('./../lib/store');
var uuid = require('./../lib/guid');
var validate = require('./../lib/validate')();
var util = require('./../lib/util');

var tableRouter, check, get;

/*
 * HTTP Controllers
*/
function lookupTable(req, res, next) {
  // What are the params here?
  request(req.params.table, req.params.id, req.session.user_id, function (err) {
    if (err) { return next(err); }
    res.send(200);
  });
}

/*
/* Utility Methods
*/

// validity checks
check = {
  validPeriod : function (enterprise_id, date) {
    var escaped_date, sql;
    escaped_date = sanitize.escape(get.date(date));
    sql =
      'SELECT `period`.`id`, `period`.`fiscal_year_id` ' +
      'FROM `period` ' +
      'JOIN `fiscal_year` ON `fiscal_year`.`id`=`period`.`fiscal_year_id` '+
      'WHERE `period`.`period_start` <=' + escaped_date + ' AND ' +
        '`period`.`period_stop` >=' + escaped_date + ' AND ' +
        '`period`.`locked` = 0 AND `fiscal_year`.`locked`=0;\n';
    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No period found to match the posted date : ' + date);
      }
      return q(rows);
    });
  },

  validDebitorOrCreditor : function (id) {
    // NOTE: This is NOT STRICT. It may find a debitor when a creditor was
    // requested, or vice versa.  This is fine for the checks here, but not
    // for posting to the general ledger.
    var sql;
    id = sanitize.escape(id);
    sql =
      'SELECT `uuid` ' +
      'FROM (' +
        'SELECT `debitor`.`uuid` FROM `debitor` WHERE `uuid`=' + id + ' ' +
      'UNION ' +
        'SELECT `creditor`.`uuid` FROM `creditor` WHERE `uuid`=' + id +
      ')c;';
    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No Debitor or Creditor found with id: ' + id);
      }
      return q(rows);
    });
  }
};

// utility functions shared by multiple queries
get = {
  origin : function (table) {
    // uses the transaction_type table to derive an origin_id
    // to post to the journal.  Returns the id.
    var sql =
      'SELECT `id`, `service_txt` FROM `transaction_type` ' +
      'WHERE `service_txt` = ' + sanitize.escape(table) + ';';
    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('Cannot find origin for transaction type : ' + table);
      }
      return q(rows.pop().id);
    });
  },

  transactionId : function (project_id) {
    // get a new transaction id from the journal.
    // make sure it is the last thing fired in the
    // call stack before posting.
    var defer = q.defer();

    // FIXME
    // This can be done in one SQL with a default value
    // using an IF statement.  It will be much cleaner.

    var sql =
      'SELECT abbr, max(increment) AS increment FROM (' +
        'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
        'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
        'WHERE project_id = ' + project_id + ' ' +
        'UNION ' +
        'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
        'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
        'WHERE project_id = ' + project_id + ')c;';

    var sql2 = 'SELECT `project`.`abbr` FROM `project` WHERE `project`.`id` = ' + project_id;

    db.exec(sql)
    .then(function (rows) {
      var data = rows.pop();

      //FIX ME: dangerous test

      if(!data.abbr){
        db.exec(sql2)
        .then(function (rows){
          var data2 = rows.pop();
          value = (data.increment) ? '\'' + data2.abbr + data.increment + '\'' : '\'' + data2.abbr + 1 + '\'';
          defer.resolve(value);
        });
      }else{
        // var value = '\'' + data.abbr + data.increment + '\'';
        var value = data.increment ? '\'' + data.abbr + data.increment + '\'' : '\'' + data.abbr + 1 + '\'';
        defer.resolve(value);
      }


      // console.log('voici le tableau data :::', data);
      // var value = data.increment ? '\'' + data.abbr + data.increment + '\'' : '\'' + data.abbr + 1 + '\'';
    });

    return defer.promise;
  },

  date : function (date) {
    // returns a mysql-compatible date
    // Note : this transforms things into a date, not date + time
    if (date) {
      date = new Date(date);
      var year = String(date.getFullYear());
      var month = String(date.getMonth() + 1);
      month = month.length === 1 ? '0' + month : month;
      var day = String(date.getDate()).length === 1 ? '0' + String(date.getDate()) : String(date.getDate());
      return [year, month, day].join('-');
    } else {
      return new Date().toISOString().slice(0, 10);
    }
  },

  period : function (date) {
    // gets the currency period from a mysql-compatible date.
    var sql =
      'SELECT `period`.`id`, `period`.`fiscal_year_id` FROM `period` ' +
      'JOIN `fiscal_year` ON `fiscal_year`.`id`=`period`.`fiscal_year_id` ' +
      'WHERE `fiscal_year`.`locked`=0 AND (`period_start` <= ' + sanitize.escape(get.date(date)) + ' AND ' +
        '`period_stop` >= ' + sanitize.escape(get.date(date)) + ');';

    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No period or fiscal year data for date: ' + date);
      }
      return q(rows.pop());
    });
  },

  exchangeRate : function (date) {
    // expects a mysql-compatible date
    var sql;

    sql =
      'SELECT `enterprise_currency_id`, `foreign_currency_id`, `rate`, ' +
        '`min_monentary_unit` ' +
      'FROM `exchange_rate` JOIN `currency` ON `exchange_rate`.`foreign_currency_id` = `currency`.`id` ' +
      'WHERE `exchange_rate`.`date`=\'' + this.date(date) + '\';';

    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No exchange rate found for date : ' + date);
      }

      var store = new Store();
      rows.forEach(function (line) {
        store.post({ id : line.foreign_currency_id, rate : line.rate });
        store.post({ id : line.enterprise_currency_id, rate : 1});
      });

      return q(store);
    });
  },

  myExchangeRate : function (date) {
    // expects a mysql-compatible date
    var defer = q.defer(),
      sql =
      'SELECT `enterprise_currency_id`, `foreign_currency_id`, `rate`, `min_monentary_unit` ' +
      'FROM `exchange_rate` JOIN `currency` ON `exchange_rate`.`foreign_currency_id` = `currency`.`id` ' +
      'WHERE `exchange_rate`.`date`=\'' + date + '\';';
    db.execute(sql, function (err, rows) {
      if (err) { defer.reject(err); }
      if (rows.length === 0) { defer.reject(new Error('No exchange rate found for date : ' + date)); }
      var store = new Store();
      rows.forEach(function (line) {
        store.post({ id : line.foreign_currency_id, rate : line.rate });
        store.post({ id : line.enterprise_currency_id, rate : 1});
      });
      defer.resolve(store);
    });

    return defer.promise;
  }
};

function authorize (user_id, done) {
  // TODO : This is a placeholder until we find out how to allow
  // users to post.  It is a permissions issue.
  return db.exec('SELECT 1+1 AS ans;')
  .then(function (results) {
    return q(results);
  });
}

// TODO Only has project ID passed from sale reference, need to look up enterprise ID
function handleSales (id, user_id, done, caution) {
  // sale posting requests enter here.
  var sql, data, reference, cfg = {}, queries = {}, subsidyReferences = [];

  sql =
    'SELECT `sale`.`project_id`, `project`.`enterprise_id`, `sale`.`uuid`, `sale`.`currency_id`, ' +
      '`sale`.`debitor_uuid`, `sale`.`seller_id`, `sale`.`discount`, `sale`.`invoice_date`, ' +
      '`sale`.`cost`, `sale`.`note`, `sale_item`.`uuid` as `item_uuid`, `sale_item`.`transaction_price`, `sale_item`.`debit`, ' +
      '`sale_item`.`credit`, `sale_item`.`quantity`, `inventory`.`group_uuid`, `service`.`profit_center_id` ' +
    'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `project` JOIN `service` ON ' +
      '`sale`.`uuid`=`sale_item`.`sale_uuid` AND ' +
      '`sale`.`project_id`=`project`.`id` AND ' +
      '`sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
      '`sale`.`service_id`=`service`.`id` '+
    'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ' ' +
    'ORDER BY `sale_item`.`credit`;';


  function getSubsisy () {
    var sql =
    'SELECT `sale_subsidy`.`value`, `debitor_group`.`account_id`, `subsidy`.`text`, `sale`.`uuid` FROM ' +
    '`sale_subsidy`, `debitor_group`, `subsidy`, `sale` WHERE `sale_subsidy`.`sale_uuid`=`sale`.`uuid` AND ' +
    '`sale_subsidy`.`subsidy_uuid`=`subsidy`.`uuid` AND `subsidy`.`debitor_group_uuid`=`debitor_group`.`uuid` AND ' +
    '`sale_subsidy`.`sale_uuid`=' + sanitize.escape(id);

    return db.exec(sql);
  }

  db.exec(sql)
  .then(function (results) {

    if (results.length === 0) {
      throw new Error('No sale by the id: ' + id);
    }

    data = results;
    reference = results[0];

    // first check - do we have a valid period?
    // Also, implicit in this check is that a valid fiscal year
    // is in place.
    return getSubsisy();
  })
  .then(function (results) {
    subsidyReferences = results;
    return check.validPeriod(reference.enterprise_id, reference.invoice_date);
  })
  .then(function () {
    // second check - are the debits (discounts) positive
    // for every transaction item?
    var debitPositive = data.every(function (row) {
      return validate.isPositive(row.debit);
    });

    if (!debitPositive) {
      throw new Error('Negative debit detected for sale id: ' + id);
    }

    // third check - are all the credits (revenue) positive
    // for every transaction item?
    var creditPositive = data.every(function (row) {
      return validate.isPositive(row.credit);
    });

    if (!creditPositive) {
      throw new Error('Negative credit detected for sale id: ' + id);
    }

    // all checks have passed - prepare for writing to the journal.
    return q([get.origin('sale'), get.period(reference.invoice_date)]);
  })
  .spread(function (originId, periodObject) {
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.originId = originId;

    // create a trans_id for the transaction
    // MUST BE THE LAST REQUEST TO prevent race conditions.
    return get.transactionId(reference.project_id);
  })
  .then(function (trans_id) {

    // we can begin copying data from SALE -> JOURNAL

    // First, copy the data from sale into the journal.


    queries.subsidies = [];
    var subsidies_cost = 0;

    subsidyReferences.forEach(function (item) {
      var sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
        '`sale`.`invoice_date`, `sale`.`note`, ' + [sanitize.escape(item.account_id), item.value, 0, item.value, 0].join(', ') + ', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
        '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
      'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';
      subsidies_cost += item.value;
      queries.subsidies.push(sql);
    });

  if(reference.cost - subsidies_cost > 0){
    queries.sale =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
        '`sale`.`invoice_date`, `sale`.`note`, `debitor_group`.`account_id`, ' + [reference.cost - subsidies_cost, 0, reference.cost - subsidies_cost, 0].join(', ') + ', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
        '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
      'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';
  }



    // Then copy data from SALE_ITEMS -> JOURNAL
    // This query is significantly more complex because sale_item
    // contains both debits and credits.
    queries.items = [];

    data.forEach(function (item) {
      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`, `pc_id`) ' +
        'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
          '`sale`.`invoice_date`, `sale`.`note`, `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
          '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
          ' null, `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ', if(ISNULL(`account`.`pc_id`), \'' + item.profit_center_id + '\', `account`.`pc_id`) ' +
        'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` JOIN `account` ON ' +
          '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
          '`inventory`.`group_uuid`=`inventory_group`.`uuid` AND `account`.`id`=`inventory_group`.`sales_account` ' +
        'WHERE `sale_item`.`uuid` = ' + sanitize.escape(item.item_uuid) + ';';
      queries.items.push(sql);
    });

    // now we must set all relevant rows from sale to 'posted'
    queries.sale_posted =
      'UPDATE `sale` SET `sale`.`posted`=1 WHERE `sale`.`uuid` = ' + sanitize.escape(id);

    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    return q.all(queries.subsidies.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    return queries.sale ? db.exec(queries.sale) : q();
  })
  .then(function () {
    return q([ db.exec(queries.sale_posted), get.transactionId(reference.project_id)]);
  })
  .spread(function (rows, transId) {

    if (caution && caution > 0) {
      console.log('la refernce', reference);

      var descript = '[AVANCE] AJUSTEMENT/' + reference.note;
      var transAmount = caution - reference.cost > 0 ? reference.cost : caution;
      queries.cautionDebiting =
        'INSERT INTO posting_journal '+
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
          'SELECT ' + ['\'' + uuid() + '\'', reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.invoice_date)), '\''+descript+'\''].join(',') + ', ' +
            '`debitor_group`.`account_id`, ' + [0, transAmount, 0, transAmount, reference.currency_id, '\'' + reference.debitor_uuid + '\''].join(',') +
            ', \'D\', null, ' + [cfg.originId, user_id].join(',') + ' ' +
          'FROM `debitor_group` WHERE `debitor_group`.`uuid`= (' +
          'SELECT `debitor`.`group_uuid` FROM `debitor` WHERE `debitor`.`uuid`='+ sanitize.escape(reference.debitor_uuid) +');';

      queries.DebitorCrediting =
        'INSERT INTO posting_journal '+
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
          'SELECT ' + ['\'' + uuid() + '\'', reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.invoice_date)), '\''+descript+'\''].join(',') + ', ' +
            '`debitor_group`.`account_id`, ' + [transAmount, 0, transAmount, 0, reference.currency_id, '\'' + reference.debitor_uuid + '\''].join(',') +
            ', \'D\', ' + [sanitize.escape(reference.uuid), cfg.originId, user_id].join(',') + ' ' +
          'FROM `debitor_group` WHERE `debitor_group`.`uuid`= (' +
          'SELECT `debitor`.`group_uuid` FROM `debitor` WHERE `debitor`.`uuid`='+ sanitize.escape(reference.debitor_uuid) +');';

      return q.all([
        db.exec(queries.cautionDebiting),
        db.exec(queries.DebitorCrediting)
      ]);
    }
    return q();
  })
  .then(function (res) {
    done(null, res);
  })
  .catch(function (err) {
    done(err, null);
  })
  .done();
}

function precision (num, p) {
  return parseFloat(num.toFixed(p));
}

// handles rounding for cash
function handleRounding (cash_id) {
  var sql, row;

  // find out what the current balance is on the invoice to find out if we are paying it all.
  sql =
    'SELECT c.uuid, c.date, c.cost, c.currency_id, sum(p.debit_equiv - p.credit_equiv) AS balance, cu.min_monentary_unit ' +
    'FROM cash AS c JOIN cash_item AS ci JOIN currency as cu JOIN sale AS s JOIN ' +
      '(SELECT credit_equiv, debit_equiv, account_id, inv_po_id, deb_cred_uuid FROM posting_journal ' +
      'UNION ' +
      'SELECT credit_equiv, debit_equiv, account_id, inv_po_id, deb_cred_uuid FROM general_ledger) AS p ' +
    'JOIN debitor AS d JOIN debitor_group as dg ' +
    'ON c.uuid = ci.cash_uuid AND c.currency_id = cu.id AND ci.invoice_uuid = s.uuid AND ci.invoice_uuid = p.inv_po_id AND p.deb_cred_uuid = s.debitor_uuid ' +
    'AND  p.account_id = dg.account_id ' +
    'AND d.uuid = s.debitor_uuid AND d.group_uuid = dg.uuid WHERE c.uuid = ' + sanitize.escape(cash_id) + ' ' +
    'GROUP BY c.uuid;';

  return db.exec(sql)
  .then(function (rows) {
    console.log('voici le rows : ', rows);
    row = rows.pop();
    if (!row) {
      throw new Error('No debtor invoices found.  Internal system error in handling rounding.');
    }
    return get.exchangeRate(row.date);
  })
  .then(function (store) {
    var paidValue = precision(row.cost / store.get(row.currency_id).rate, 4);
    var remainder = precision((row.balance - paidValue) * store.get(row.currency_id).rate, 4);
    // if the absolute value of the remainder is less than the min_monentary_unit
    // then they have paid in full
    var isPaidInFull = Math.abs(remainder) - row.min_monentary_unit < row.min_monentary_unit;
    return { isPaidInFull : isPaidInFull, remainder : row.balance - paidValue };
  });
}

function handleCash (id, user_id, done) {
  // posting from cash to the journal.
  // TODO: refactor this into one 'state' object
  var sql, state = {};

  state.id = id;
  state.userId = user_id;

  sql =
    'SELECT `cash`.`uuid`, `cash_item`.`uuid` AS `cash_item_uuid`, `cash`.`project_id`, `project`.`enterprise_id`, `cash`.`date`, `cash`.`debit_account`, `cash`.`credit_account`, '  +
      '`cash`.`deb_cred_uuid`, `cash`.`deb_cred_type`, `cash`.`currency_id`, `cash`.`cost`, `cash`.`user_id`, ' +
      '`cash`.`cashbox_id`, `cash`.`description`, `cash_item`.`cash_uuid`, `cash_item`.`allocated_cost`, `cash_item`.`invoice_uuid`, ' +
      '`cash`.`type`, `cash`.`document_id` ' +
    'FROM `cash` JOIN `cash_item` JOIN `project` ON ' +
      '`cash`.`uuid`=`cash_item`.`cash_uuid` ' +
      'AND `cash`.`project_id`=`project`.`id` ' +
    'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No cash value by the id :' + state.id);
    }

    state.items = results;
    state.reference = results[0];

    return check.validPeriod(state.reference.enterprise_id, state.reference.date);
  })
  .then(function () {
    var document_id_exist = validate.exists(state.reference.document_id);
    if (!document_id_exist) {
      throw new Error('The document number is not defined for cash id: ' + state.id);
    }

    // third check - is the type defined?
    var type_exist = validate.exists(state.reference.type);
    if (!type_exist) {
      throw new Error('The document type is not defined for cash id: ' + state.id);
    }

    // forth check - is the cost positive?
    var cost_positive = validate.isPositive(state.reference.cost);
    if (!cost_positive) {
      throw new Error('Invalid value for cost for cash id: ' + state.id);
    }

    // fifth check - is the allocated cost positive for every cash item?
    var allocated_postive = state.items.every(function (row) {
      return validate.isPositive(row.allocated_cost);
    });

    if (!allocated_postive) {
      throw new Error('Invalid payment price for one invoice with cash id: ' + id);
    }

    return check.validPeriod(state.reference.enterprise_id, state.reference.date);
  })
  .then(function () {
    return check.validDebitorOrCreditor(state.reference.deb_cred_uuid);
  })
  .then(function () {
    return get.origin('cash');
  })
  // TODO : collapse this code using Q.spread();
  .then(function (id) {
    state.originId = id;
    return get.period(state.reference.date);
  })
  .then(function (period) {
    state.period = period;
    return get.exchangeRate(state.reference.date);
  })
  .then(function (store) {
    state.store = store;
    return get.transactionId(state.reference.project_id);
  })
  .then(function (id) {
    state.transId = id;
    return handleRounding(state.id);
  })
  .then(function (rounding) {
    state.remainder = rounding.remainder;
    state.isPaidInFull = rounding.isPaidInFull;

    var account_type = state.reference.type !== 'E' ? 'credit_account' : 'debit_account' ;

    // Are they a debitor or a creditor?
    state.deb_cred_type = state.reference.type === 'E' ? '\'D\'' : '\'C\'';

    // calculate exchange rate.  If money coming in, credit is cash.cost,
    // credit_equiv is rate*cash.cost and vice versa.
    var money = state.reference.type === 'E' ?
      '`cash`.`cost`, 0, ' + 1/state.store.get(state.reference.currency_id).rate + '*`cash`.`cost`, 0, ' :
      '0, `cash`.`cost`, 0, ' + 1/state.store.get(state.reference.currency_id).rate + '*`cash`.`cost`, ' ;

    state.cashUUID = uuid();

    // copy the data from cash into the journal with care to convert exchange rates.
    var sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`inv_po_id`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `origin_id`, `user_id` ) ' +
      'SELECT `cash`.`project_id`, ' + [sanitize.escape(state.cashUUID), state.period.fiscal_year_id, state.period.id , state.transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        '`cash`.`description`, `cash`.`document_id`, `cash`.`' + account_type + '`, ' + money + sanitize.escape(state.id) +
        ', `cash`.`currency_id`, null, null, ' +
        [state.originId, state.userId].join(', ') + ' ' +
      'FROM `cash` JOIN `cash_item` ON ' +
        ' `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
      'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ' ' +
      'LIMIT 1;'; // just in case

    return db.exec(sql);
  })
  .then(function () {

    // Then copy data from CASH_ITEM -> JOURNAL
    var cash_item_money = state.reference.type === 'E' ?
      '0, `cash_item`.`allocated_cost`, 0, ' + 1/state.store.get(state.reference.currency_id).rate + '*`cash_item`.`allocated_cost`, ' :
      '`cash_item`.`allocated_cost`, 0, '+ 1/state.store.get(state.reference.currency_id).rate + '*`cash_item`.`allocated_cost`, 0, ' ;

    state.cash_item_account_id = state.reference.type !== 'E' ? 'debit_account' : 'credit_account';

    var sqls = [];

    state.itemUUIDs = [];
    state.items.forEach(function (item) {
      var id = uuid();
      state.itemUUIDs.push(id);
      var sql =
        'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `cash`.`project_id`, ' + [sanitize.escape(id), state.period.fiscal_year_id, state.period.id, state.transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        '`cash`.`description`, `cash`.`document_id`, `cash`.`' + state.cash_item_account_id  + '`, ' + cash_item_money +
        '`cash`.`currency_id`, `cash`.`deb_cred_uuid`, ' + state.deb_cred_type + ', ' +
        '`cash_item`.`invoice_uuid`, ' + [state.originId, state.userId].join(', ') + ' ' +
      'FROM `cash` JOIN `cash_item` ON ' +
        '`cash`.`uuid`=`cash_item`.`cash_uuid` '+
      'WHERE `cash_item`.`uuid`=' + sanitize.escape(item.cash_item_uuid) + ';';
      sqls.push(sql);
    });

    return q.all(sqls.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    var query;

    if (state.isPaidInFull && state.remainder !== 0) {

      state.creditOrDebitBool = state.remainder > 0;
      state.roundedRemainder = precision(Math.abs(state.remainder), 4);
      var creditOrDebit = state.creditOrDebitBool ?
        [state.roundedRemainder, 0, state.roundedRemainder, 0].join(', ') :  // debit
        [0, state.roundedRemainder, 0, state.roundedRemainder].join(', ') ;   // credit

      var description =
        '\'Rounding Exchange Rate \'';

      state.roundingUUID = uuid();

      query=
        'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `cash`.`project_id`, ' + [sanitize.escape(state.roundingUUID), state.period.fiscal_year_id, state.period.id, state.transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        description + ', `cash`.`document_id`, `cash_box_account_currency`.'+ ((state.remainder > 0) ? '`loss_exchange_account_id`' : '`gain_exchange_account_id`' ) + ', ' + creditOrDebit + ', ' +
        '`cash`.`currency_id`, null, null, `cash_item`.`invoice_uuid`, ' +
        [state.originId, state.userId].join(', ') + ' ' +
      'FROM `cash` JOIN `cash_item` JOIN `cash_box_account_currency` ON `cash`.`uuid` = `cash_item`.`cash_uuid` AND `cash_box_account_currency`.`id`=`cash`.`cashbox_id` ' +
      'WHERE `cash`.`uuid`=' + sanitize.escape(state.id) + ' LIMIT 1;';
    }
    return query ? db.exec(query) : q();
  })
  .then(function () {
    var query;
    if (state.creditOrDebitBool) {

      var balance = state.creditOrDebitBool ?
        [0, state.roundedRemainder, 0, state.roundedRemainder].join(', ') :   // credit
        [state.roundedRemainder, 0, state.roundedRemainder,  0].join(', ') ;  // debit

      state.roundingUUID2 = uuid();

      var description =
        '\'Rounding Exchange Rate \'';

      query =
        'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `cash`.`project_id`, ' + [sanitize.escape(state.roundingUUID2), state.period.fiscal_year_id, state.period.id, state.transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        description +', `cash`.`document_id`, `cash`.`' + state.cash_item_account_id  + '`, ' + balance + ', ' +
        '`cash`.`currency_id`, `cash`.`deb_cred_uuid`, `cash`.`deb_cred_type`, `cash_item`.`invoice_uuid`, ' +
        [state.originId, state.userId].join(', ') + ' ' +
      'FROM `cash` JOIN `cash_item` ON `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
      'WHERE `cash`.`uuid`=' + sanitize.escape(state.id) + ' LIMIT 1;';
    }
    return query ? db.exec(query) : q();
  })
  .then(function () {
    done();
  })
  .catch(function (error) {
    // undo all transaction on error state
    // clean up

    // collect all uuids
    var ids = [state.roundingUUID, state.roundingUUID2, state.cashUUID]
    .concat(state.itemUUIDs || [])
    .filter(function (uuid) { return !!uuid; })
    .map(function (uuid) { return sanitize.escape(uuid); });

    var sql =
      'DELETE FROM `posting_journal` WHERE `uuid` IN (' + ids.join(', ') + ');';

    if (!ids.length) { return done(error); }

    db.exec(sql)
    .then(function () {
      done(error);
    })
    .catch(function (err) {
      done(err);
    })
    .done();
  })
  .done();
}

function handlePurchase (id, user_id, done) {
  // posting purchase requests
  var sql, data, reference, cfg = {}, queries = {};
  sql =
    'SELECT `purchase`.`project_id`, `project`.`enterprise_id`, `purchase`.`id`, `purchase`.`cost`, `purchase`.`currency_id`, ' +
      '`purchase`.`creditor_id`, `purchase`.`purchaser_id`, `purchase`.`discount`, `purchase`.`invoice_date`, ' +
      '`purchase`.`note`, `purchase`.`posted`, `purchase_item`.`unit_price`, `purchase_item`.`total`, `purchase_item`.`quantity` ' +
    'FROM `purchase` JOIN `purchase_item` JOIN `project` ON `purchase`.`id`=`purchase_item`.`purchase_id` AND `project`.`id`=`purchase`.`project_id` ' +
    'WHERE `purchase`.`id`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) { throw new Error('No purchase order by the id: ' + id); }

    reference = results[0];
    data = results;

    // first check - do we have a validPeriod?
    // Also, implicit in this check is that a valid fiscal year
    // is in place.
    return check.validPeriod(reference.enterprise_id, reference.invoice_date);
  })
  .then(function () {
    // second check - is the cost positive for every transaction?
    var costPositive = data.every(function (row) { return validate.isPositive(row.cost); });
    if (!costPositive) {
      throw new Error('Negative cost detected for purchase id: ' + id);
    }

    // third check - are all the unit_price's for purchase_items positive?
    var unit_pricePositive = data.every(function (row) { return validate.isPositive(row.unit_price); });
    if (!unit_pricePositive) {
      throw new Error('Negative unit_price for purchase id: ' + id);
    }

    // fourth check - is the total the price * the quantity?
    var totalEquality = data.every(function (row) { return validate.isEqual(row.total, row.unit_price * row.quantity); });
    if (!totalEquality) {
      throw new Error('Unit prices and quantities do not match for purchase id: ' + id);
    }

    return get.origin('purchase');
  })
  .then(function (originId) {
    cfg.originId = originId;
    return get.period(reference.date);
  })
  .then(function (periodObject) {
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    // format queries
    queries.purchase =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `purchase`.`project_id`, ' + [cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        '`purchase`.`note`, `creditor_group`.`account_id`, 0, `purchase`.`cost`, 0, `purchase`.`cost`, ' + // last four debit, credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM `purchase` JOIN `creditor` JOIN `creditor_group` ON ' +
        '`purchase`.`creditor_id`=`creditor`.`id` AND `creditor_group`.`id`=`creditor`.`group_id` ' +
      'WHERE `purchase`.`id` = ' + sanitize.escape(id);

    queries.purchase_item =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `purchase`.`project_id`, ' + [cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        '`purchase`.`note`, `inventory_group`.`sales_account`, `purchase_item`.`total`, 0, `purchase_item`.`total`, 0, ' + // last three: credit, debit_equiv, credit_equiv
        '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM `purchase` JOIN `purchase_item` JOIN `inventory` JOIN `inventory_group` ON ' +
        '`purchase_item`.`purchase_id`=`purchase`.`id` AND `purchase_item`.`inventory_id`=`inventory`.`id` AND ' +
        '`inventory`.`group_id`=`inventory_group`.`id` ' +
      'WHERE `purchase`.`id` = ' + sanitize.escape(id) + ';';

    return db.exec(queries.purchase);
  })
  .then(function () {
    return db.exec(queries.purchase_item);
  })
  .then(function (rows) {
    done(null, rows);
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}

// TODO : Figure out what we are going to do with this route
function handleGroupInvoice (id, user_id, done) {
  // posting group invoice requests
  var references = {}, cfg = {};

  function handleResult (results) {
    if (results.length === 0) {
      throw new Error('no record found');
    }
    references = results;
    cfg.enterprise_id = results[0].enterprise_id;
    cfg.project_id = results[0].project_id;
    cfg.date = results[0].date;
    return check.validPeriod(cfg.enterprise_id, cfg.date);
  }

  function handleValidPeriod () {
    var costPositive = references.every(function (row) {
      return validate.isPositive(row.cost);
    });
    if (!costPositive) {
      throw new Error('Negative cost detected for invoice id: ' + id);
    }
    // var sum = 0;
    // references.forEach(function (i) { sum += i.cost; });
    // var totalEquality = validate.isEqual(references[0].total, sum);
    // if (!totalEquality) {
    //   throw new Error('Individual costs do not match total cost for invoice id: ' + id);
    // }
    return get.origin('group_invoice');
  }

  function handleOrigin (originId) {
    cfg.originId = originId;
    return get.period(cfg.date);
  }

  function handlePeriod (periodObject) {
    cfg.period_id = periodObject.id;
    cfg.fiscal_year_id = periodObject.fiscal_year_id;
    references.forEach(function (row) {
      get.transactionId(cfg.project_id)
        .then(function  (trans_id) {
          cfg.descript = trans_id.substring(0,4) + '_VENTE_CHARITE/' + new Date().toISOString().slice(0, 10).toString();
          var debitSql=
            'INSERT INTO `posting_journal` ' +
            '  (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
            'SELECT ' +
              [sanitize.escape(uuid()), cfg.project_id, cfg.fiscal_year_id, cfg.period_id, trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descript)].join(', ') + ', ' +
            '`debitor_group`.`account_id`, `group_invoice_item`.`cost`, ' +
            '  0, `group_invoice_item`.`cost`, 0, `enterprise`.`currency_id`, ' +
            '  null, null, `group_invoice_item`.`invoice_uuid`, ' +
            [cfg.originId, user_id].join(', ') + ' ' +
            'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
            '  `group_invoice`.`uuid` = `group_invoice_item`.`payment_uuid` AND ' +
            '  `group_invoice`.`group_uuid` = `debitor_group`.`uuid`  AND ' +
            '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
            '  `group_invoice`.`project_id` = `project`.`id` AND ' +
            '  `project`.`enterprise_id` = `enterprise`.`id` ' +
            'WHERE `group_invoice_item`.`uuid` = ' + sanitize.escape(row.gid);
          var credit_sql=
            'INSERT INTO `posting_journal` ' +
            '  (`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
            '  `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
            'SELECT `group_invoice`.`project_id`, ' +
              [sanitize.escape(uuid()), cfg.fiscal_year_id, cfg.period_id, trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descript)].join(', ') + ', ' +
            '`debitor_group`.`account_id`, 0, `group_invoice_item`.`cost`, ' +
            '0, `group_invoice_item`.`cost`, `enterprise`.`currency_id`,  ' +
            '`group_invoice`.`debitor_uuid`, \'D\', `group_invoice_item`.`invoice_uuid`, ' +
            [ cfg.originId, user_id].join(', ') + ' ' +
            'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
            '  `group_invoice`.`uuid` = `group_invoice_item`.`payment_uuid` AND ' +
            '  `group_invoice`.`debitor_uuid` = `debitor`.`uuid`  AND ' +
            '  `debitor`.`group_uuid` = `debitor_group`.`uuid` AND ' +
            '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
            '  `group_invoice`.`project_id` = `project`.`id` AND ' +
            '  `project`.`enterprise_id` = `enterprise`.`id` ' +
            'WHERE `group_invoice_item`.`uuid` = ' + sanitize.escape(row.gid);
          return q.all([db.exec(debitSql), db.exec(credit_sql)]);
        })
        .catch(function(err) {
          console.log('erreur', err);
        });
    });
  }
  var sql =
    'SELECT `group_invoice`.`uuid`, `group_invoice`.`project_id`, `project`.`enterprise_id`, `group_invoice`.`debitor_uuid`,  ' +
    '  `group_invoice`.`note`, `group_invoice`.`authorized_by`, `group_invoice`.`date`, ' +
    '  `group_invoice`.`total`, `group_invoice_item`.`invoice_uuid`, `group_invoice_item`.`cost`, ' +
    '  `group_invoice_item`.`uuid` as `gid` ' +
    'FROM `group_invoice` JOIN `group_invoice_item` JOIN `sale` JOIN `project` ' +
    '  ON `group_invoice`.`uuid` = `group_invoice_item`.`payment_uuid` AND ' +
    '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
    '  `project`.`id` = `group_invoice`.`project_id` ' +
    'WHERE `group_invoice`.`uuid`=' + sanitize.escape(id) + ';';
  db.exec(sql)
  .then(handleResult)
  .then(handleValidPeriod)
  .then(handleOrigin)
  .then(handlePeriod)
  .then(function (res) {
    //fixe me this is not the last called function, it should be in reality
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}

function handleEmployeeInvoice (id, user_id, done) {
  // posting group invoice requests
  var references = {}, cfg = {};

  function handleResult (results) {
    if (results.length === 0) {
      throw new Error('no record found');
    }
    references = results;
    cfg.enterprise_id = results[0].enterprise_id;
    cfg.project_id = results[0].project_id;
    cfg.date = results[0].date;
    return check.validPeriod(cfg.enterprise_id, cfg.date);
  }

  function handleValidPeriod () {
    var costPositive = references.every(function (row) {
      return validate.isPositive(row.cost);
    });
    if (!costPositive) {
      throw new Error('Negative cost detected for invoice id: ' + id);
    }
    var sum = 0;
    references.forEach(function (i) { sum += i.cost; });
    var totalEquality = validate.isEqual(references[0].total, sum);
    if (!totalEquality) {
      throw new Error('Individual costs do not match total cost for invoice id: ' + id);
    }
    return get.origin('group_invoice');
  }

  function handleOrigin (originId) {
    cfg.originId = originId;
    return get.period(cfg.date);
  }

  function handlePeriod (periodObject) {
    cfg.period_id = periodObject.id;
    cfg.fiscal_year_id = periodObject.fiscal_year_id;
    references.forEach(function (row) {
      get.transactionId(cfg.project_id)
        .then(function  (trans_id) {
          cfg.descript = trans_id.substring(0,4) + '_SUPPORTED/' + new Date().toISOString().slice(0, 10).toString();

          var debitSql=
            'INSERT INTO `posting_journal` ' +
            '  (`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
            '  `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
            'SELECT `employee_invoice`.`project_id`, ' +
              [sanitize.escape(uuid()), cfg.fiscal_year_id, cfg.period_id, trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descript)].join(', ') + ', ' +
            '`creditor_group`.`account_id`, `employee_invoice_item`.`cost`, 0, ' +
            '`employee_invoice_item`.`cost`, 0, `enterprise`.`currency_id`,  ' +
            '`employee_invoice`.`creditor_uuid`, \'C\', `employee_invoice_item`.`invoice_uuid`, ' +
            [ cfg.originId, user_id].join(', ') + ' ' +
            'FROM `employee_invoice` JOIN `employee_invoice_item` JOIN `debitor` JOIN `creditor` JOIN `debitor_group` JOIN `creditor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
            '  `employee_invoice`.`uuid` = `employee_invoice_item`.`payment_uuid` AND ' +
            '  `employee_invoice`.`debitor_uuid` = `debitor`.`uuid`  AND ' +
            '  `employee_invoice`.`creditor_uuid` = `creditor`.`uuid`  AND ' +
            '  `debitor`.`group_uuid` = `debitor_group`.`uuid` AND ' +
            '  `creditor`.`group_uuid` = `creditor_group`.`uuid` AND ' +
            '  `employee_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
            '  `employee_invoice`.`project_id` = `project`.`id` AND ' +
            '  `project`.`enterprise_id` = `enterprise`.`id` ' +
            'WHERE `employee_invoice_item`.`uuid` = ' + sanitize.escape(row.gid);

          var credit_sql=
            'INSERT INTO `posting_journal` ' +
            '  (`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
            '  `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
            'SELECT `employee_invoice`.`project_id`, ' +
              [sanitize.escape(uuid()), cfg.fiscal_year_id, cfg.period_id, trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descript)].join(', ') + ', ' +
            '`debitor_group`.`account_id`, 0, `employee_invoice_item`.`cost`, ' +
            '0, `employee_invoice_item`.`cost`, `enterprise`.`currency_id`,  ' +
            '`employee_invoice`.`debitor_uuid`, \'D\', `employee_invoice_item`.`invoice_uuid`, ' +
            [ cfg.originId, user_id].join(', ') + ' ' +
            'FROM `employee_invoice` JOIN `employee_invoice_item` JOIN `debitor` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
            '  `employee_invoice`.`uuid` = `employee_invoice_item`.`payment_uuid` AND ' +
            '  `employee_invoice`.`debitor_uuid` = `debitor`.`uuid`  AND ' +
            '  `debitor`.`group_uuid` = `debitor_group`.`uuid` AND ' +
            '  `employee_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
            '  `employee_invoice`.`project_id` = `project`.`id` AND ' +
            '  `project`.`enterprise_id` = `enterprise`.`id` ' +
            'WHERE `employee_invoice_item`.`uuid` = ' + sanitize.escape(row.gid);

          return q.all([db.exec(debitSql), db.exec(credit_sql)]);
          //return q.all([db.exec(credit_sql)]);
        })
        .catch(function(err) {
          console.log('erreur', err);
        });
    });
  }
  var sql =
    'SELECT `employee_invoice`.`uuid`, `employee_invoice`.`project_id`, `project`.`enterprise_id`, `employee_invoice`.`debitor_uuid`,  ' +
    '  `employee_invoice`.`note`, `employee_invoice`.`authorized_by`, `employee_invoice`.`date`, ' +
    '  `employee_invoice`.`total`, `employee_invoice_item`.`invoice_uuid`, `employee_invoice_item`.`cost`, ' +
    '  `employee_invoice_item`.`uuid` as `gid` ' +
    'FROM `employee_invoice` JOIN `employee_invoice_item` JOIN `sale` JOIN `project` ' +
    '  ON `employee_invoice`.`uuid` = `employee_invoice_item`.`payment_uuid` AND ' +
    '  `employee_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
    '  `project`.`id` = `employee_invoice`.`project_id` ' +
    'WHERE `employee_invoice`.`uuid`=' + sanitize.escape(id) + ';';
  db.exec(sql)
  .then(handleResult)
  .then(handleValidPeriod)
  .then(handleOrigin)
  .then(handlePeriod)
  .then(function (res) {
    //fixe me this is not the last called function, it should be in reality
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}

function handleCreditNote (id, user_id, done) {
  // to update this function : SELECT `s`.`uuid`, `s`.`cost`, `t`.`subsidy_uuid`, `t`.`id`, `t`.`account_txt` FROM `sale` as `s` LEFT JOIN (SELECT subsidy_uuid, sale_uuid, account.id, account_txt FROM  sale_subsidy JOIN subsidy JOIN debitor_group JOIN account WHERE sale_subsidy.sale_uuid = 'f5a9e705-6c92-4ae1-b080-75522f6bd2cd' AND sale_subsidy.subsidy_uuid = subsidy.uuid AND subsidy.debitor_group_uuid = debitor_group.uuid AND  debitor_group.account_id = account.id) as `t` ON `s`.`uuid` = `t`.`sale_uuid` WHERE `s`.`uuid` = 'f5a9e705-6c92-4ae1-b080-75522f6bd2cd';
  var sql, data, reference, cfg = {}, queries = {};

  sql =
    'SELECT `credit_note`.`project_id`, `project`.`enterprise_id`, `credit_note`.`cost`, `credit_note`.`debitor_uuid`, `note_date`, `credit_note`.`sale_uuid`, ' +
      ' `credit_note`.`description`, `inventory_uuid`, `quantity`, `sale_item`.`uuid` as `item_uuid`, ' +
      '`transaction_price`, `debit`, `credit`, `service`.`profit_center_id` ' +
    'FROM `credit_note` JOIN `sale` JOIN `service` JOIN `sale_item` JOIN `inventory` JOIN `inventory_unit` JOIN `project` ' +
      'ON `credit_note`.`sale_uuid`=`sale`.`uuid` AND ' +
      '`sale`.`service_id`=`service`.`id` AND ' +
      '`sale_item`.`sale_uuid`=`sale`.`uuid` AND ' +
      '`sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
      '`project`.`id` = `credit_note`.`project_id` AND ' +
      '`inventory`.`unit_id`=`inventory_unit`.`id` ' +
    'WHERE `credit_note`.`uuid`=' + sanitize.escape(id);

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No credit note by the id: ' + id);
    }

    data = results;
    reference = results[0];

    return check.validPeriod(reference.enterprise_id, reference.note_date);

  })
  .then(function () {
    // Ensure a credit note hasn't already been assiged to this sale
    var reviewLegacyNotes = 'SELECT uuid FROM credit_note WHERE sale_uuid=' + sanitize.escape(reference.sale_uuid) + ';';
    return db.exec(reviewLegacyNotes);
  })
  .then(function (rows) {
    // There should only be one sale here
    if (rows.length > 1) {
      throw new Error('This sale has already been reversed with a credit note');
    }

    // Cost positive checks
    var costPositive = data.every(function (row) { return validate.isPositive(row.cost); });
    if (!costPositive) {
      throw new Error('Negative cost detected for invoice id: ' + id);
    }

    // third check - is the total the price * the quantity?
    /*
    function sum (a, b) {
      return a + (b.credit - b.debit);
    }
    */

    //var total = data.reduce(sum, 0);
    //console.log('[DEBUG] sum', total, 'cost', reference_note.cost);
    //var totalEquality = validate.isEqual(total, reference.cost);
    //if (!totalEquality) {
      //console.log('[DEBUG] ', 'sum of costs is not equal to the total');
      //return done(new Error('Individual costs do not match total cost for invoice id: ' + id));
    //}

    // all checks have passed - prepare for writing to the journal.
    return q([ get.origin('credit_note'), get.origin('sale'), get.period(reference.note_date) ]);

  })
  .spread(function (originId, saleOrigin, periodObject) {
    // we now have the origin!
    // we now have the relevant period!

    cfg.saleOrigin = saleOrigin;
    cfg.originId = originId;
    cfg.periodId = periodObject.id; // TODO : change this to camelcase
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    cfg.trans_id = transId;
    cfg.descrip =  reference.description;

  sql =
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `posting_journal`' +
    'WHERE `posting_journal`.`inv_po_id`= ? AND `posting_journal`.`origin_id` = ? ' +
    'UNION ' +
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`,  `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `general_ledger`' +
    'WHERE `general_ledger`.`inv_po_id`= ? AND `general_ledger`.`origin_id` = ? ';

    return db.exec(sql, [reference.sale_uuid, cfg.saleOrigin, reference.sale_uuid, cfg.saleOrigin]);
  })
  .then(function (results) {
    queries.items = [];

    var date = get.date();
    results.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(get.date());

      if(item.deb_cred_uuid){
        item.deb_cred_uuid = sanitize.escape(item.deb_cred_uuid);
      } else {
        item.deb_cred_uuid = null;
      }
      //It it fixed
      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
          '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
          '`user_id`, `cc_id`, `pc_id`) ' +
        'VALUES (' +
          item.uuid + ', ' +
          item.project_id + ', ' +
          item.fiscal_year_id + ', ' +
          item.period_id + ', ' +
          item.trans_id + ', ' +
          sanitize.escape(item.trans_date) + ', ' +
          item.doc_num + ', ' +
          sanitize.escape(item.description) + ', ' +
          item.account_id + ', ' +
          item.credit + ', ' +
          item.debit + ', ' +
          item.credit_equiv + ', ' +
          item.debit_equiv + ', ' +
          item.currency_id + ', ' +
          item.deb_cred_uuid + ', ' +
          sanitize.escape(item.inv_po_id) + ', ' +
          item.cost_ctrl_id + ', ' +
          item.origin_id + ', ' +
          item.user_id + ', ' +
          item.cc_id + ', ' +
          item.pc_id +
        ');';
      queries.items.push(sql);
    });
    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    var updatePosted = 'UPDATE `credit_note` SET `posted`=1 WHERE `uuid`=' + sanitize.escape(id) + ';';
    return db.exec(updatePosted);
  })
  .then(function (rows) {
    done(null, rows);
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}



function handleCashDiscard (id, user_id, done) {
  var sql, reference, cfg = {}, queries = {}, state = {};
  state.id = id;
  cfg.rows = [];
  sql =
    'SELECT `cash_discard`.`project_id`, `cash_discard`.`reference`, `cash_discard`.`uuid`, `cash_discard`.`cost`,' +
    ' `cash_discard`.`debitor_uuid`, `cash_discard`.`cash_uuid`, `cash_discard`.`date`,' +
    ' `cash_discard`.`description`, `cash_discard`.`posted`, `cash`.`document_id`, `cash`.`type`, `cash`.`date`, `cash`.`debit_account`,' +
    ' `cash`.`credit_account`, `cash`.`deb_cred_uuid`, `cash`.`deb_cred_type`, `cash`.`currency_id`, `cash_item`.`allocated_cost`, `cash_item`.`invoice_uuid`' +
    ' FROM `cash_discard` JOIN `cash` JOIN `cash_item` ON `cash_discard`.`cash_uuid`=`cash`.`uuid` AND `cash`.`uuid` = `cash_item`.`cash_uuid`' +
    ' WHERE `cash_discard`.`uuid`=' + sanitize.escape(id);


  db.exec(sql)
  .then(function (results) {

    if (results.length === 0) {
      throw new Error('No cash discard by the id: ' + id);
    }

    reference = results[0];
    return q([ get.origin('cash_discard'), get.period(reference.date) ]);

  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    var sql =
    'SELECT trans_id FROM (SELECT trans_id, inv_po_id FROM posting_journal UNION SELECT trans_id, inv_po_id FROM general_ledger) as `pg` WHERE `pg`.`inv_po_id`=' + sanitize.escape(reference.cash_uuid) + ' LIMIT 1';
    return db.exec(sql);
  })
  .then(function (t) {
    var token_sql =
    'SELECT `project_id`, `fiscal_year_id`, `period_id`, `trans_date`, `trans_id`, `account_id`, `debit`, `credit`, `debit_equiv`, ' +
    '`credit_equiv`, `inv_po_id`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `origin_id`, `user_id` FROM posting_journal ' +
    'UNION SELECT `project_id`, `fiscal_year_id`, `period_id`, `trans_date`, `trans_id`, `account_id`, `debit`, `credit`, `debit_equiv`, ' +
    '`credit_equiv`, `inv_po_id`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `origin_id`, `user_id` FROM general_ledger';
    var sql =
    'SELECT `project_id`, `fiscal_year_id`, `period_id`, `trans_date`, `account_id`, `debit`, `credit`, `debit_equiv`,' +
    ' `credit_equiv`, `inv_po_id`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `origin_id`, `user_id` ' +
    'FROM (' + token_sql + ') as `pg` WHERE `pg`.`trans_id`=' + sanitize.escape(t.pop().trans_id);
    return db.exec(sql);
  })
  .then(function (rows) {

    rows.forEach(function (item){
      var tapon = item.debit;
      item.debit = item.credit;
      item.credit = tapon;
      var tapon_equiv = item.debit_equiv;
      item.debit_equiv = item.credit_equiv;
      item.credit_equiv = tapon_equiv;
      cfg.rows.push(item);
    });

    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    var sqls = [];
    cfg.rows.forEach(function (item) {
      var id = uuid();
      var sql =
        'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT `cash_discard`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        '`cash_discard`.`description`, null, ' + [item.account_id, item.debit, item.credit, item.debit_equiv, item.credit_equiv].join(', ') + ', ' +
        '`cash`.`currency_id`, ' + ((item.deb_cred_uuid) ? sanitize.escape(item.deb_cred_uuid) : 'null') + ', ' +
        ((item.deb_cred_type) ? sanitize.escape(item.deb_cred_type) : 'null') + ', ' + sanitize.escape(item.inv_po_id) + ', ' +
        [cfg.originId, user_id].join(', ') + ' ' +
        'FROM `cash_discard` JOIN `cash` ON `cash`.`uuid`=`cash_discard`.`cash_uuid` '+
        'WHERE `cash_discard`.`uuid`=' + sanitize.escape(state.id) + ';';
      sqls.push(sql);
    });

    return q.all(sqls.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    done();
  })
  .catch(function (error) {
    console.log('gerons erreur', error);
  })
  .done();
}

function handleCaution(id, user_id, done) {
  var sql, reference, cfg = {}, queries = {};

  sql =
    'SELECT * FROM `cash` JOIN `cash_item` ON `cash`.`uuid` = `cash_item`.`cash_uuid` WHERE `cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No caution by the id: ' + id);
    }

    reference = results[0];

    cfg.date = util.toMysqlDate(reference.date);
    return get.myExchangeRate(cfg.date);
  })
  .then(function (exchangeRateStore) {
    var dailyExchange = exchangeRateStore.get(reference.currency_id);
    cfg.debit_equiv = dailyExchange.rate * 0;
    cfg.credit_equiv = (1/dailyExchange.rate) * reference.cost;

    return q([get.origin('caution'), get.period(reference.date)]);
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    //we credit the caution account
    queries.creditingRequest =
      'INSERT INTO posting_journal '+
      '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) VALUES ('+
      [reference.project_id, sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\'','\'' + reference.description + '\'', reference.credit_account,
       reference.cost, 0, cfg.credit_equiv, cfg.debit_equiv, reference.currency_id, '\'' + reference.deb_cred_uuid + '\''].join(', ') +
        ', \'D\', ' + ['\'' + id + '\'', cfg.originId, user_id].join(', ') + ');';

    queries.debitingRequest =
      'INSERT INTO posting_journal '+
      '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) VALUES (' +
      [reference.project_id, sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\'', '\'' + reference.description + '\'',
       reference.debit_account, 0, reference.cost, cfg.debit_equiv, cfg.credit_equiv, reference.currency_id].join(',') +
        ', null, null, ' + ['\'' + id + '\'', cfg.originId, user_id].join(', ') + ');';

    return db.exec(queries.creditingRequest);
  })
  .then(function () {
    return db.exec(queries.debitingRequest);
  })
  .then(function (rows) {
    done(null, rows);
  })
  .catch(function (err) {
    done(err, null);
  })
  .done();
}

function handleTransfert (id, user_id, done) {
  var sql, data, reference, cfg = {}, queries = {};

  // TODO : Formalize this
  sql = 'SELECT `primary_cash`.*, `cash_box_account_currency`.`virement_account_id` ' +
        'FROM `primary_cash` ' +
        'JOIN `cash_box_account_currency` ON `cash_box_account_currency`.`account_id` = `primary_cash`.`account_id` ' +
        'WHERE uuid = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);

    return get.myExchangeRate(date);
  })
  .then(function (exchangeRateStore) {
    var dailyExchange = exchangeRateStore.get(reference.currency_id);
    cfg.valueExchanged = parseFloat((1/dailyExchange.rate) * reference.cost).toFixed(4);

    return q([get.origin('pcash_transfert'), get.period(reference.date)]); // should be get.origin(pcash_transfert);
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    var descrip =  transId.substring(0,4) + 'CASH_BOX_VIRMENT' + new Date().toISOString().slice(0, 10).toString();
    queries.credit =
      'INSERT INTO posting_journal (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
        'VALUES (' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', sanitize.escape(descrip), reference.account_id].join(',') + ', ' +
        [ reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id ].join(',')+', null, null, '+[sanitize.escape(id), cfg.originId, user_id].join(',') +
      ');';

    queries.debit =
      'INSERT INTO posting_journal (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
        'VALUES (' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', sanitize.escape(descrip), reference.virement_account_id].join(',') + ', ' +
        [ 0, reference.cost, 0, cfg.valueExchanged, reference.currency_id ].join(',')+', null, null, '+[sanitize.escape(id), cfg.originId, user_id].join(',') +
      ');';

    return db.exec(queries.credit);
  })
  .then(function () {
    return db.exec(queries.debit);
  })
  .then(function () {
    return get.transactionId(reference.project_id);
  })
// VOICI ANALYSE DANS LA BASE DE DONNEES
  .then(function (transId) {
    var descrip =  transId.substring(0,4) + 'CASH_BOX_VIRMENT' + new Date().toISOString().slice(0, 10).toString();
    queries.credit =
      'INSERT INTO posting_journal (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
        'VALUES (' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', sanitize.escape(descrip), reference.virement_account_id].join(',') + ', ' +
        [ reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id ].join(',')+', null, null, '+[sanitize.escape(id), cfg.originId, user_id].join(',') +
      ');';

    queries.debit =
      'INSERT INTO posting_journal '+
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT ' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', sanitize.escape(descrip)].join(',') +
        ', `account_id`, ' + [0, reference.cost, 0, cfg.valueExchanged, reference.currency_id ].join(',')+', null, null, ' +
        [sanitize.escape(id), cfg.originId, user_id].join(',') + ' ' +
        'FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`='+sanitize.escape(reference.cash_box_id) + ' ' +
          'AND `cash_box_account_currency`.`currency_id`='+sanitize.escape(reference.currency_id);

    return db.exec(queries.credit);
  })
  .then(function () {
    return db.exec(queries.debit);
  })
// VOICI ANALYSE DANS LA BASE DE CONNAISSANCES
  .then(function (rows) {
    done(null, rows);
  })
  .catch(function (err) {
    console.log('voici erreur ', err);
    // FIXME: Need to delete the primary_cash_items before primary cash
    var discard =
      'DELETE FROM primary_cash WHERE uuid = ' + sanitize.escape(id) + ';';

    var discard_item =
      'DELETE FROM primary_cash_item WHERE primary_cash_uuid = ' + sanitize.escape(id) + ';';

    return db.exec(discard_item)
    .then(function (){
      return db.exec(discard);
    })
    .then(function () {
      done(err);
    })
    .done();
  })
  .done();
}

function handleCashReturn (id, user_id, done) {
  var sql, data, reference, cfg = {}, queries = {};

  // TODO : Formalize this
  sql = 'SELECT * FROM `primary_cash` WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);

    return get.myExchangeRate(date);
  })
  .then(function (exchangeRateStore) {
    var dailyExchange = exchangeRateStore.get(reference.currency_id);
    cfg.valueExchanged = parseFloat((1/dailyExchange.rate) * reference.cost).toFixed(4);

    return q([get.origin('cash_return'), get.period(reference.date)]); // should be get.origin(pcash_transfert);
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {

    queries.credit =
      'INSERT INTO posting_journal '+
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT ' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.date)), sanitize.escape(reference.description)].join(',') +
        ', `account_id`, ' + [reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id].join(',')+',null, null, ' +
        [sanitize.escape(id), cfg.originId, user_id].join(',') + ' ' +
        'FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`='+sanitize.escape(reference.cash_box_id) + ' ' +
          'AND `cash_box_account_currency`.`currency_id`='+sanitize.escape(reference.currency_id);

    queries.debit =
      'INSERT INTO posting_journal (`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
        'VALUES (' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.date)), sanitize.escape(reference.description), reference.account_id].join(',') + ', ' +
        [ 0, reference.cost, 0, cfg.valueExchanged, reference.currency_id, sanitize.escape(reference.deb_cred_uuid), sanitize.escape(reference.deb_cred_type)].join(',')+', '+[sanitize.escape(id), cfg.originId, user_id].join(',') +
      ');';

    return db.exec(queries.credit);
  })
  .then(function () {
    return db.exec(queries.debit);
  })
  .then(function (rows) {
    done(null, rows);
  })
  .catch(function (err) {
    console.log('voici erreur ', err);
    var discard =
      'DELETE FROM primary_cash WHERE uuid = ' + sanitize.escape(id) + ';';
      var discard_item =
      'DELETE FROM primary_cash_item WHERE primary_cash_uuid = ' + sanitize.escape(id) + ';';

    return db.exec(discard_item)
    .then(function(){
      return db.exec(discard);
    })
    .then(function () {
      done(err);
    })
    .done();
  })
  .done();
}

function handleConvention (id, user_id, done) {
  var dayExchange = {}, reference = {}, cfg = {};
  var sql = 'SELECT * FROM `primary_cash` WHERE `primary_cash`.`uuid`='+sanitize.escape(id)+';';
  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference.reference_pcash = records[0];
    sql = 'SELECT * FROM `primary_cash_item` WHERE `primary_cash_item`.`primary_cash_uuid`='+sanitize.escape(id)+';';
    return db.exec(sql);
  }

  function getItems (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference.reference_pcash_items = records;
    var date = util.toMysqlDate(reference.reference_pcash.date);
    return get.myExchangeRate(date);
  }

  function getExchange (exchangeStore) {
    dayExchange = exchangeStore.get(reference.reference_pcash.currency_id);
    return q([get.origin('pcash_convention'), get.period(reference.date)]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(reference.reference_pcash.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4)  + '_CAISSEPRINCIPALE_CONVENTION' + new Date().toISOString().slice(0, 10).toString();
    return q.when();
  }

  function debit () {
    return q.all(
                  reference.reference_pcash_items.map(function (ref_pcash_item) {
                    var valueExchanged = parseFloat((1/dayExchange.rate) * ref_pcash_item.debit).toFixed(4);
                    var sql = 'INSERT INTO posting_journal ' +
                              '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                              '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                              '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                              'SELECT ' +
                                [
                                  sanitize.escape(uuid()),
                                  reference.reference_pcash.project_id,
                                  cfg.fiscalYearId,
                                  cfg.periodId,
                                  cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip)
                                ].join(',') + ', `account_id`, ' +
                                [
                                  0, ref_pcash_item.debit,
                                  0, valueExchanged,
                                  reference.reference_pcash.currency_id
                                ].join(',') +
                              ' , null, null, ' + [sanitize.escape(ref_pcash_item.inv_po_id), cfg.originId, user_id].join(',') +
                              ' FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`=' + sanitize.escape(reference.reference_pcash.cash_box_id) +
                              ' AND `cash_box_account_currency`.`currency_id`=' + sanitize.escape(reference.reference_pcash.currency_id);
                    return db.exec(sql);
                  })
    );
  }

  function credit () {
    return q.all(
      reference.reference_pcash_items.map(function (ref_pcash_item) {
        var valueExchanged = parseFloat((1/dayExchange.rate) * ref_pcash_item.debit).toFixed(4);
        var credit_sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              sanitize.escape(uuid()),
              reference.reference_pcash.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\''+get.date()+'\'',  sanitize.escape(cfg.descrip), reference.reference_pcash.account_id
            ].join(',') + ' , ' +
            [
              ref_pcash_item.debit,0,
              valueExchanged,0,
              reference.reference_pcash.currency_id
            ].join(',') + ', null, null, ' + [sanitize.escape(ref_pcash_item.inv_po_id), cfg.originId, user_id].join(',') + ');';
        return db.exec(credit_sql);
      })
    );
  }

  function handleError (err) {
    console.log('[voici errer]', err);
  }

  db.exec(sql)
  .then(getRecord)
  .then(getItems)
  .then(getExchange)
  .spread(getDetails)
  .then(getTransId)
  .then(debit)
  .then(credit)
  .then(function (res) {
    return done(null, res);
  })
  .catch(handleError);
}

function handleEmployee (id, user_id, done) {
  var dayExchange = {}, reference = {}, cfg = {};
  var sql = 'SELECT * FROM `primary_cash` WHERE `primary_cash`.`uuid`='+sanitize.escape(id)+';';

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference.reference_pcash = records[0];
    sql = 'SELECT * FROM `primary_cash_item` WHERE `primary_cash_item`.`primary_cash_uuid`='+sanitize.escape(id)+';';
    return db.exec(sql);
  }

  function getItems (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference.reference_pcash_items = records;
    var date = util.toMysqlDate(reference.reference_pcash.date);
    return get.myExchangeRate(date);
  }

  function getExchange (exchangeStore) {
    dayExchange = exchangeStore.get(reference.reference_pcash.currency_id);
    return q([get.origin('pcash_employee'), get.period(reference.date)]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(reference.reference_pcash.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4)  + '_CAISSEPRINCIPALE_EMPLOYEE' + new Date().toISOString().slice(0, 10).toString();
    return q.when();
  }

  function debit () {
    return q.all(
      reference.reference_pcash_items.map(function (ref_pcash_item) {
        var valueExchanged = parseFloat((1/dayExchange.rate) * ref_pcash_item.debit).toFixed(4);

        var sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'SELECT ' +
            [
              sanitize.escape(uuid()),
              reference.reference_pcash.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip)
            ].join(',') + ', `account_id`, ' +
            [
              ref_pcash_item.debit, 0,
              valueExchanged, 0,
              reference.reference_pcash.currency_id
            ].join(',') + ', null, \'C\', '+
          [sanitize.escape(ref_pcash_item.inv_po_id), cfg.originId, user_id].join(',') +
          ' FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`=' + sanitize.escape(reference.reference_pcash.cash_box_id) +
          ' AND `cash_box_account_currency`.`currency_id`=' + sanitize.escape(reference.reference_pcash.currency_id);

        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      reference.reference_pcash_items.map(function (ref_pcash_item) {
        var valueExchanged = parseFloat((1/dayExchange.rate) * ref_pcash_item.debit).toFixed(4);

        var credit_sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              sanitize.escape(uuid()),
              reference.reference_pcash.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\''+get.date()+'\'',  sanitize.escape(cfg.descrip), reference.reference_pcash.account_id
            ].join(',') + ', ' +
            [
              0, ref_pcash_item.debit,
              0, valueExchanged,
              reference.reference_pcash.currency_id
            ].join(',') + ', ' + sanitize.escape(reference.reference_pcash.deb_cred_uuid) + ', \'C\', '+
            [sanitize.escape(ref_pcash_item.inv_po_id), cfg.originId, user_id].join(',') +
          ');';
        return db.exec(credit_sql);
      })
    );
  }

  function handleError (err) {
    console.log('[voici errer]', err);
  }

  db.exec(sql)
  .then(getRecord)
  .then(getItems)
  .then(getExchange)
  .spread(getDetails)
  .then(getTransId)
  .then(debit)
  .then(credit)
  .then(function (res) {
    return done(null, res);
  })
  .catch(handleError);

}

function handleGenericExpense(id, user_id, done) {
  var sql, state = {}, data, reference, cfg = {};

  state.id = id;
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);
    return get.exchangeRate(date);
  })
  .then(function (store) {
    state.store = store;

    return q([get.origin('generic_expense'), get.period(reference.invoice_date)]);
  })
  .spread(function (originId, periodObject) {

    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.originId = originId;
    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    state.transId = transId;
    var rate = state.store.get(reference.currency_id).rate;
    // debit the creditor
    sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId].join(', ') + ', ' +
        '`date`, `description`, `account_id`, `credit`, `debit`, `credit` / ' + rate + ', `debit` / ' + rate + ', ' +
        '`currency_id`, `document_uuid`, ' + cfg.originId + ', ' + user_id + ' ' +
      'FROM `primary_cash` JOIN `primary_cash_item` ON ' +
        '`primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
      'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';
    return db.exec(sql);
  })
  .then(function () {
    // credit the primary cash account
    var rate = state.store.get(reference.currency_id).rate;
    sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, state.transId].join(', ') + ', ' +
        '`date`, `description`, `cash_box_account_currency`.`account_id`, `debit`, `credit`, `debit` / ' + rate + ', `credit` / ' + rate + ', ' +
        '`primary_cash`.`currency_id`, `document_uuid`,' + cfg.originId + ', ' + user_id + ' ' +
      'FROM `primary_cash` JOIN `primary_cash_item` JOIN `cash_box_account_currency` ON ' +
        '`primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` AND ' +
        '`primary_cash`.`cash_box_id` = `cash_box_account_currency`.`cash_box_id` ' +
      'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ' AND `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ';';
    return db.exec(sql);
  })
  .then(function () {
    done();
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}

function handleGenericIncome (id, user_id, done) {
  var sql, state = {}, data, reference, cfg = {};

  state.id = id;
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);
    return get.exchangeRate(date);
  })
  .then(function (store) {
    state.store = store;

    return q([get.origin('generic_income'), get.period(reference.invoice_date)]);
  })
  .spread(function (originId, periodObject) {
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.originId = originId;
    return get.transactionId(reference.project_id);
  })
  .then(function (transId) {
    state.transId = transId;
    var rate = state.store.get(reference.currency_id).rate;
    // credit the profit account
    sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId].join(', ') + ', ' +
        '`date`, `description`, `account_id`, `credit`, `debit`, `credit` / ' + rate + ', `debit` / ' + rate + ', ' +
        '`currency_id`, `document_uuid`,' + cfg.originId + ', ' + user_id + ' ' +
      'FROM `primary_cash` JOIN `primary_cash_item` ON ' +
        '`primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
      'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';
    return db.exec(sql);
  })
  .then(function () {
    // debit the primary cash account
    var rate = state.store.get(reference.currency_id).rate;
    sql =
      'INSERT INTO `posting_journal` ' +
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
        '`currency_id`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT `project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, state.transId].join(', ') + ', ' +
        '`date`, `description`, `cash_box_account_currency`.`account_id`, `debit`, `credit`, `debit` / ' + rate + ', `credit` / ' + rate + ', ' +
        '`primary_cash`.`currency_id`, `document_uuid`,' + cfg.originId + ', ' + user_id + ' ' +
      'FROM `primary_cash` JOIN `primary_cash_item` JOIN `cash_box_account_currency` ON ' +
        '`primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` AND ' +
        '`primary_cash`.`cash_box_id` = `cash_box_account_currency`.`cash_box_id` ' +
      'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ' AND `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ';';
    return db.exec(sql);
  })
  .then(function () {
    done();
  })
  .catch(function (err) {
    done(err);
  })
  .done();
}

function handleIndirectPurchase (id, user_id, done){
  var reference, dayExchange, cfg = {};
  var sql = 'SELECT `primary_cash`.`reference`, `primary_cash`.`uuid`, `primary_cash`.`project_id`, `primary_cash`.`type`, `primary_cash`.`date`, `primary_cash`.`deb_cred_uuid`, ' +
            '`primary_cash`.`deb_cred_type`, `primary_cash`.`currency_id`, `primary_cash`.`account_id`, `primary_cash`.`cost`, `primary_cash`.`user_id`, `primary_cash`.`description`, ' +
            '`primary_cash`.`cash_box_id`, `primary_cash`.`origin_id`, `primary_cash_item`.`debit`, `primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid`, ' +
            '`creditor`.`group_uuid` FROM `primary_cash` JOIN `primary_cash_item` JOIN `creditor` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` AND ' +
            '`primary_cash`.`deb_cred_uuid` = `creditor`.`uuid` WHERE `primary_cash`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err);
  })
  .done();

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];

    var sql2 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';


    return q([get.origin('indirect_purchase'), get.period(reference.date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_cashbox = res[0].account_id;
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'PAIE C.A Indirect/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'SELECT ' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\''
        ].join(',') + ', `account_id`, ' +
        [
          0, reference.debit.toFixed(4),
          0, reference.debit.toFixed(4),
          reference.currency_id
        ].join(',') + ', ' + sanitize.escape(reference.deb_cred_uuid) + ', \'C\', '+
        [
          sanitize.escape(reference.inv_po_id),
          cfg.originId,
          user_id
        ].join(',') +
      ' FROM `creditor_group` WHERE `creditor_group`.`uuid`=' + sanitize.escape(reference.group_uuid);
    return db.exec(sql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.debit.toFixed(4), 0,
          reference.debit.toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.inv_po_id), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleConfirm (id, user_id, done){
  var references, dayExchange, cfg = {};

  var sql = 'SELECT `purchase`.`uuid`, `purchase`.`cost`, `purchase`.`currency_id`, `purchase`.`project_id`,' +
            ' `purchase`.`purchaser_id`, `purchase`.`purchaser_id`, `employee`.`creditor_uuid`,' +
            ' `purchase_item`.`inventory_uuid`, `purchase_item`.`total`, `purchase`.`paid_uuid` FROM' +
            ' `purchase`, `purchase_item`, `employee` WHERE' +
            ' `purchase`.`uuid` = `purchase_item`.`purchase_uuid` AND' +
            ' `purchase`.`purchaser_id` = `employee`.`id` AND' +
            ' `purchase`.`paid_uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('confirm_purchase'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(references[0].project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    //FIX ME : must get the project abbr by the sql request.
    cfg.descrip =  'CONFIRM C.A. INDIRECT/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT '+
                    [
                      sanitize.escape(uuid()),
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\''+get.date()+'\'', '\''+cfg.descrip+'\''
                    ].join(',') + ', `inventory_group`.`stock_account`, '+
                    [
                      0, reference.total.toFixed(4),
                      0, reference.total.toFixed(4),
                      reference.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT ' +
                  [
                    sanitize.escape(uuid()),
                    reference.project_id,
                    cfg.fiscalYearId,
                    cfg.periodId,
                    cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\''
                  ].join(',') + ', `inventory_group`.`cogs_account`, ' +
                  [
                    reference.total.toFixed(4),0,
                    reference.total.toFixed(4),0,
                    reference.currency_id,
                    sanitize.escape(reference.inventory_uuid),
                    '\' \''
                  ].join(',') + ', ' +
                  [
                    sanitize.escape(reference.uuid),
                    cfg.originId,
                    user_id
                  ].join(',') + ' FROM `inventory_group` WHERE `inventory_group`.`uuid`=' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }
}

function handleConfirmDirectPurchase (id, user_id, done){
  var references, dayExchange, cfg = {};

  var sql = 'SELECT `purchase`.`uuid`, `purchase`.`creditor_uuid` , `purchase`.`cost`, `purchase`.`currency_id`, `purchase`.`project_id`,' +
            ' `purchase`.`purchaser_id`, ' +
            ' `purchase_item`.`inventory_uuid`, `purchase_item`.`total` FROM' +
            ' `purchase`, `purchase_item` WHERE' +
            ' `purchase`.`uuid` = `purchase_item`.`purchase_uuid` AND' +
            ' `purchase`.`is_direct` = 1 AND ' +
            ' `purchase`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('confirm_purchase'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(references[0].project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'CONFIRM C.A. DIRECT/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT '+
                    [
                      sanitize.escape(uuid()),
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\''+get.date()+'\'', '\''+cfg.descrip+'\''
                    ].join(',') + ', `inventory_group`.`stock_account`, '+
                    [
                      0, reference.total.toFixed(4),
                      0, reference.total.toFixed(4),
                      reference.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT ' +
                  [
                    sanitize.escape(uuid()),
                    reference.project_id,
                    cfg.fiscalYearId,
                    cfg.periodId,
                    cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\''
                  ].join(',') + ', `inventory_group`.`cogs_account`, ' +
                  [
                    reference.total.toFixed(4),0,
                    reference.total.toFixed(4),0,
                    reference.currency_id,
                    sanitize.escape(reference.inventory_uuid),
                    '\' \''
                  ].join(',') + ', ' +
                  [
                    sanitize.escape(reference.uuid),
                    cfg.originId,
                    user_id
                  ].join(',') + ' FROM `inventory_group` WHERE `inventory_group`.`uuid`=' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }
}

function handleDistributionPatient (id, user_id, done) {
  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`,`consumption`.`unit_price`, `consumption`.`quantity`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account`, `sale`.`project_id`, `sale`.`service_id` FROM `consumption`, `stock`, `inventory`,`inventory_group`, `sale` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `sale`.`uuid`=`consumption`.`document_id` AND `consumption`.`document_id` =' + sanitize.escape(id) +
    ' AND `consumption`.`uuid` NOT IN ' +
    '(SELECT `consumption_reversing`.`consumption_uuid` FROM `consumption_reversing` WHERE `consumption_reversing`.`document_id` =' + sanitize.escape(id) + ');';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('distribution'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(references[0].project_id); // fix me, ID of project
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'DP/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`, `cc_id` ) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      2
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                    ', `service`.`cost_center_id` FROM `service` WHERE `service`.`id`= ' + sanitize.escape(reference.service_id) + ';';
                  // ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      2, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_patient_deleting = 'DELETE FROM `consumption_patient` WHERE `consumption_patient`.`sale_uuid`=' + sanitize.escape(id);
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_patient_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleDistributionService (id, user_id, details, done) {

  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`, `consumption`.`unit_price`, `consumption`.`quantity`, `consumption_service`.`service_id`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account` FROM `consumption`, `consumption_service`, `stock`, `inventory`,`inventory_group` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `consumption_service`.`consumption_uuid`=`consumption`.`uuid` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `consumption`.`document_id` =' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('distribution'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(details.id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'DS/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`, `cc_id`) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      details.currency_id
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ', `service`.`cost_center_id` FROM `service` WHERE `service`.`id`= ' + sanitize.escape(reference.service_id) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      details.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_service_deleting = 'DELETE FROM `consumption_service` WHERE `consumption_service`.`consumption_uuid` IN (SELECT DISTINCT `consumption`.`uuid` FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id) + ')';
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_service_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleDistributionLoss (id, user_id, details, done) {

  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`, `consumption`.`quantity`, `consumption`.`unit_price`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account` FROM `consumption`, `consumption_loss`, `stock`, `inventory`,`inventory_group` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `consumption_loss`.`consumption_uuid`=`consumption`.`uuid` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `consumption`.`document_id` =' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('loss'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(details.id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'LO/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      details.currency_id
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      details.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_loss_deleting = 'DELETE FROM `consumption_loss` WHERE `consumption_loss`.`document_uuid`=' + sanitize.escape(id);
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_loss_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handlePayroll (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
    'SELECT account_id FROM `config_accounting`, `paiement_period`, `paiement` ' +
    'WHERE `paiement`.`paiement_period_id` = `paiement_period`.`id` AND ' +
    '`paiement_period`.`config_accounting_id` = `config_accounting`.`id` AND ' +
    '`paiement`.`uuid` = ' + sanitize.escape(reference.document_uuid) + ';';


    var date = util.toMysqlDate(get.date());
    return q([get.origin('payroll'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.employee_account_id = res[0].account_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'Payroll/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', cfg.employee_account_id
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(reference.deb_cred_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(id),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\'', reference.account_id
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(id), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleSalaryPayment (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, ' +
      '`deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `primary_cash`.`uuid` = ' + sanitize.escape(reference.primary_cash_uuid) + ';';

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';


    var date = util.toMysqlDate(get.date());
    return q([get.origin('payroll'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    cfg.account_cashbox = res2[0].account_id;
    rate = cfg.store.get(reference.currency_id).rate;

    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_PaySalary/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_id
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handlePromessePayment (id, user_id, data, done) {
  // Cette fonction ecrit dans le journal la promesse d'un paiment de salaire
  // mais le salaire n'est pas encore payE effectivement.
  var sql, rate, state = {}, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `config_accounting`.`account_id`, `paiement`.`uuid`, `paiement`.`employee_id`, `paiement`.`net_salary`, '+
    ' `paiement`.`currency_id`, ((`paiement`.`net_before_tax` - `paiement`.`net_after_tax`) + `paiement`.`net_salary`) AS `gros_salary`' +
    ' FROM `paiement`' +
    ' JOIN `paiement_period` ON `paiement_period`.`id`=`paiement`.`paiement_period_id`' +
    ' JOIN `config_accounting` ON `config_accounting`.`id`=`paiement_period`.`config_accounting_id`' +
    ' WHERE `paiement`.`uuid` = ' + sanitize.escape(data.paiement_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    var sql2;
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` AS `creditor_uuid` FROM `paiement`' +
    ' JOIN `employee` ON `employee`.`id`=`paiement`.`employee_id`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`employee`.`creditor_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `paiement`.`uuid` = ' + sanitize.escape(reference.uuid) + ';';

    var date = util.toMysqlDate(get.date());
    return q([get.origin('payroll'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].creditor_uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_EngagementPay/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), reference.account_id
        ].join(',') + ', ' +
        [
          0, (reference.gros_salary).toFixed(4),
          0, (reference.gros_salary / rate).toFixed(4),
          reference.currency_id
        ].join(',') +
      ', null, null, ' +
        [
          sanitize.escape(data.paiement_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_id
        ].join(',') + ', ' +
        [
          reference.gros_salary.toFixed(4), 0,
          (reference.gros_salary / rate).toFixed(4), 0,
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') + ', \'C\', ' + [sanitize.escape(data.paiement_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handlePromesseCotisation (id, user_id, data, done) {
  // Cette fonction ecrit dans le journal la promesse d'un paiment de cotisation
  // mais la cotisation n'est pas encore payE effectivement.
  var sql, rate, state = {}, reference, cfg = {}, references;
  state.user_id = user_id;

  sql =
    'SELECT `cotisation`.`label`, `cotisation`.`abbr`, `cotisation`.`is_employee`, `cotisation`.`four_account_id`, `cotisation`.`six_account_id`, ' +
    '`paiement`.`employee_id`, `paiement`.`paiement_date`, `paiement`.`currency_id`, `cotisation_paiement`.`value` FROM `cotisation`, `paiement`, `cotisation_paiement` ' +
    'WHERE `cotisation`.`id` = `cotisation_paiement`.`cotisation_id` AND `paiement`.`uuid` = `cotisation_paiement`.`paiement_uuid` AND `paiement`.`uuid`=' + sanitize.escape(data.paiement_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    var sql2;
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    references = records;
    sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` AS `creditor_uuid` FROM `paiement`' +
    ' JOIN `employee` ON `employee`.`id`=`paiement`.`employee_id`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`employee`.`creditor_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `paiement`.`uuid` = ' + sanitize.escape(data.paiement_uuid) + ';';

    var date = util.toMysqlDate(get.date());
    return q([get.origin('cotisation_engagement'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].creditor_uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_EngagementCotisation/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + references.label + '/' + reference.abbr;

        var account, debitSql;

        if (!reference.six_account_id){

          account = cfg.account_id;

          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id, sanitize.escape(cfg.creditor_uuid)
              ].join(',') +
            ', \'C\', ' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';

        } else {
          account = reference.six_account_id;
          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id
              ].join(',') +
            ', null, null, ' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';


        }

        return db.exec(debitSql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + reference.label + '/' + reference.abbr;
        var credit_sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              sanitize.escape(uuid()),
              data.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), reference.four_account_id
            ].join(',') + ', ' +
            [
              reference.value.toFixed(4), 0,
              (reference.value / rate).toFixed(4), 0,
              reference.currency_id,
              sanitize.escape(cfg.creditor_uuid)
            ].join(',') + ', null, ' + [sanitize.escape(data.paiement_uuid), cfg.originId, user_id].join(',') +
          ');';
        return db.exec(credit_sql);
      })
    );
  }
}

function handlePromesseTax (id, user_id, data, done) {
  // Cette fonction ecrit dans le journal la promesse d'un paiment de cotisation
  // mais la cotisation n'est pas encore payE effectivement.
  var sql, rate, state = {}, reference, cfg = {}, references;
  state.user_id = user_id;

  sql =
    'SELECT `tax`.`label`, `tax`.`abbr`, `tax`.`is_employee`, `tax`.`four_account_id`, `tax`.`six_account_id`, ' +
    '`paiement`.`employee_id`, `paiement`.`paiement_date`, `paiement`.`currency_id`, `tax_paiement`.`value` FROM `tax`, `paiement`, `tax_paiement` ' +
    'WHERE `tax`.`id` = `tax_paiement`.`tax_id` AND `paiement`.`uuid` = `tax_paiement`.`paiement_uuid` AND `paiement`.`uuid`=' + sanitize.escape(data.paiement_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    var sql2;
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    references = records;
    sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` AS `creditor_uuid` FROM `paiement`' +
    ' JOIN `employee` ON `employee`.`id`=`paiement`.`employee_id`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`employee`.`creditor_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `paiement`.`uuid` = ' + sanitize.escape(data.paiement_uuid) + ';';

    var date = util.toMysqlDate(get.date());
    return q([get.origin('tax_engagement'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].creditor_uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_EngagementTax/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + reference.label + '/' + reference.abbr;
        var account, debitSql;

        if(!reference.six_account_id){
          account = cfg.account_id;

          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id, sanitize.escape(cfg.creditor_uuid)
              ].join(',') +
            ', \'C\', ' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';

        } else {
          account = reference.six_account_id;

          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id
              ].join(',') +
            ',null, null,' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';
        }

        return db.exec(debitSql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + reference.label + '/' + reference.abbr;
        var credit_sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              sanitize.escape(uuid()),
              data.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.note), reference.four_account_id
            ].join(',') + ', ' +
            [
              reference.value.toFixed(4), 0,
              (reference.value / rate).toFixed(4), 0,
              reference.currency_id,
              sanitize.escape(cfg.creditor_uuid)
            ].join(',') + ', null, ' + [sanitize.escape(data.paiement_uuid), cfg.originId, user_id].join(',') +
          ');';
        return db.exec(credit_sql);
      })
    );
  }
}

function handleSalaryAdvance (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `primary_cash`.`uuid` = ' + sanitize.escape(reference.primary_cash_uuid) + ';';


    var date = util.toMysqlDate(get.date());
    return q([get.origin('salary_advance'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_SalaryAdvance/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_id
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), reference.account_id
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}


function handleDonation (id, user_id, data, done) {
  var cfg = {},
      reference,
      sql = 'SELECT * FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(data.inventory_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res) {
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    cfg.cost = (data.purchase_price * data.quantity).toFixed(4);
    return q([get.origin('donation'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(1,4) + '_Donation/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var sql =
      'INSERT INTO posting_journal '+
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
      'SELECT '+
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip)
        ].join(',') + ', `inventory_group`.`stock_account`, ' +
        [
          0, cfg.cost,
          0, cfg.cost,
          data.currency_id, sanitize.escape(data.inventory_uuid)
        ].join(',') +
        ', null, ' +
        [
          sanitize.escape(data.donation.uuid),
          cfg.originId,
          user_id
        ].join(',') +
      ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid);
    return db.exec(sql);
  }

  function credit () {
    var sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'SELECT ' +
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip)
        ].join(',') + ', `inventory_group`.`donation_account`, ' +
        [
          cfg.cost, 0,
          cfg.cost, 0,
          data.currency_id
        ].join(',') +
        ', null, null, ' +
        [
          sanitize.escape(data.donation.uuid),
          cfg.originId,
          user_id
        ].join(',') +
      ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid);
    return db.exec(sql);
  }

  function catchError (err) {

    var tracks = data.tracking_numbers.map(function (item){
      return sanitize.escape(item);
    });
    var donation_deleting = 'DELETE FROM `donations` WHERE `donations`.`uuid`=' + sanitize.escape(data.donation.uuid),
        donation_item_deleting = 'DELETE FROM `donation_item` WHERE `donation_item`.`donation_uuid`=' + sanitize.escape(data.donation.uuid),
        movement_deleting = 'DELETE FROM `movement` WHERE `movement`.`document_id`=' + sanitize.escape(data.movement.document_id),
        stock_deleting = 'DELETE FROM `stock` WHERE `stock`.`tracking_number` IN (' + tracks.join() + ')';

    db.exec(donation_item_deleting)
    .then(function () {
      return db.exec(donation_deleting);
    })
    .then(function () {
      return db.exec(movement_deleting);
    })
    .then(function () {
      return db.exec(stock_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleTaxPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];

    var sql2 =
      'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
      ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid` ' +
      ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
      ' WHERE `primary_cash`.`deb_cred_uuid`=' + sanitize.escape(reference.deb_cred_uuid) + ';';
    var date = util.toMysqlDate(get.date());

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';

    return q([get.origin('tax_payment'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.employee_account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    cfg.account_cashbox = res2[0].account_id;

    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Tax Payment/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), sanitize.escape(reference.account_id)
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleCotisationPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
            'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
            ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid` ' +
            ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
            ' WHERE `primary_cash`.`deb_cred_uuid`=' + sanitize.escape(reference.deb_cred_uuid) + ';';

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';

    var date = util.toMysqlDate(get.date());
    return q([get.origin('cotisation_paiement'), get.period(get.date()), get.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.employee_account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.account_cashbox = res2[0].account_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_PayCotisation/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), sanitize.escape(reference.account_id)
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleCreateFiscalYear (id, user_id, details, done) {

  var rate, cfg = {},
      array_journal_uuid = [];

  getOrigin()
  .spread(getDetails)
  .then(getTransId)
  .then(postingEntry)
  .then(function (res) {
    done(null, res);
  })
  .catch(catchError);

  function getOrigin () {
    var date = util.toMysqlDate(get.date());
    return q([get.origin('journal'), get.period(get.date()), get.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store) {
    cfg.balance = details[0];
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(cfg.balance.currencyId).rate;
    return get.transactionId(cfg.balance.projectId);
  }

  function getTransId (transId) {
    cfg.transId = transId;
    cfg.description =  transId.substring(0,4) + '/' + cfg.balance.description;
  }

  function postingEntry () {
    return q.all(
      details.map(function (balance) {
        var journal_uuid = sanitize.escape(uuid());
        array_journal_uuid.push(journal_uuid);

        var sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              journal_uuid,
              balance.projectId,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.transId, '\'' + get.date() + '\'', sanitize.escape(cfg.description), balance.accountId
            ].join(',') + ', ' +
            [
              balance.credit.toFixed(4), balance.debit.toFixed(4),
              (balance.credit / rate).toFixed(4), (balance.debit / rate).toFixed(4),
              balance.currencyId,
              cfg.originId,
              user_id
            ].join(',') +
          ');';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var sql = array_journal_uuid.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid` IN (' + array_journal_uuid.join(',') + '); ' : 'SELECT 1+1;';

    db.exec(sql)
    .then(function () {
      console.error('[ROLLBACK]: deleting last entries in posting journal, Because => ', err);
      return done(err);
    })
    .catch(function (err2) {
      console.error('[ERR2]:', err2);
    });
  }
}

function handleReversingStock (id, user_id, details, done) {
  var sql, rate, transact, state = {}, queries = {}, data, reference, postingJournal, cfg = {};
  state.user_id = user_id;
  sql =
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `posting_journal`' +
    'WHERE `posting_journal`.`trans_id`=' + sanitize.escape(id) +
    'UNION ' +
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `general_ledger`' +
    'WHERE `general_ledger`.`trans_id`=' + sanitize.escape(id) ;

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(function (res){
    return done(null, res);
  })
  .then(function (res) {
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    postingJournal = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('reversing'), get.period(get.date()), get.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    transact = get.transactionId(reference.project_id);
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'REVERSING STOCK ' + new Date().toISOString().slice(0, 10).toString();
    return requests();
  }

  function requests () {
    queries.items = [];
    var date = get.date();
    postingJournal.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(get.date());

      if(item.deb_cred_uuid){
        item.deb_cred_uuid = sanitize.escape(item.deb_cred_uuid);
      } else {
        item.deb_cred_uuid = null;
      }

      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
          '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
          '`user_id`, `cc_id`, `pc_id`) ' +
        'VALUES (' +
          item.uuid + ', ' +
          item.project_id + ', ' +
          item.fiscal_year_id + ', ' +
          item.period_id + ', ' +
          item.trans_id + ', ' +
          sanitize.escape(item.trans_date) + ', ' +
          item.doc_num + ', ' +
          sanitize.escape(item.description) + ', ' +
          item.account_id + ', ' +
          item.credit + ', ' +
          item.debit + ', ' +
          item.credit_equiv + ', ' +
          item.debit_equiv + ', ' +
          item.currency_id + ', ' +
          sanitize.escape(item.deb_cred_uuid) + ', ' +
          sanitize.escape(item.inv_po_id) + ', ' +
          item.cost_ctrl_id + ', ' +
          item.origin_id + ', ' +
          item.user_id + ', ' +
          item.cc_id + ', ' +
          item.pc_id +
        ');';
      queries.items.push(sql);
    });
    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  }
}

function handleAdvancePaiment (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `rubric_paiement`.`id`, `rubric_paiement`.`rubric_id`, `rubric_paiement`.`paiement_uuid`, `rubric_paiement`.`value`, ' +
    '`rubric`.`is_advance`, `paiement`.`currency_id`, `paiement`.`employee_id`, `employee`.`prenom`, `employee`.`name`, `employee`.`creditor_uuid`, ' +
    '`creditor_group`.`account_id` AS `account_creditor`, `config_accounting`.`account_id` AS `account_paiement`, `primary_cash`.`project_id` ' +
    'FROM `rubric_paiement` ' +
    'JOIN `rubric` ON `rubric`.`id` = `rubric_paiement`.`rubric_id` ' +
    'JOIN `paiement` ON `paiement`.`uuid` = `rubric_paiement`.`paiement_uuid` ' +
    'JOIN `paiement_period` ON `paiement_period`.`id` = `paiement_period`.`config_accounting_id` ' +
    'JOIN `config_accounting` ON `config_accounting`.`id` = `paiement_period`.`config_accounting_id` ' +
    'JOIN `employee` ON `employee`.`id` = `paiement`.`employee_id` ' +
    'JOIN `creditor` ON `creditor`.`uuid`= `employee`.`creditor_uuid` ' +
    'JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    'JOIN `primary_cash_item` ON `primary_cash_item`.`inv_po_id` = `rubric_paiement`.`paiement_uuid` ' +
    'JOIN `primary_cash` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `rubric_paiement`.`paiement_uuid` = ' + sanitize.escape(id) +
    'AND `rubric`.`is_advance` = 1 ';


  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }

    reference = records[0];
    var date = util.toMysqlDate(get.date());
    return q([get.origin('salary_advance'), get.period(get.date()), get.exchangeRate(date)]);

  }

  function getDetails (originId, periodObject, store) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;

    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Pay Advance salary/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    if(reference.value > 0) {
      var debitSql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
        'VALUES (' +
          [
            sanitize.escape(uuid()),
            reference.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), reference.account_creditor
          ].join(',') + ', ' +
          [
            (reference.value).toFixed(4), 0,
            (reference.value / rate).toFixed(4), 0,
            reference.currency_id,
            sanitize.escape(reference.creditor_uuid)
          ].join(',') +
        ', \'C\', ' +
          [
            sanitize.escape(reference.paiement_uuid),
            cfg.originId,
            user_id
          ].join(',') + ');';

      return db.exec(debitSql);
    }
  }

  function credit () {
    if(reference.value > 0) {
      var credit_sql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'VALUES (' +
          [
            sanitize.escape(uuid()),
            reference.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), reference.account_paiement
          ].join(',') + ', ' +
          [
            0, reference.value.toFixed(4),
            0, (reference.value / rate).toFixed(4),
            reference.currency_id
          ].join(',') + ', null, null, ' + [sanitize.escape(reference.paiement_uuid), cfg.originId, user_id].join(',') +
        ');';
      return db.exec(credit_sql);
    }
  }
}

function handleCancelSupport (id, user_id, details, done) {
  var sql, rate, transact, state = {}, queries = {}, data, reference, postingJournal, cfg = {};
  state.user_id = user_id;
  sql =
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `posting_journal`' +
    'WHERE `posting_journal`.`inv_po_id`=' + sanitize.escape(id) +
    'UNION ALL' +
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`,  `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `general_ledger`' +
    'WHERE `general_ledger`.`inv_po_id`=' + sanitize.escape(id) ;

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(function (res){
    return done(null, res);
  })
  .then(function (res) {
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  });

  function getRecord (records) {
    if (records.length === 0) { return; }
    reference = records[0];
    postingJournal = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('group_invoice'), get.period(get.date()), get.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;

    console.log(postingJournal.length);

    postingJournal = postingJournal.filter(function (item) {
      return item.origin_id === cfg.originId;
    });


    transact = get.transactionId(reference.project_id);
    return get.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'CANCEL SUPPORTED ' + new Date().toISOString().slice(0, 10).toString();
    return requests();
  }

  function requests () {
    queries.items = [];
    var date = get.date();
    postingJournal.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(get.date());

      if(item.deb_cred_uuid){
        item.deb_cred_uuid = sanitize.escape(item.deb_cred_uuid);
      } else {
        item.deb_cred_uuid = null;
      }

      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `deb_cred_type`, `currency_id`, ' +
          '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
          '`user_id`, `cc_id`, `pc_id`) ' +
        'VALUES (' +
          item.uuid + ', ' +
          item.project_id + ', ' +
          item.fiscal_year_id + ', ' +
          item.period_id + ', ' +
          item.trans_id + ', ' +
          sanitize.escape(item.trans_date) + ', ' +
          item.doc_num + ', ' +
          sanitize.escape(item.description) + ', ' +
          item.account_id + ', ' +
          item.credit + ', ' +
          item.debit + ', ' +
          item.credit_equiv + ', ' +
          item.debit_equiv + ', ' +
          sanitize.escape(item.deb_cred_type) + ', ' +
          item.currency_id + ', ' +
          sanitize.escape(item.deb_cred_uuid) + ', ' +
          sanitize.escape(item.inv_po_id) + ', ' +
          item.cost_ctrl_id + ', ' +
          item.origin_id + ', ' +
          item.user_id + ', ' +
          item.cc_id + ', ' +
          item.pc_id +
        ');';
      queries.items.push(sql);
    });
    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  }
}

function handleFiscalYearResultat (id, user_id, data, done) {
  /*
  * param id : new fiscal year ID
  * param user_id : user ID
  * param data : useful data
  */
  var cfg = {},
      reference,
      resAccount = data.resultat_account,
      array6 = data.class6,
      array7 = data.class7,
      transactionDate,
      forcingDate;

  if (typeof data.forcingDate === 'undefined' || data.forcingDate === null || !data.forcingDate) {
    forcingDate = get.date(util.toMysqlDate(data.forcingDate));
    cfg.isForClosing = false;
  } else {
    forcingDate = get.date(util.toMysqlDate(data.forcingDate));
    cfg.isForClosing = true;
  }

  getOrigin()
  .spread(getDetails)
  .then(getTransId)
  .then(function () {
    return postingResultat(resAccount);
  })
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getOrigin () {
    cfg.user_id = user_id;
    cfg.project_id = 1; // HBB by default
    transactionDate = cfg.isForClosing ? forcingDate : get.date();
    return q([get.origin('journal'), get.period(transactionDate)]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(cfg.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    if (cfg.isForClosing) {
      cfg.descrip =  'Locking Fiscal Year/' + String(transactionDate);
    } else {
      cfg.descrip =  'New Fiscal Year/' + new Date().toISOString().slice(0, 10).toString();
    }
  }

  function postingResultat (resAccount) {
    var processClass6 = array6.map(function (account6) {
      return processDebCred6(resAccount.id, account6);
    });

    var processClass7 = array7.map(function (account7) {
      return processDebCred7(resAccount.id, account7);
    });

    return q.all([processClass6, processClass6]);
  }

  function processDebCred6 (resultatAccount, class6Account) {
    var bundle = {
          class6Account : class6Account,
          solde         : class6Account.debit_equiv - class6Account.credit_equiv,
          currency_id   : class6Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class6Account.id, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(bundle.class6Account.id, bundle), credit(resultatAccount, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal '+
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', `account`.`id`, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM `account` WHERE `account`.`id`= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', `account`.`id`, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM `account` WHERE `account`.`id`= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }

  function processDebCred7 (resultatAccount, class7Account) {
    var bundle = {
          class7Account : class7Account,
          solde         : class7Account.credit_equiv - class7Account.debit_equiv,
          currency_id   : class7Account.currency_id
        };

    if (bundle.solde > 0) {
      return q.all([debit(bundle.class7Account.id, bundle), credit(resultatAccount, bundle)]);
    } else if (bundle.solde < 0) {
      return q.all([debit(resultatAccount, bundle), credit(bundle.class7Account.id, bundle)]);
    }

    function debit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal '+
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
        'SELECT '+
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', `account`.`id`, ' +
          [
            0, Math.abs(bundle.solde),
            0, Math.abs(bundle.solde),
            bundle.currency_id,
            'null'
          ].join(',') +
          ', null, ' +
          [
            'null',
            cfg.originId,
            cfg.user_id
          ].join(',') +
        ' FROM `account` WHERE `account`.`id`= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }

    function credit (accountId, bundle) {
      var sql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
        'SELECT ' +
          [
            sanitize.escape(uuid()),
            cfg.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + transactionDate + '\'', sanitize.escape(cfg.descrip)
          ].join(',') + ', `account`.`id`, ' +
          [
            Math.abs(bundle.solde), 0,
            Math.abs(bundle.solde), 0,
            bundle.currency_id
          ].join(',') +
          ', null, null, ' +
          [
            'null',
            cfg.originId,
            user_id
          ].join(',') +
        ' FROM `account` WHERE `account`.`id`= ' + sanitize.escape(accountId)+';';
      return db.exec(sql);
    }
  }

}

function handleIntegration (id, user_id, done) {
  var references, dayExchange, cfg = {};

  var sql = 'SELECT `purchase`.`uuid`, `purchase`.`creditor_uuid` , `purchase`.`cost`, `purchase`.`currency_id`, `purchase`.`project_id`,' +
            ' `purchase`.`purchaser_id`, `purchase`.`emitter_id`, ' +
            ' `purchase_item`.`inventory_uuid`, `purchase_item`.`total` FROM' +
            ' `purchase`, `purchase_item` WHERE' +
            ' `purchase`.`uuid` = `purchase_item`.`purchase_uuid` AND' +
            ' `purchase`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(get.date());
    return q([get.origin('confirm_integration'), get.period(get.date())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return get.transactionId(references[0].project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'Confirm Integration/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT '+
                    [
                      sanitize.escape(uuid()),
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\''
                    ].join(',') + ', `inventory_group`.`stock_account`, '+
                    [
                      0, reference.total.toFixed(4),
                      0, reference.total.toFixed(4),
                      reference.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        var sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
          'SELECT ' +
            [
              sanitize.escape(uuid()),
              reference.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + get.date() + '\'', '\'' + cfg.descrip + '\''
            ].join(',') + ', `inventory_group`.`cogs_account`, ' +
            [
              reference.total.toFixed(4),0,
              reference.total.toFixed(4),0,
              reference.currency_id,
              sanitize.escape(reference.inventory_uuid)
            ].join(',') + ', null, ' +
            [
              sanitize.escape(reference.uuid),
              cfg.originId,
              user_id
            ].join(',') + ' FROM `inventory_group` WHERE `inventory_group`.`uuid`=' +
            '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }
}

function handleExtraPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  console.info(details, id, user_id);

  sql =
    'SELECT `g`.`account_id` ' +
    'FROM `sale` ' +
    'JOIN `debitor` AS `d` ON `d`.`uuid` = `sale`.`debitor_uuid` ' +
    'JOIN `debitor_group` AS `g` ON `g`.`uuid` = `d`.`group_uuid` ' +
    'WHERE `sale`.`uuid` = ' + sanitize.escape(details.sale_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    details.cost = parseFloat(details.cost);
    console.info(reference);
    var date = util.toMysqlDate(get.date());
    return q([get.origin('journal'), get.period(get.date()), get.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(details.currency_id).rate;
    return get.transactionId(details.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Extra_Payment/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          details.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), details.wait_account
        ].join(',') + ', ' +
        [
          0, (details.cost).toFixed(4),
          0, (details.cost / rate).toFixed(4),
          details.currency_id,
          sanitize.escape(details.debitor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(details.sale_uuid),
          cfg.originId,
          details.user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          details.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + get.date() + '\'', sanitize.escape(cfg.descrip), reference.account_id
        ].join(',') + ', ' +
        [
          details.cost.toFixed(4), 0,
          (details.cost / rate).toFixed(4), 0,
          details.currency_id,
          sanitize.escape(details.debitor_uuid),
        ].join(',') + ', \'D\', ' + [sanitize.escape(details.sale_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

tableRouter = {
  'sale'                    : handleSales,
  'cash'                    : handleCash,
  // 'purchase'                : handlePurchase,
  'group_invoice'           : handleGroupInvoice,
  'employee_invoice'        : handleEmployeeInvoice,
  'credit_note'             : handleCreditNote,
  'cash_discard'            : handleCashDiscard,
  'caution'                 : handleCaution,
  'transfert'               : handleTransfert,
  'pcash_convention'        : handleConvention,
  'pcash_employee'          : handleEmployee,
  'primary_expense'         : handleGenericExpense,
  'primary_income'          : handleGenericIncome,
  'indirect_purchase'       : handleIndirectPurchase,
  'confirm'                 : handleConfirm,
  'confirm_direct_purchase' : handleConfirmDirectPurchase,
  'distribution_patient'    : handleDistributionPatient,
  'distribution_service'    : handleDistributionService,
  'consumption_loss'        : handleDistributionLoss,
  'payroll'                 : handlePayroll,
  'salary_payment'          : handleSalaryPayment,
  'promesse_payment'        : handlePromessePayment,
  'promesse_cotisation'     : handlePromesseCotisation,
  'promesse_tax'            : handlePromesseTax,
  'donation'                : handleDonation,
  'tax_payment'             : handleTaxPayment,
  'cotisation_payment'      : handleCotisationPayment,
  'salary_advance'          : handleSalaryAdvance,
  'create_fiscal_year'      : handleCreateFiscalYear,
  'reversing_stock'         : handleReversingStock,
  'cash_return'             : handleCashReturn,
  'advance_paiment'         : handleAdvancePaiment,
  'cancel_support'          : handleCancelSupport,
  'fiscal_year_resultat'    : handleFiscalYearResultat,
  'confirm_integration'     : handleIntegration,
  'extra_payment'           : handleExtraPayment
};


function request (table, id, user_id, done, debCaution, details) {
  // handles all requests coming from the client
  if (debCaution >= 0) {
    tableRouter[table](id, user_id, done, debCaution);
  }else if(details) {
    tableRouter[table](id, user_id, details, done);
  }else {
    tableRouter[table](id, user_id, done);
  }
  return;
}

module.exports = {
  request : request,
  lookupTable : lookupTable
};
