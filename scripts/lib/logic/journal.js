// scripts/lib/logic/journal.js

// TODO: dependency injection
var sanitize = require('../util/sanitize'),
    util = require('../util/util'),
    validate = require('../util/validate')(),
    Store = require('../util/store'),
    q = require('q'),
    uuid = require('../util/guid');

module.exports = function (db, synthetic) {
  // deals in everything journal related
  'use strict';

  var table_router, check, get;

  function validDebitorOrCreditor (id) {
    var escaped_id = sanitize.escape(id);
    var sql =
      'SELECT `temp`.`uuid` ' +
      'FROM (' +
        'SELECT `debitor`.`uuid` FROM `debitor` WHERE `uuid`=' + escaped_id + ' ' +
      'UNION ' +
        'SELECT `creditor`.`uuid` FROM `creditor` WHERE `uuid`=' + escaped_id +
      ') as `temp`;';

    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No Debitor or Creditor found with id: ' + id);
      }
    });
  }

  function getOrigin (table) {
    var query =
      'SELECT `id`, `service_txt` FROM `transaction_type` ' +
      'WHERE `service_txt`=' + sanitize.escape(table) + ';';
    return db.exec(query)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('Cannot find origin for transaction type : ' + table);
      }
      return q(rows.pop().id);
    });
  }

  function getPeriod (date) {
    var sql =
      'SELECT `id`, `fiscal_year_id` FROM `period` ' +
      'WHERE `period_start` <= ' + sanitize.escape(get.date(date)) + ' AND ' +
      ' `period_stop` >= ' + sanitize.escape(get.date(date)) + ';';

    return db.exec(sql)
    .then(function (rows) {
      if (rows.length === 0) {
        throw new Error('No period or fiscal year data for date: ' + date);
      }
      return q(rows.pop());
    });
  }

  function getTransactionId (project_id) {
    var query =
      'SELECT abbr, max(increment) AS increment FROM (' +
        'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
        'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
        'WHERE project_id = ' + project_id + ' ' +
        'UNION ' +
        'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
        'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
        'WHERE project_id = ' + project_id + ')c;';

    return db.exec(query)
    .then(function (rows) {
      var data = rows.pop();
      // catch a corner case where the posting journal has no data
      return q(data.increment ? '"' + data.abbr + data.increment + '"' : '"' + data.abbr + 1 + '"');
    });
  }

  function validPeriod(enteprise_id, date) {
    var escaped_date = sanitize.escape(get.date(date));
    var sql =
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
    });
  }

  // validity checks
  check = {
    validPeriod : function (enterprise_id, date, errback) {
      var escaped_date = sanitize.escape(get.date(date));
      var sql =
        'SELECT `period`.`id`, `fiscal_year_id` ' +
        'FROM `period` ' +
        'WHERE `period`.`period_start` <=' + escaped_date + ' AND ' +
          '`period`.`period_stop` >=' + escaped_date + ' AND ' +
          '`period`.`locked` = 0;\n';
      db.execute(sql, function (err, rows) {
        if (err) return errback(err);
        if (rows.length === 0)
          return errback(new Error('No period found to match the posted date : ' + date));
        return errback(null);
      });
    },

    validDebitorOrCreditor : function (id, errback) {
      // NOTE: This is NOT STRICT. It may find a debitor when a creditor was
      // requested, or vice versa.  This is fine for the checks here, but not
      // for posting to the general ledger.
      var escaped_id = sanitize.escape(id);
      var sql =
        'SELECT `uuid` ' +
        'FROM (' +
          'SELECT `debitor`.`uuid` FROM `debitor` WHERE `uuid`=' + escaped_id + ' ' +
        'UNION ' +
          'SELECT `creditor`.`uuid` FROM `creditor` WHERE `uuid`=' + escaped_id +
        ')c;';
      db.execute(sql, function (err, rows) {
        if (err) return errback(err);
        if (rows.length === 0) return errback(new Error('No Debitor or Creditor found with id: ' + id));
        return errback(null);
      });
    }
  };

  // utility functions shared by multiple queries
  get = {
    origin : function (table, done) {
      // uses the transaction_type table to derive an origin_id
      // to post to the journal.  Returns the id.
      var query =
        'SELECT `id`, `service_txt` FROM `transaction_type` WHERE `service_txt`='+sanitize.escape(table)+';';
      db.execute(query, function (err, rows) {
        if (err) return done(err);
        if (rows.length === 0)
          return done(new Error('Cannot find origin for transaction type : ' + table));
        return done(null, rows[0].id);
      });
    },

    transactionId : function (project_id, done) {
      // get a new transaction id from the journal.
      // make sure it is the last thing fired in the
      // call stack before posting.
      var query =
        'SELECT abbr, max(increment) AS increment FROM (' +
          'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
          'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
          'WHERE project_id = ' + project_id + ' ' +
          'UNION ' +
          'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
          'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
          'WHERE project_id = ' + project_id + ')c;';

      db.execute(query, function (err, rows) {
        if (err) return done(err);
        var data = rows.pop();
        return done(null, data.increment ? '"' + data.abbr + data.increment + '"' : '"' + data.abbr + 1 + '"');
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
      }
      else return new Date().toISOString().slice(0,10);
    },

    period : function (date, done) {
      // gets the currency period from a mysql-compatible date.
      var sql =
        'SELECT `id`, `fiscal_year_id` FROM `period` ' +
        'WHERE `period_start` <= ' + sanitize.escape(get.date(date)) + ' AND ' +
        ' `period_stop` >= ' + sanitize.escape(get.date(date)) + ';';

      db.execute(sql, function (err, rows) {
        if (err) return done(err);
        if (rows.length === 0) return done(new Error('No period or fiscal year data for date: ' + date));
        return done(null, { period_id :rows[0].id, fiscal_year_id : rows[0].fiscal_year_id });
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
      var sql, defer = q.defer();

      sql =
        'SELECT `enterprise_currency_id`, `foreign_currency_id`, `rate`, ' +
          '`min_monentary_unit` ' +
        'FROM `exchange_rate` JOIN `currency` ON `exchange_rate`.`foreign_currency_id` = `currency`.`id` ' +
        'WHERE `exchange_rate`.`date`=\'' + this.date(date) + '\';';

      db.exec(sql)
      .then(function (rows) {
        if (rows.length === 0) { defer.reject(new Error('No exchange rate found for date : ' + date)); }

        var store = new Store();
        rows.forEach(function (line) {
          store.post({ id : line.foreign_currency_id, rate : line.rate });
          store.post({ id : line.enterprise_currency_id, rate : 1});
        });
        defer.resolve(store);
      })
      .catch(function (err) {
        defer.reject(err);
      });

      return defer.promise;
    },

    myExchangeRate : function (date) {
      // expects a mysql-compatible date
      var defer = q.defer(),
        sql =
        'SELECT `enterprise_currency_id`, `foreign_currency_id`, `rate`, ' +
          '`min_monentary_unit` ' +
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
    },

    getCashCurrencyId : function (array, account_id){
      return array.filter(function (item){
        return item.cash_account === account_id;
      });

    }
  };

  function authorize (user_id, done) {
    // TODO : This is a placeholder until we find out how to allow
    // users to post.  It is a permissions issue.
    db.execute('SELECT 1+1 AS ans;', function (err, results) {
      if (err) return done(err);
      return done(null, results);
    });
  }

  // TODO Only has project ID passed from sale reference, need to look up enterprise ID
  function handleSales (id, user_id, done, caution) {
    // sale posting requests enter here.
    var sql =
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

    db.execute(sql, function (err, results) {
      if (err) return done(err, null);
      if (results.length === 0) { return done(new Error('No sale by the id: ' + id)); }

      var allItems = results;

      var reference_sale = results[0];
      var enterprise_id = reference_sale.enterprise_id;
      var project_id = reference_sale.project_id;
      var date = reference_sale.invoice_date;

      // first check - do we have a valid period?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) done(err, null);

        // second check - are the debits (discounts) positive
        // for every transaction item?
        var debitPositive = results.every(function (row) {
          return validate.isPositive(row.debit);
        });

        if (!debitPositive) {
          return done(new Error('Negative debit detected for sale id: ' + id));
        }

        // third check - are all the credits (revenue) positive
        // for every transaction item?
        var creditPositive = results.every(function (row) {
          return validate.isPositive(row.credit);
        });

        if (!creditPositive) {
          return done(new Error('Negative credit detected for sale id: ' + id));
        }

        // all checks have passed - prepare for writing to the journal.
        get.origin('sale', function (err, origin_id) {
          if (err) return done(err);
          // we now have the origin!

          get.period(date, function (err, period_object) {
            if (err) return done(err);

            // we now have the relevant period!

            // create a trans_id for the transaction
            // MUST BE THE LAST REQUEST TO prevent race conditions.
            get.transactionId(project_id, function (err, trans_id) {
              if (err) return done(err);

              var period_id = period_object.period_id;
              var fiscal_year_id = period_object.fiscal_year_id;
              var cautionDebitingQuery = null;
              var DebitorCreditingQuery = null;

              // we can begin copying data from SALE -> JOURNAL

              // First, copy the data from sale into the journal.
              // FIXME: this is unclear with get.date() which
              // returns a mysql-compatible date
              var sale_query =
                'INSERT INTO `posting_journal` ' +
                  '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`sale`.`note`, `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
                  '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
                  '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
                'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';

              // Then copy data from SALE_ITEMS -> JOURNAL
              // This query is significantly more complex because sale_item
              // contains both debits and credits.
              var item_queries = [];

              allItems.forEach(function (item) {
                var sql =
                  'INSERT INTO `posting_journal` ' +
                    '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                    '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                    '`sale`.`note`, `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
                    '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
                    ' null, `sale`.`uuid`, ' + [origin_id, user_id].join(', ') + ' ' +
                  'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
                    '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
                    '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
                  'WHERE `sale_item`.`uuid`=' + sanitize.escape(item.item_uuid) + ';';
                item_queries.push(sql);
              });

              // now we must set all relevant rows from sale to "posted"
              var sale_posted_query =
                'UPDATE `sale` SET `sale`.`posted`=1 WHERE `sale`.`uuid`='+sanitize.escape(id);

              function buildCautionQueries (nextTrans_id){
                //console.log('nex tran id est : ', nextTrans_id);

                var descript = 'CAD/'+reference_sale.debitor_uuid+'/'+get.date();
                var transAmount = ((caution - reference_sale.cost)>0)? reference_sale.cost : caution;
                cautionDebitingQuery =
                  'INSERT INTO posting_journal '+
                     '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                     '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                     '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                     'SELECT ' + ['"' + uuid() + '"', project_id, fiscal_year_id, period_id, nextTrans_id, '\''+get.date()+'\'', '\''+descript+'\''].join(',') + ', ' +
                      '`caution_box_account_currency`.`account_id`, ' +
                      [0, transAmount, 0, transAmount, reference_sale.currency_id, '\''+reference_sale.debitor_uuid+'\''].join(',') +
                      ', \'D\', ' + ['\''+reference_sale.uuid+'\'', origin_id, user_id].join(',') + ' ' +
                    'FROM `caution_box_account_currency` WHERE `caution_box_account_currency`.`currency_id`='+reference_sale.currency_id+
                    ' AND `caution_box_account_currency`.`caution_box_id`= (SELECT distinct `caution_box`.`id` FROM `caution_box` WHERE `caution_box`.`project_id`='+ project_id +');';

                DebitorCreditingQuery =
                'INSERT INTO `posting_journal` ' +
                  '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, nextTrans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`sale`.`note`, `debitor_group`.`account_id`, 0, '+transAmount+', 0,'+transAmount+', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
                  '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
                  '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
                'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';


              }

              q.all(item_queries.map(function (sql){
                return db.exec(sql);
              }))
              .then(function (){
                return db.exec(sale_query);
              })
              .then(function (){
                return q.all([db.exec(sale_posted_query), getTransactionId(reference_sale.project_id)]);
              })
              .then(function (resp){
                if (caution !== 0) {
                  //console.log('ID for transaction stuff', resp[1]);
                  buildCautionQueries(resp[1]);
                  return q.all([db.exec(cautionDebitingQuery), db.exec(DebitorCreditingQuery)]);
                } else {
                  return q();
                }
              })
              .then(function (res){
                done(null, res);
              })
              .catch(function (err){
                //console.log('&&&&&&&&&&&&&&&&&&&&&&& une erreure s\'est produite pas de sale');
                done(err);
              })
              .done();
            });
          });
        });
      });
    });
  }

  function precision(num, p) {
    return parseFloat(num.toFixed(p));
  }

  // handles rounding for cash
  function handleRounding(cash_id) {
    var sql, row;

    // find out what the current balance is on the invoice to find out if we are paying it all.
    /*
    sql =
      'SELECT c.uuid, c.date, c.cost, c.currency_id, sum(p.debit_equiv - p.credit_equiv) AS balance, cu.min_monentary_unit ' +
      'FROM cash AS c JOIN cash_item AS ci JOIN currency as cu JOIN sale AS s JOIN posting_journal AS p ' +
      'ON c.uuid = ci.cash_uuid AND c.currency_id = cu.id AND ci.invoice_uuid = s.uuid AND ci.invoice_uuid = p.inv_po_id ' +
      'WHERE c.uuid = ' + sanitize.escape(cash_id) + ' AND p.deb_cred_uuid = s.debitor_uuid GROUP BY c.uuid;';
    */

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

      return validPeriod(state.reference.enterprise_id, state.reference.date);
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

      return validPeriod(state.reference.enterprise_id, state.reference.date);
    })
    .then(function () {
      return validDebitorOrCreditor(state.reference.deb_cred_uuid);
    })
    .then(function () {
      return getOrigin('cash');
    })
    // TODO : collapse this code using Q.spread();
    .then(function (id) {
      state.originId = id;
      return getPeriod(state.reference.date);
    })
    .then(function (period) {
      state.period = period;
      return get.exchangeRate(state.reference.date);
    })
    .then(function (store) {
      state.store = store;
      return getTransactionId(state.reference.project_id);
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

        //FIXME: Currently hardcoding 534 `OPERATION DE CHANGE` account as the
        //rounding account

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
    var sql =
      'SELECT `purchase`.`project_id`, `project`.`enterprise_id`, `purchase`.`id`, `purchase`.`cost`, `purchase`.`currency_id`, ' +
        '`purchase`.`creditor_id`, `purchase`.`purchaser_id`, `purchase`.`discount`, `purchase`.`invoice_date`, ' +
        '`purchase`.`note`, `purchase`.`posted`, `purchase_item`.`unit_price`, `purchase_item`.`total`, `purchase_item`.`quantity` ' +
      'FROM `purchase` JOIN `purchase_item` JOIN `project` ON `purchase`.`id`=`purchase_item`.`purchase_id` AND `project`.`id`=`purchase`.`project_id` ' +
      'WHERE `purchase`.`id`=' + sanitize.escape(id) + ';';

    db.execute(sql, function (err, results) {
      if (err) return done(err);
      if (results.length === 0) return done(new Error('No purchase order by the id: ' + id));

      var reference_purchase= results[0];
      var enterprise_id = reference_purchase.enterprise_id;
      var project_id = reference_purchase.project_id;
      var date = reference_purchase.invoice_date;

      // first check - do we have a validPeriod?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) done(err);

        // second check - is the cost positive for every transaction?
        var costPositive = results.every(function (row) { return validate.isPositive(row.cost); });
        if (!costPositive) return done(new Error('Negative cost detected for purchase id: ' + id));

        // third check - are all the unit_price's for purchase_items positive?
        var unit_pricePositive = results.every(function (row) { return validate.isPositive(row.unit_price); });
        if (!unit_pricePositive) return done(new Error('Negative unit_price for purchase id: ' + id));

        // fourth check - is the total the price * the quantity?
        var totalEquality = results.every(function (row) { return validate.isEqual(row.total, row.unit_price * row.quantity); });
        if (!totalEquality) return done(new Error('Unit prices and quantities do not match for purchase id: ' + id));

        // all checks have passed - prepare for writing to the journal.
        get.origin('purchase', function (err, origin_id) {
          if (err) return done(err);
          // we now have the origin!

          get.period(date, function (err, period_object) {
            if (err) return done(err);

            // we now have the relevant period!

            // create a trans_id for the transaction
            // MUST BE THE LAST REQUEST TO undo race conditions.
            get.transactionId(project_id, function (err, trans_id) {
              if (err) return done(err);

              var period_id = period_object.period_id;
              var fiscal_year_id = period_object.fiscal_year_id;

              // we can begin copying data from PURCHASE -> JOURNAL

              // First, copy the data from purchase into the journal.
              var purchase_sql =
                'INSERT INTO `posting_journal` ' +
                  '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `purchase`.`project_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`purchase`.`note`, `creditor_group`.`account_id`, 0, `purchase`.`cost`, 0, `purchase`.`cost`, ' + // last four debit, credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
                  '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `purchase` JOIN `creditor` JOIN `creditor_group` ON ' +
                  '`purchase`.`creditor_id`=`creditor`.`id` AND `creditor_group`.`id`=`creditor`.`group_id` ' +
                'WHERE `purchase`.`id`=' + sanitize.escape(id);

              var purchase_item_sql =
                'INSERT INTO `posting_journal` ' +
                  '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `purchase`.`project_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`purchase`.`note`, `inventory_group`.`sales_account`, `purchase_item`.`total`, 0, `purchase_item`.`total`, 0, ' + // last three: credit, debit_equiv, credit_equiv
                  '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `purchase` JOIN `purchase_item` JOIN `inventory` JOIN `inventory_group` ON ' +
                  '`purchase_item`.`purchase_id`=`purchase`.`id` AND `purchase_item`.`inventory_id`=`inventory`.`id` AND ' +
                  '`inventory`.`group_id`=`inventory_group`.`id` ' +
                'WHERE `purchase`.`id`=' + sanitize.escape(id) + ';';

              db.execute(purchase_sql, function (err, rows) {
                if (err) return done(err);

                db.execute(purchase_item_sql, function (err, rows) {
                  if (err) return done(err);
                  // Finally, we can update purchase
                  var sql = 'UPDATE `purchase` SET `posted`=1 WHERE `id`=' + sanitize.escape(id) + ';';

                  db.execute(sql, function (err, rows) {
                    if (err) return done(err);
                    done(null, rows);
                    return;
                  });
                });
              });
            });
          });
        });
      });
    });
  }

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
        get.origin('group_invoice', function (err, origin_id) {
          if (err) return done(err);
          // we now have the origin!

          get.period(date, function (err, period_object) {
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

              var period_id = period_object.period_id;
              var fiscal_year_id = period_object.fiscal_year_id;

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
                  [origin_id, user_id].join(', ') + ' ' +
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
                  [origin_id, user_id].join(', ') + ' ' +
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
    var sql =
      'SELECT `credit_note`.`project_id`, `project`.`enterprise_id`, `cost`, `debitor_uuid`, `note_date`, `credit_note`.`sale_uuid`, ' +
        ' `description`, `note_date`, `inventory_uuid`, `quantity`, `sale_item`.`uuid` as `item_uuid`, ' +
        '`transaction_price`, `debit`, `credit`' +
      'FROM `credit_note` JOIN `sale_item` JOIN `inventory` JOIN `inventory_unit` JOIN `project` ' +
        'ON `credit_note`.`sale_uuid`=`sale_item`.`sale_uuid` AND ' +
        '`sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
        '`project`.`id` = `credit_note`.`project_id` AND ' +
        '`inventory`.`unit_id`=`inventory_unit`.`id` ' +
      'WHERE `credit_note`.`uuid`=' + sanitize.escape(id);

    db.execute(sql, function (err, results) {
      if (err) { return done(err); }
      if (results.length === 0) {
        return done(new Error('No credit note by the id: ' + id));
      }

      var reference_note= results[0];
      var enterprise_id = reference_note.enterprise_id;
      var project_id = reference_note.project_id;
      var date = reference_note.note_date;

      var saleItems = results;

      check.validPeriod(enterprise_id, date, function (err) {
        if (err) { done(err); }

        // Ensure a credit note hasn't already been assiged to this sale
        var reviewLegacyNotes = "SELECT uuid FROM credit_note WHERE sale_uuid=" + sanitize.escape(reference_note.sale_uuid) + ";";
        db.execute(reviewLegacyNotes, function (err, rows) {
          if(err) return done(err);

          // There should only be one sale here
          if(rows.length > 1) return done('This sale has already been reversed with a credit note');

          // Cost positive checks
          var costPositive = results.every(function (row) { return validate.isPositive(row.cost); });
          if (!costPositive) {
            return done(new Error('Negative cost detected for invoice id: ' + id));
          }

          // third check - is the total the price * the quantity?
          function sum(a, b) {
            return a + (b.credit - b.debit);
          }

          var total = results.reduce(sum, 0);
          //console.log('[DEBUG] sum', total, 'cost', reference_note.cost);
          var totalEquality = validate.isEqual(total, reference_note.cost);
          //if (!totalEquality) {
            //console.log('[DEBUG] ', 'sum of costs is not equal to the total');
            //return done(new Error('Individual costs do not match total cost for invoice id: ' + id));
          //}

          // all checks have passed - prepare for writing to the journal.
          get.origin('credit_note', function (err, originId) {
            if (err) { return done(err); }
            // we now have the origin!

            get.period(date, function (err, periodObject) {
              if (err) { return done(err); }

              // we now have the relevant period!
              // create a trans_id for the transaction
              // MUST BE THE LAST REQUEST TO prevent race conditions.
              get.transactionId(project_id, function (err, transId) {
                if(err) return done(err);

                var periodId = periodObject.period_id, fiscalYearId = periodObject.fiscal_year_id;

                // console.log('working with', row, index, periodId, originId);

                // Credit debtor (basically the reverse of a sale)
                var debtorQuery =
                  'INSERT INTO `posting_journal` ' +
                    '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                    '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                    '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), fiscalYearId, periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
                    '"' + reference_note.description + '", `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' +
                    '`sale`.`currency_id`, `sale`.`debitor_uuid`, \'D\', `sale`.`uuid`, ' + [originId, user_id].join(', ') + ' ' +
                  'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
                    '`sale`.`debitor_uuid`=`debitor`.`uuid` AND `debitor`.`group_uuid`=`debitor_group`.`uuid` ' +
                  'WHERE `sale`.`uuid`=' + sanitize.escape(reference_note.sale_uuid) + ';';

                var itemsQuery = [];
                saleItems.forEach(function (item) {
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
                  // 'WHERE `sale`.`uuid`=' + sanitize.escape(reference_note.sale_uuid) + ';';

                  var itemSql =
                  'INSERT INTO `posting_journal` ' +
                    '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                    '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                    '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `sale`.`project_id`, ' + [sanitize.escape(uuid()), fiscalYearId, periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
                    '"' + reference_note.description + '", `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
                    '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
                    ' null, `sale`.`uuid`, ' + [originId, user_id].join(', ') + ' ' +
                  'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
                    '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
                    '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
                  'WHERE `sale_item`.`uuid`=' + sanitize.escape(item.item_uuid) + ';';

                  itemsQuery.push(itemSql);
                });


                db.execute(debtorQuery, function (err, rows) {
                  if(err) return done(err);

                  q.all(itemsQuery.map(function (itemSql) {
                    return db.exec(itemSql);
                  })).then(function(result) {

                    var updatePosted = 'UPDATE `credit_note` SET `posted`=1 WHERE `id`=' + sanitize.escape(id) + ';';

                    if(err) return done(err);

                    db.execute(sql, function (err, rows) {
                      if (err) return done(err);
                      done(null, rows);
                      return;
                    });
                  });
                });

              });
            });
          });
        });
      });
    });
  }

  function handleCaution(id, user_id, done) {
    var sql =
      "SELECT `caution`.`project_id`, `caution`.`value`, `caution`.`date`, `caution`.`debitor_uuid`, `caution`.`currency_id`, `caution`.`user_id`, `caution`.`description`, `caution`.`cash_box_id` "+
      "FROM `caution` WHERE `caution`.`uuid` = " + sanitize.escape(id) + ";";

    db.execute(sql, function (err, ans) {
      if (err) { return done(err, null); }
      if (ans.length === 0) { return done(new Error('No caution by the id: ' + id)); }

      var reference_caution = ans[0];
      var project_id = reference_caution.project_id;
      var date = util.toMysqlDate(reference_caution.date);

      get.myExchangeRate(date)
      .then(function (exchangeRateStore) {
        var dailyExchange = exchangeRateStore.get(reference_caution.currency_id);
        var debit_equiv = dailyExchange.rate * 0;
        var credit_equiv = (1/dailyExchange.rate) * reference_caution.value;

        get.origin('caution', function (err, origin_id) {
          if (err) { return done(err); }

          get.myPeriod(date, function (err, periodObject) {

            if (err) { return done(err); }

            get.transactionId(project_id, function (err, trans_id) {
              if (err) { return done(err);}

              //we credit the caution account
              var creditingRequest =
                'INSERT INTO posting_journal '+
                '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
                'SELECT ' + [reference_caution.project_id, sanitize.escape(uuid()), periodObject.fiscal_year_id, periodObject.period_id, trans_id, '\''+get.date()+'\'','\''+reference_caution.description+'\''].join(', ') +
                  ', `caution_box_account_currency`.`account_id`, '+[reference_caution.value, 0, credit_equiv, debit_equiv, reference_caution.currency_id, '\''+reference_caution.debitor_uuid+'\''].join(', ') +
                  ', \'D\', '+['\''+id+'\'', origin_id, user_id].join(', ')+' '+
                'FROM `caution_box_account_currency`, `caution_box` WHERE `caution_box`.`id` =`caution_box_account_currency`.`caution_box_id` AND `caution_box_account_currency`.`currency_id`='+reference_caution.currency_id+
                ' AND `caution_box`.`project_id`='+reference_caution.project_id;


              var debitingRequest =
                'INSERT INTO posting_journal '+
                '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                'SELECT ' + [reference_caution.project_id, sanitize.escape(uuid()), periodObject.fiscal_year_id, periodObject.period_id, trans_id, '\''+get.date()+'\'', '\''+reference_caution.description+'\''].join(',') +
                  ', `cash_box_account_currency`.`account_id`, ' + [0, reference_caution.value, debit_equiv, credit_equiv, reference_caution.currency_id].join(',') +
                  ', null, null, ' + ['\''+id+'\'', origin_id, user_id].join(', ') + ' ' +
                'FROM `cash_box_account_currency`, `cash_box` WHERE `cash_box`.`id` =`cash_box_account_currency`.`cash_box_id` AND `cash_box_account_currency`.`currency_id`='+reference_caution.currency_id+
                ' AND `cash_box_account_currency`.`cash_box_id`='+reference_caution.cash_box_id+' AND `cash_box`.`project_id`='+reference_caution.project_id;



              q.all([creditingRequest, debitingRequest].map(function (item){
                return db.exec(item);
              }))
              .then(function (res){
                return done(null, res);
              })
              .catch(function (err) {
                return done(err);
              })
              .done();
            });
          });
        });
      })
      .catch(function (err) {
        var discard = "DELETE FROM caution WHERE id = " + sanitize.escape(id) + ";";
        db.execute(discard, function(err, ans){
          //console.log('************** error annulation insertion', err);
          throw (new Error('un probleme'));
        });
      });
    });
  }


  function handleTransfert (id, user_id, done){
    var sql = "SELECT * FROM `primary_cash` WHERE `primary_cash`.`uuid`="+sanitize.escape(id)+";";

    db.execute(sql, function(err, ans){
      if (err) { return done(err, null); }
      if (ans.length === 0) { return done(new Error('No primary_cash by the uuid: ' + id)); }

      var reference_pcash = ans[0];
      var project_id = reference_pcash.project_id;
      var date = util.toMysqlDate(reference_pcash.date);

      get.myExchangeRate(date)
      .then(function (exchangeRateStore) {

        get.origin('pcash', function (err, origin_id) {

          if (err) { return done(err); }

          get.myPeriod(date, function (err, periodObject) {

            if (err) { return done(err); }

            get.transactionId(project_id, function (err, trans_id) {
              if(err) {return done(err);}
                  var dailyExchange = exchangeRateStore.get(reference_pcash.currency_id);
                  var valueExchanged = parseFloat((1/dailyExchange.rate) * reference_pcash.cost).toFixed(4);
                  var descrip =  'PCT/'+new Date().toISOString().slice(0, 10).toString();


              var credit_sql = 'INSERT INTO posting_journal '+
                            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                            'VALUES ('+
                                      [
                                        sanitize.escape(uuid()),
                                        reference_pcash.project_id,
                                        periodObject.fiscal_year_id,
                                        periodObject.period_id,
                                        trans_id, '\''+get.date()+'\'', '\''+descrip+'\'', reference_pcash.account_id
                                      ].join(',')+', '+
                                     [
                                      reference_pcash.cost, 0,
                                        valueExchanged, 0,
                                        reference_pcash.currency_id
                                     ].join(',')+', null, null, '+[sanitize.escape(id), origin_id, user_id].join(',')

                              +');';


              var debit_sql = 'INSERT INTO posting_journal '+
                            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                            'SELECT '+
                                      [
                                        sanitize.escape(uuid()),
                                        reference_pcash.project_id,
                                        periodObject.fiscal_year_id,
                                        periodObject.period_id,
                                        trans_id, '\''+get.date()+'\'', '\''+descrip+'\''
                                      ].join(',')+', `account_id`, '+
                                     [
                                      0, reference_pcash.cost,
                                        0, valueExchanged,
                                        reference_pcash.currency_id
                                     ].join(',')+', null, null, '+[sanitize.escape(id), origin_id, user_id].join(',')

                              +' FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`='+sanitize.escape(reference_pcash.cash_box_id)
                              +' AND `cash_box_account_currency`.`currency_id`='+sanitize.escape(reference_pcash.currency_id);

              q.all([credit_sql, debit_sql].map(function (item){
                return db.exec(item);
              }))
              .then(function (res){
                return done(null, res);
              })
              .catch(function (err){
                return done (err);

              });
            });
          });
        });
      }, function (err) {
        var discard = "DELETE FROM primary_cash WHERE uuid="+sanitize.escape(id);
        db.execute(discard, function(err, ans){
          throw (new Error('Erreur lor du update'+err));
        });
      });
    });
  }

  function handlePcashConvention (id, user_id, done){
    var sql = "SELECT * FROM `pcash` WHERE `pcash`.`uuid`="+sanitize.escape(id)+";";

    db.execute(sql, function(err, ans){
      if (err) { return done(err, null); }
      if (ans.length === 0) { return done(new Error('No pcash by the uuid: ' + id)); }
      var reference_pcash_convention={};
      reference_pcash_convention.reference_pcash = ans[0];
      var project_id = reference_pcash_convention.reference_pcash.project_id;
      var date = util.toMysqlDate(reference_pcash_convention.reference_pcash.date);
      sql = "SELECT * FROM `pcash_item` WHERE `pcash_item`.`pcash_uuid`="+sanitize.escape(id)+";";
      db.execute(sql, function(err, ans2){
        reference_pcash_convention.reference_pcash_items = ans2;
        get.myExchangeRate(date)
        .then(function (exchangeRateStore) {

          get.origin('pcash_convention', function (err, origin_id) {

            if (err) { return done(err); }

            get.myPeriod(date, function (err, periodObject) {

              if (err) { return done(err); }

              get.transactionId(project_id, function (err, trans_id) {
                if(err) {return done(err);}

                    var dailyExchange = exchangeRateStore.get(reference_pcash_convention.reference_pcash.currency_id);
                    var valueExchanged = parseFloat((1/dailyExchange.rate) * reference_pcash_convention.reference_pcash.value).toFixed(4);
                    var descrip =  'COVP/'+new Date().toISOString().slice(0, 10).toString();

                    var credit_sql = 'INSERT INTO posting_journal '+
                                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                                  'VALUES ('+
                                            [
                                              sanitize.escape(uuid()),
                                              reference_pcash_convention.reference_pcash.project_id,
                                              periodObject.fiscal_year_id,
                                              periodObject.period_id,
                                              trans_id, '\''+get.date()+'\'', '\''+descrip+'\'', reference_pcash_convention.reference_pcash.account_id
                                            ].join(',')+', '+
                                           [
                                              reference_pcash_convention.reference_pcash.value,0,
                                              valueExchanged,0,
                                              reference_pcash_convention.reference_pcash.currency_id
                                           ].join(',')+', null, null, '+[sanitize.escape(reference_pcash_convention.reference_pcash_items[0].inv_po_id), origin_id, user_id].join(',')

                                    +');';
                    q.all(
                          reference_pcash_convention.reference_pcash_items.map(function (ref_pcash_item){
                            console.log('[ref_pcash_item]', ref_pcash_item);
                            var valueExchanged2 = parseFloat((1/dailyExchange.rate) * ref_pcash_item.cost).toFixed(4);
                            var sql = 'INSERT INTO posting_journal '+
                                        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                                        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                                        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                                        'SELECT '+
                                                  [
                                                    sanitize.escape(uuid()),
                                                    reference_pcash_convention.reference_pcash.project_id,
                                                    periodObject.fiscal_year_id,
                                                    periodObject.period_id,
                                                    trans_id, '\''+get.date()+'\'', '\''+descrip+'\''
                                                  ].join(',')+', `account_id`, '+
                                                 [
                                                  0, ref_pcash_item.cost,
                                                  0, valueExchanged2,
                                                  reference_pcash_convention.reference_pcash.currency_id
                                                 ].join(',')+', null, null, '+[sanitize.escape(ref_pcash_item.inv_po_id), origin_id, user_id].join(',')
                                          +' FROM cash_box_account_currency WHERE `cash_box_account_currency`.`cash_box_id`='+sanitize.escape(reference_pcash_convention.reference_pcash.cash_box_id)
                                          +' AND `cash_box_account_currency`.`currency_id`='+sanitize.escape(reference_pcash_convention.reference_pcash.currency_id);
                            return db.exec(sql);
                          })
                    )
                    .then(function(){
                      return db.exec(credit_sql);
                    })
                    .then(function (res){
                      return done(null, res);
                    })
                    .catch(function (err){
                      return done(err);
                    });
              });
            });
          });
        }, function (err) {
          var discard = "DELETE FROM pcash WHERE uuid="+sanitize.escape(id);
          db.execute(discard, function(err, ans){
            //console.log('************** error annulation insertion', err);
            throw (new Error('un probleme'));
          });
        });
      });


    });
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
