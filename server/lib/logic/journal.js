// scripts/lib/logic/journal.js

var sanitize = require('../util/sanitize'),
    util = require('../util/util'),
    validate = require('../util/validate')(),
    Store = require('../util/store'),
    q = require('q'),
    uuid = require('../util/guid');

module.exports = function (db, synthetic) {
  'use strict';

  var table_router, check, get;

  // validity checks
  check = {
    validPeriod : function (enterprise_id, date) {
      var escaped_date, sql;
      escaped_date = sanitize.escape(get.date(date));
      sql =
        'SELECT `period`.`id`, `fiscal_year_id` ' +
        'FROM `period` ' +
        'WHERE `period`.`period_start` <=' + escaped_date + ' AND ' +
          '`period`.`period_stop` >=' + escaped_date + ' AND ' +
          '`period`.`locked` = 0;\n';
      return db.exec(sql)
      .then(function (rows) {
        if (rows.length === 0) {
          throw new Error('No period found to match the posted date : ' + date);
        }
        return q(rows);
      });
    },

    validDebitorOrCreditor : function (id, errback) {
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
      var sql =
        'SELECT abbr, max(increment) AS increment FROM (' +
          'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
          'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
          'WHERE project_id = ' + project_id + ' ' +
          'UNION ' +
          'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
          'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
          'WHERE project_id = ' + project_id + ')c;';

      return db.exec(sql)
      .then(function (rows) {
        var data = rows.pop();
        // catch a corner case where the posting journal has no data
        return q(data.increment ? '"' + data.abbr + data.increment + '"' : '"' + data.abbr + 1 + '"');
      });
    },

    date : function (date) {
      // returns a mysql-compatible date
      // Note : this transforms things into a date, not date + time
      if (date) {
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
        'SELECT `id`, `fiscal_year_id` FROM `period` ' +
        'WHERE `period_start` <= ' + sanitize.escape(get.date(date)) + ' AND ' +
          '`period_stop` >= ' + sanitize.escape(get.date(date)) + ';';

      return db.exec(sql)
      .then(function (rows) {
        if (rows.length === 0) {
          throw new Error('No period or fiscal year data for date: ' + date);
        }
        return q(rows.pop());
      });
    },

    myPeriod : function (date, done) {
      // gets the currency period from a mysql-compatible date.
      var sql =
        'SELECT `id`, `fiscal_year_id` FROM `period` ' +
        'WHERE `period_start` <= ' + sanitize.escape(date) + ' AND ' +
        ' `period_stop` >= ' + sanitize.escape(date) + ';';

      db.execute(sql, function (err, rows) {
        if (err) return done(err);
        if (rows.length === 0) return done(new Error('No period or fiscal year data for date: ' + date));
        return done(null, { period_id :rows[0].id, fiscal_year_id : rows[0].fiscal_year_id });
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

  function buildCautionQueries (reference, queries) {
  }

  // TODO Only has project ID passed from sale reference, need to look up enterprise ID
  function handleSales (id, user_id, done, caution) {
    // sale posting requests enter here.
    var sql, data, reference, cfg = {}, queries = {};

    sql =
      'SELECT `sale`.`project_id`, `project`.`enterprise_id`, `sale`.`uuid`, `sale`.`currency_id`, ' +
        '`sale`.`debitor_uuid`, `sale`.`seller_id`, `sale`.`discount`, `sale`.`invoice_date`, ' +
        '`sale`.`cost`, `sale`.`note`, `sale_item`.`uuid` as `item_uuid`, `sale_item`.`transaction_price`, `sale_item`.`debit`, ' +
        '`sale_item`.`credit`, `sale_item`.`quantity`, `inventory`.`group_uuid` ' +
      'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `project` ON ' +
        '`sale`.`uuid`=`sale_item`.`sale_uuid` AND ' +
        '`sale`.`project_id`=`project`.`id` AND ' +
        '`sale_item`.`inventory_uuid`=`inventory`.`uuid` ' +
      'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ' ' +
      'ORDER BY `sale_item`.`credit`;';

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
      // we now have the origin!
      // we now have the relevant period!

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
      queries.sale =
        'INSERT INTO `posting_journal` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
          '`sale`.`note`, `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
          '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
        'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
          '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
        'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';

      // Then copy data from SALE_ITEMS -> JOURNAL
      // This query is significantly more complex because sale_item
      // contains both debits and credits.
      queries.items = [];

      data.forEach(function (item) {
        var sql =
          'INSERT INTO `posting_journal` ' +
            '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
            '`sale`.`note`, `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
            '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
            ' null, `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
          'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
            '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
            '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
          'WHERE `sale_item`.`uuid` = ' + sanitize.escape(item.item_uuid) + ';';
        queries.items.push(sql);
      });

      // now we must set all relevant rows from sale to "posted"
      queries.sale_posted =
        'UPDATE `sale` SET `sale`.`posted`=1 WHERE `sale`.`uuid` = ' + sanitize.escape(id);

      return q.all(queries.items.map(function (sql) {
        return db.exec(sql);
      }));
    })
    .then(function () {
      return db.exec(queries.sale);
    })
    .then(function () {
      return q([ db.exec(queries.sale_posted), get.transactionId(reference.project_id)]);
    })
    .spread(function (rows, transId) {

      if (caution !== 0) {
        var descript = 'CAD/' + reference.debitor_uuid + '/' + get.date();
        var transAmount = caution - reference.cost > 0 ? reference.cost : caution;
        queries.cautionDebiting =
          'INSERT INTO posting_journal '+
            '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
            'SELECT ' + ['"' + uuid() + '"', reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', '\''+descript+'\''].join(',') + ', ' +
              '`caution_box_account_currency`.`account_id`, ' +
              [0, transAmount, 0, transAmount, reference.currency_id, '\''+reference.debitor_uuid+'\''].join(',') +
              ', \'D\', ' + ['\''+reference.uuid+'\'', cfg.originId, user_id].join(',') + ' ' +
            'FROM `caution_box_account_currency` WHERE `caution_box_account_currency`.`currency_id`='+reference.currency_id+
            ' AND `caution_box_account_currency`.`caution_box_id`= (SELECT distinct `caution_box`.`id` FROM `caution_box` WHERE `caution_box`.`project_id`='+ reference.project_id +');';

        queries.DebitorCrediting =
        'INSERT INTO `posting_journal` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
          '`sale`.`note`, `debitor_group`.`account_id`, 0, '+transAmount+', 0,'+transAmount+', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
          '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
        'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
          '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
        'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';

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
      done(err);
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
      "SELECT c.uuid, c.date, c.cost, c.currency_id, sum(p.debit_equiv - p.credit_equiv) AS balance, cu.min_monentary_unit " +
      "FROM cash AS c JOIN cash_item AS ci JOIN currency as cu JOIN sale AS s JOIN " +
        "(SELECT credit_equiv, debit_equiv, account_id, inv_po_id, deb_cred_uuid FROM posting_journal " +
        "UNION " +
        "SELECT credit_equiv, debit_equiv, account_id, inv_po_id, deb_cred_uuid FROM general_ledger) AS p " +
      "JOIN debitor AS d JOIN debitor_group as dg " +
      "ON c.uuid = ci.cash_uuid AND c.currency_id = cu.id AND ci.invoice_uuid = s.uuid AND ci.invoice_uuid = p.inv_po_id AND p.deb_cred_uuid = s.debitor_uuid " +
      "AND  p.account_id = dg.account_id " +
      "AND d.uuid = s.debitor_uuid AND d.group_uuid = dg.uuid WHERE c.uuid = " + sanitize.escape(cash_id) + " " +
      "GROUP BY c.uuid;";

    return db.exec(sql)
    .then(function (rows) {
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
    // TODO: refactor this into one "state" object
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
          '`cash`.`description`, `cash`.`document_id`, `cash`.`' + account_type + '`, ' + money +
          'null, `cash`.`currency_id`, null, null, ' +
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

        // FIXME: Currently hardcoding 534 `OPERATION DE CHANGE` account as the
        // rounding account
        state.creditOrDebitBool = state.remainder > 0;
        state.roundedRemainder = precision(Math.abs(state.remainder), 4);
        var creditOrDebit = state.creditOrDebitBool ?
          [state.roundedRemainder, 0, state.roundedRemainder, 0].join(', ') :  // debit
          [0, state.roundedRemainder, 0, state.roundedRemainder].join(', ') ;   // credit

        var description =
          "'Rounding correction on exchange rate data for " + state.id + "'";

        state.roundingUUID = uuid();

        query=
          'INSERT INTO `posting_journal` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT `cash`.`project_id`, ' + [sanitize.escape(state.roundingUUID), state.period.fiscal_year_id, state.period.id, state.transId, '\'' + get.date() + '\''].join(', ') + ', ' +
          description + ', `cash`.`document_id`, ' + 534  + ', ' + creditOrDebit + ', ' +
          '`cash`.`currency_id`, null, null, `cash_item`.`invoice_uuid`, ' +
          [state.originId, state.userId].join(', ') + ' ' +
        'FROM `cash` JOIN `cash_item` ON `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
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
          "'Rounding correction on exchange rate data for " + id + "'";

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
        "DELETE FROM `posting_journal` WHERE `uuid` IN (" + ids.join(', ') + ");";

      if (!ids.length) { return done(error); }

      db.exec(sql)
      .then(function () {
        done(error);
      })
      .catch(function (err) {
        done(error);
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
      if (!costPositive) throw new Error('Negative cost detected for purchase id: ' + id);

      // third check - are all the unit_price's for purchase_items positive?
      var unit_pricePositive = data.every(function (row) { return validate.isPositive(row.unit_price); });
      if (!unit_pricePositive) throw new Error('Negative unit_price for purchase id: ' + id);

      // fourth check - is the total the price * the quantity?
      var totalEquality = data.every(function (row) { return validate.isEqual(row.total, row.unit_price * row.quantity); });
      if (!totalEquality) throw new Error('Unit prices and quantities do not match for purchase id: ' + id);

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
        'WHERE `purchase`.`id`=' + sanitize.escape(id) + ';';

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
    var sql =
      'SELECT `group_invoice`.`id`, `group_invoice`.`project_id`, `project`.`enterprise_id`, `group_invoice`.`debitor_uuid`,  ' +
      '  `group_invoice`.`note`, `group_invoice`.`authorized_by`, `group_invoice`.`date`, ' +
      '  `group_invoice`.`total`, `group_invoice_item`.`invoice_uuid`, `group_invoice_item`.`cost`, ' +
      '  `group_invoice_item`.`id` as `gid` ' +
      'FROM `group_invoice` JOIN `group_invoice_item` JOIN `sale` JOIN `project` ' +
      '  ON `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
      '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
      '  `project`.`id` = `group_invoice`.`project_id` ' +
      'WHERE `group_invoice`.`id`=' + sanitize.escape(id) + ';';

    db.execute(sql, function (err, results) {
      if (err) return done(err);
      if (results.length === 0) {
        return done(new Error('No invoice by the id: ' + id));
      }

      var reference_invoice = results[0];
      var enterprise_id = reference_invoice.enterprise_id;
      var project_id = reference_invoice.project_id;
      var date = reference_invoice.invoice_date;

      // first check - do we have a validPeriod?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) { done(err); }

        // second check - is the cost positive for every transaction?
        var costPositive = results.every(function (row) {
          return validate.isPositive(row.cost);
        });
        if (!costPositive) {
          return done(new Error('Negative cost detected for invoice id: ' + id));
        }

        // third check - is the total the price * the quantity?
        var sum = 0;
        results.forEach(function (i) { sum += i.cost; });
        var totalEquality = validate.isEqual(reference_invoice.total, sum);
        if (!totalEquality)
          return done(new Error('Individual costs do not match total cost for invoice id: ' + id));

        // all checks have passed - prepare for writing to the journal.
        get.origin('group_invoice', function (err, originId) {
          if (err) return done(err);
          // we now have the origin!

          get.period(date, function (err, periodObject) {
            if (err) return done(err);

            // we now have the relevant period!

            // NOTE : Since with group_invoice, it is desirable
            // to create on transaction per payment of an invoice.
            // For this reason, we must call get.transactionId()
            // multiple times.  Another way of doing this is simply
            // calculating the trans_ids ahead of time, then incrementing
            // through them.  This is dangerous. FIXME.

            // create a trans_id for the transaction
            // MUST BE THE LAST REQUEST TO prevent race conditions.
            get.transactionId(project_id, function (err, trans_id) {
              if (err) return done(err);

              var period_id = periodObject.id;
              var fiscal_year_id = periodObject.fiscal_year_id;

              // process all
              var promise = results.map(function (row, idx) {
                var defer = q.defer();
                var t_id = idx + trans_id;

                // debiting the convention
                var debit_sql=
                  'INSERT INTO `posting_journal` ' +
                  '  (`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '  `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '  `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `group_invoice`.`project_id`, ' +
                    [fiscal_year_id, period_id, t_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '  `group_invoice`.`note`, `debitor_group`.`account_id`, `group_invoice_item`.`cost`, ' +
                  '  0, `group_invoice_item`.`cost`, 0, `enterprise`.`currency_id`, ' +
                  '  null, null, `group_invoice_item`.`invoice_uuid`, ' +
                  [originId, user_id].join(', ') + ' ' +
                  'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
                  '  `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
                  '  `group_invoice`.`group_uuid` = `debitor_group`.`uuid`  AND ' +
                  '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
                  '  `group_invoice`.`project_id` = `project`.`id` AND ' +
                  '  `project`.`enterprise_id` = `enterprise`.`id` ' +
                  'WHERE `group_invoice_item`.`id` = ' + sanitize.escape(row.gid);

                // crediting the debitor
                var credit_sql=
                  'INSERT INTO `posting_journal` ' +
                  '  (`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '  `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '  `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `group_invoice`.`project_id`, ' +
                    [fiscal_year_id, period_id, t_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '  `group_invoice`.`note`, `debitor_group`.`account_id`, 0, `group_invoice_item`.`cost`, ' +
                  '  0, `group_invoice_item`.`cost`, `enterprise`.`currency_id`,  ' +
                  '  `group_invoice`.`debitor_uuid`, \'D\', `group_invoice_item`.`invoice_uuid`, ' +
                  [originId, user_id].join(', ') + ' ' +
                  'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
                  '  `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
                  '  `group_invoice`.`debitor_uuid` = `debitor`.`uuid`  AND ' +
                  '  `debitor`.`group_uuid` = `debitor_group`.`uuid` AND ' +
                  '  `group_invoice_item`.`invoice_uuid` = `sale`.`uuid` AND ' +
                  '  `group_invoice`.`project_id` = `project`.`id` AND ' +
                  '  `project`.`enterprise_id` = `enterprise`.`id` ' +
                  'WHERE `group_invoice_item`.`id` = ' + sanitize.escape(row.gid);

                db.execute(debit_sql, function (err, rows) {
                  if (err) defer.reject(err);

                  db.execute(credit_sql, function (err, rows) {
                    if (err) defer.reject(err);
                    defer.resolve(rows);
                  });
                });
                return defer.promise;
              });


              q.all(promise)
              .then(function (rows) {
                return done(null, rows);
              }, function (err) {
                return done(err);
              });
            });
          });
        });
      });
    });
  }

  function handleCreditNote (id, user_id, done) {
    var sql, data, reference, cfg = {}, queries = {};

    sql =
      'SELECT `credit_note`.`project_id`, `project`.`enterprise_id`, `cost`, `debitor_uuid`, `note_date`, `credit_note`.`sale_uuid`, ' +
        ' `description`, `note_date`, `inventory_uuid`, `quantity`, `sale_item`.`uuid` as `item_uuid`, ' +
        '`transaction_price`, `debit`, `credit`' +
      'FROM `credit_note` JOIN `sale_item` JOIN `inventory` JOIN `inventory_unit` JOIN `project` ' +
        'ON `credit_note`.`sale_uuid`=`sale_item`.`sale_uuid` AND ' +
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
      var reviewLegacyNotes = "SELECT uuid FROM credit_note WHERE sale_uuid=" + sanitize.escape(reference.sale_uuid) + ";";
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
      function sum (a, b) {
        return a + (b.credit - b.debit);
      }

      var total = data.reduce(sum, 0);
      //console.log('[DEBUG] sum', total, 'cost', reference_note.cost);
      var totalEquality = validate.isEqual(total, reference.cost);
      //if (!totalEquality) {
        //console.log('[DEBUG] ', 'sum of costs is not equal to the total');
        //return done(new Error('Individual costs do not match total cost for invoice id: ' + id));
      //}

      // all checks have passed - prepare for writing to the journal.
      return q([ get.origin('credit_note'), get.period(reference.note_date) ]);

    })
    .spread(function (originId, periodObject) {
      // we now have the origin!
      // we now have the relevant period!
      cfg.originId = originId;
      cfg.periodId = periodObject.id; // TODO : change this to camelcase
      cfg.fiscalYearId = periodObject.fiscal_year_id;

      return get.transactionId(reference.project_id);
    })
    .then(function (transId) {
      queries.debtor =
        'INSERT INTO `posting_journal` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
          '"' + reference.description + '", `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' +
          '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
        'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
          '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
        'WHERE `sale`.`uuid`=' + sanitize.escape(reference.sale_uuid) + ';';

      // Credit debtor (basically the reverse of a sale)

      queries.items = [];
      data.forEach(function (item) {
        // Debit sale items
        // var itemSql =
        // 'INSERT INTO `posting_journal` ' +
        //   '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        //   '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        //   '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        // 'SELECT `sale`.`project_id`, ' + [fiscalYearId, periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
        //   '"' + reference_note.description + '", `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
        //   '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
        //   ' null, `sale`.`uuid`, ' + [originId, user_id].join(', ') + ' ' +
        // 'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
        //   '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
        //   '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
        // 'WHERE `sale`.`uuid`=' + sanitize.escape(reference.sale_uuid) + ';';

        var itemSql =
          'INSERT INTO `posting_journal` ' +
            '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
            '"' + reference.description + '", `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
            '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
            ' null, `sale`.`uuid`, ' + [cfg.originId, user_id].join(', ') + ' ' +
          'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
            '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
            '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
          'WHERE `sale_item`.`uuid`=' + sanitize.escape(item.item_uuid) + ';';

        queries.items.push(itemSql);
      });

      return db.exec(queries.debtor);
    })
    .then(function () {
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

  function handleCaution(id, user_id, done) {
    var sql, data, reference, cfg = {}, queries = {};

    sql =
      "SELECT `caution`.`project_id`, `caution`.`value`, `caution`.`date`, `caution`.`debitor_uuid`, `caution`.`currency_id`, `caution`.`user_id`, `caution`.`description`, `caution`.`cash_box_id` "+
      "FROM `caution` WHERE `caution`.`uuid` = " + sanitize.escape(id) + ";";

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
      cfg.credit_equiv = (1/dailyExchange.rate) * reference.value;

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
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
        'SELECT ' + [reference.project_id, sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'','\''+reference.description + '\''].join(', ') +
          ', `caution_box_account_currency`.`account_id`, ' + [reference.value, 0, cfg.credit_equiv, cfg.debit_equiv, reference.currency_id, '\''+reference.debitor_uuid+'\''].join(', ') +
          ', \'D\', '+['\''+id+'\'', cfg.originId, user_id].join(', ')+' '+
        'FROM `caution_box_account_currency`, `caution_box` WHERE `caution_box`.`id` =`caution_box_account_currency`.`caution_box_id` AND `caution_box_account_currency`.`currency_id`='+reference.currency_id+
        ' AND `caution_box`.`project_id`='+reference.project_id;

      queries.debitingRequest =
        'INSERT INTO posting_journal '+
        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
        'SELECT ' + [reference.project_id, sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', '\''+reference.description+'\''].join(',') +
          ', `cash_box_account_currency`.`account_id`, ' + [0, reference.value, cfg.debit_equiv, cfg.credit_equiv, reference.currency_id].join(',') +
          ', null, null, ' + ['\''+id+'\'', cfg.originId, user_id].join(', ') + ' ' +
        'FROM `cash_box_account_currency`, `cash_box` WHERE `cash_box`.`id` =`cash_box_account_currency`.`cash_box_id` AND `cash_box_account_currency`.`currency_id`='+reference.currency_id+
        ' AND `cash_box_account_currency`.`cash_box_id`='+reference.cash_box_id+' AND `cash_box`.`project_id`='+reference.project_id;

      return db.exec(queries.creditingRequest);
    })
    .then(function () {
      return db.exec(queries.debitingRequest);
    })
    .then(function (rows) {
      done(null, rows);
    })
    .catch(function (err) {
      var discard = "DELETE FROM caution WHERE uuid = " + sanitize.escape(id) + ";";
      return db.exec(discard)
      .done(function () {
        done(err);
      });
    })
    .done();
  }

  function handleTransfert (id, user_id, done) {
    var sql, data, reference, cfg = {}, queries = {};

    // TODO : Formalize this
    sql = "SELECT * FROM `primary_cash` WHERE `primary_cash`.`uuid` = " + sanitize.escape(id) + ";";

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

      return q([get.origin('pcash'), get.period(reference.date)]); // should be get.origin(pcash_transfert);
    })
    .spread(function (originId, periodObject) {
      cfg.originId = originId;
      cfg.periodId = periodObject.id;
      cfg.fiscalYearId = periodObject.fiscal_year_id;

      return get.transactionId(reference.project_id);
    })
    .then(function (transId) {
      var descrip =  'PCT/'+new Date().toISOString().slice(0, 10).toString();
      queries.credit =
        'INSERT INTO posting_journal (`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
          'VALUES (' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', '\''+descrip+'\'', reference.account_id].join(',') + ', ' +
          [ reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id ].join(',')+', null, null, '+[sanitize.escape(id), cfg.originId, user_id].join(',') +
        ');';

      queries.debit =
        'INSERT INTO posting_journal '+
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'SELECT ' + [ sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', '\''+descrip+'\''].join(',') +
          ', `account_id`, ' + [0, reference.cost, 0, cfg.valueExchanged, reference.currency_id ].join(',')+', null, null, ' +
          [sanitize.escape(id), cfg.originId, user_id].join(',') + ' ' +
          'FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`='+sanitize.escape(reference.cash_box_id) + ' ' +
            'AND `cash_box_account_currency`.`currency_id`='+sanitize.escape(reference.currency_id);
      return db.exec(queries.credit);
    })
    .then(function () {
      return db.exec(queries.debit);
    })
    .then(function (rows) {
      done(null, rows);
    })
    .catch(function (err) {
      console.error('[DEBUG] [ERROR]', err);
      var discard = "DELETE FROM primary_cash WHERE uuid = " + sanitize.escape(id) + ";";
      return db.exec(discard)
      .then(function () {
        done(err);
      });
    })
    .done();
  }

  function handlePcashConvention (id, user_id, done) {
    var sql, data, reference, cfg = {}, queries = {};

    sql =
      "SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, " +
        "`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, " +
        "`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` " +
      "FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` " +
      "WHERE `primary_cash`.`uuid` = " + sanitize.escape(id) + ";";

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
      cfg.dailyExchange = exchangeRateStore.get(reference.currency_id);

      return q([get.origin('primary_cash'), get.period(reference.date)]);
    })
    .spread(function (originId, periodObject) {
      cfg.originId = originId;
      cfg.periodId = periodObject.id;
      cfg.fiscalYearId = periodObject.fiscal_year_id;

      return get.transactionId(reference.project_id);
    })
    .then(function (transId) {
      var descrip =  'COVP/'+new Date().toISOString().slice(0, 10).toString();

      queries.items = [];

      reference.forEach(function (item) {
        var valueExchanged, sql;
        valueExchanged = parseFloat((1 / cfg.dailyExchange.rate) * item.debit).toFixed(4);
        sql =
          'INSERT INTO posting_journal (`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
          'SELECT ' + [sanitize.escape(uuid()), reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, '\''+get.date()+'\'', '\''+descrip+'\''].join(',') +', ' +
            '`account_id`, ' + [0, item.debit, 0, valueExchanged, reference.currency_id].join(',')+', null, null, ' +
            [sanitize.escape(item.inv_po_id), cfg.originId, user_id].join(',') + ' ' +
          'FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`=' + sanitize.escape(reference.cash_box_id) + ' ' +
            'AND `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ";";
        queries.items.push(sql);
      });

      return q.all(queries.items.map(function (query) {
        return db.exec(query);
      }));
    })
    .catch(function (err) {
      var discard =
        "DELETE FROM primary_cash WHERE uuid= " + sanitize.escape(id);
      return db.exec(discard)
      .done(function () {
        done(err);
      });
    })
    .done();
  }

  // router for incoming requests
  table_router = {
    'sale'              : handleSales,
    'cash'              : handleCash,
    'purchase'          : handlePurchase,
    'group_invoice'     : handleGroupInvoice,
    'credit_note'       : handleCreditNote,
    'caution'           : handleCaution,
    'transfert'         : handleTransfert,
    'pcash_convention'  : handlePcashConvention
  };

  function request (table, id, user_id, done, debCaution) {
    // handles all requests coming from the client
    if (debCaution >= 0) {
      table_router[table](id, user_id, done, debCaution);
    }else{
      table_router[table](id, user_id, done);
    }
    return;
  }

  return { request : request };
};
