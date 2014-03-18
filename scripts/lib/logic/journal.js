// scripts/lib/logic/journal.js

// TODO: dependency injection
var sanitize = require('../util/sanitize'),
    util = require('../util/util'),
    validate = require('../util/validate')(),
    Store = require('../util/store'),
    q = require('q'),
    uuid = require('../util/guid');

module.exports = function (db) {
  // deals in everything journal related
  'use strict';

  var table_router, check, get;

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
        'SELECT `temp`.`uuid` ' +
        'FROM (' +
            '(' +
              'SELECT `debitor`.`uuid` FROM `debitor` WHERE `uuid`=' + escaped_id +
            ') UNION (' +
              'SELECT `creditor`.`uuid` FROM `creditor` WHERE `uuid`=' + escaped_id +
            ')' +
        ') as `temp`;';
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

    transactionId : function (done) {
      // get a new transaction id from the journal.
      // make sure it is the last thing fired in the
      // call stack before posting.
      var query = 'SELECT MAX(`trans_id`) AS `max` FROM (SELECT MAX(`trans_id`) as `trans_id` FROM `posting_journal` UNION ALL SELECT MAX(`trans_id`) as `trans_id` FROM `general_ledger`)a;';
      db.execute(query, function (err, rows) {
        if (err) return done(err);
        return done(null, rows[0].max ? rows[0].max + 1 : 1);
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
  function handleSales (id, user_id, done) {
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

        // FIXME : Javascript rounding issues are terrible
        // fourth check - do the credits minus the debits sum to the total
        // cost?  This also checks for the quantity.
        var sumDebitsAndCredits = 0;
        results.forEach(function (i) {
          sumDebitsAndCredits += (i.credit - i.debit);
        });

        if (!validate.isEqual(sumDebitsAndCredits, reference_sale.cost)) {
          console.log('[DEBUG] :', 'sumDebitsAndCredits', sumDebitsAndCredits, 'reference_sale.cost:', reference_sale.cost);
          console.log('[DEBUG] :', 'results', results);
          //return done(new Error('The sum of the debits and credits is not the transaction cost for sale id :' + id));
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
            get.transactionId(function (err, trans_id) {
              if (err) return done(err);

              var period_id = period_object.period_id;
              var fiscal_year_id = period_object.fiscal_year_id;

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
              // This query is significantly more difficult because sale_item
              // contains both debits and credits.
              /*
              var sale_item_query =
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
                'WHERE `sale`.`uuid`=' + sanitize.escape(id) + ';';
              */

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

              db.exec(sale_query)
              .then(function () {
                return q.all(item_queries.map(function (sql) {
                  return db.exec(sql);
                }));
              })
              .then(function () {
                return db.exec(sale_posted_query);
              })
              .then(function (res) {
                done(null, res);
              })
              .catch(function (err) {
                done(err);
              });

              // we are ready to execute!
              /*
              db.execute(sale_query, function (err, rows) {
                if (err) return done(err);
                db.execute(sale_item_query, function (err, rows) {
                  if (err) return done(err);
   

                  db.execute(sale_posted_query, function (err, rows) {
                    if (err) return done(err);
                    return done(null, rows);
                  });
                });
              });
              */
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
  function handleRounding(cash_id, done) {
    var sql, row;

    // find out what the current balance is on the invoice to find out if we are paying it all.
    /*
    sql =
      'SELECT c.uuid, c.cost, SUM(s.cost) as sale_cost, c.date, c.currency_id, cu.min_monentary_unit ' +
      'FROM cash AS c JOIN currency AS cu JOIN cash_item AS ci JOIN sale AS s ' +
      'ON c.uuid=ci.cash_uuid AND c.currency_id = cu.id AND s.uuid = ci.invoice_uuid ' +
      'WHERE c.uuid = ' + sanitize.escape(cash_id) + ' ' +
      'GROUP BY c.document_id;';
    */

    sql =
      'SELECT c.uuid, c.date, c.cost, c.currency_id, sum(p.debit_equiv - p.credit_equiv) AS balance, cu.min_monentary_unit ' +
      'FROM cash AS c JOIN cash_item AS ci JOIN currency as cu JOIN sale AS s JOIN posting_journal AS p ' +
      'ON c.uuid = ci.cash_uuid AND c.currency_id = cu.id AND ci.invoice_uuid = s.uuid AND ci.invoice_uuid = p.inv_po_id ' +
      'WHERE c.uuid = ' + sanitize.escape(cash_id) + ' AND p.deb_cred_uuid = s.debitor_uuid GROUP BY c.uuid;';

    db.exec(sql)
    .then(function (rows) {
      console.log('[DEBUG] rows:', rows);
      row = rows.pop();
      return get.exchangeRate(row.date);
    })
    .then(function (store) {

      var paidValue = precision(row.cost / store.get(row.currency_id).rate, 4);
      console.log('[cash.cost] ', row.cost, 'paidValue ', paidValue, 'row.balance ', row.balance);
      var remainder = precision((row.balance - paidValue) * store.get(row.currency_id).rate, 4);
      console.log('[remainder] ', remainder, 'row.balance-paidValue :', row.balance - paidValue, 'store.get(row.currency_id)', store.get(row.currency_id));
      // if the absolute value of the remainder is less than the min_monentary_unit
      // then they have paid in full
      var isPaidInFull = Math.abs(remainder) - row.min_monentary_unit < row.min_monentary_unit;
      console.log('[DEBUG] isPaidInFull:', isPaidInFull, 'Math.abs(remainder):', Math.abs(remainder), 'remainder:', remainder);
      console.log('[DEBUG] paidValue:', paidValue, 'row:', row);
      return done(null, isPaidInFull, row.balance - paidValue);
    })
    .catch(function (err) {
      return done(err);
    });

  }

  function handleCash (id, user_id, done) {
    // posting from cash to the journal.
    var cashItems;
    var sql =
      'SELECT `cash`.`uuid`, `cash_item`.`uuid` AS `cash_item_uuid`, `cash`.`project_id`, `project`.`enterprise_id`, `cash`.`date`, `cash`.`debit_account`, `cash`.`credit_account`, '  +
        '`cash`.`deb_cred_uuid`, `cash`.`deb_cred_type`, `cash`.`currency_id`, `cash`.`cost`, `cash`.`user_id`, ' +
        '`cash`.`cashbox_id`, `cash`.`description`, `cash_item`.`cash_uuid`, `cash_item`.`allocated_cost`, `cash_item`.`invoice_uuid`, ' +
        '`cash`.`type`, `cash`.`document_id` ' +
      'FROM `cash` JOIN `cash_item` JOIN `project` ON ' +
        '`cash`.`uuid`=`cash_item`.`cash_uuid` ' +
        'AND `cash`.`project_id`=`project`.`id` ' +
      'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ';';

    db.execute(sql, function (err, results) {
      if (err) { return done(err); }
      if (results.length === 0) {
        return done(new Error('No cash value by the id: ' + id));
      }

      cashItems = results;

      var reference_payment = results[0];
      var project_id = reference_payment.project_id;
      var enterprise_id = reference_payment.enterprise_id;

      var date = reference_payment.date;

      // first check - are we in the correct period/fiscal year?
      check.validPeriod(enterprise_id, date, function (err) {

        // second check - is there a type number defined?
        var document_id_exist = validate.exists(reference_payment.document_id);
        if (!document_id_exist) {
          return done(new Error('The document number is not defined for cash id: ' + id));
        }

        // third check - is the type defined?
        var type_exist = validate.exists(reference_payment.type);
        if (!type_exist) {
          return done(new Error('The document type is not defined for cash id: ' + id));
        }

        // forth check - is the cost positive?
        var cost_positive = validate.isPositive(reference_payment.cost);
        if (!cost_positive) {
          return done(new Error('Invalid value for cost for cash id: ' + id));
        }

        // fifth check - is the allocated cost positive for every cash item?
        var allocated_postive = results.every(function (row) {
          return validate.isPositive(row.allocated_cost);
        });

        if (!allocated_postive) {
          return done(new Error('Invalid payment price for one invoice with cash id: ' + id));
        }

        // sixth check - do all the allocated costs add up to the total cost?
        // We must catch this because reduce fails in on a empty array.
        function sum(a, b) {
          return a + b.allocated_cost;
        }

        var total = results.reduce(sum, 0);
        if (!validate.isEqual(total, reference_payment.cost)) {
          console.log('[DEBUG] ', 'total:', total, 'cost', reference_payment.cost);
          console.log('[DEBUG] ', 'reference:', reference_payment);
          //return done(new Error('Allocated cost do not add up to total cost in payment with cash id: ' + id));
        }

        // seventh check - is the deb_cred_id valid?
        check.validDebitorOrCreditor(reference_payment.deb_cred_uuid, function (err) {
          if (err) return done(err);

          // all checks have passed - prepare for writing to the journal.
          get.origin('cash', function (err, origin_id) {
            if (err) return done(err);
            // we now have the origin!

            get.period(date, function (err, period_object) {
              if (err) return done(err);

              // we now have the relevant period!

              get.exchangeRate(date)
              .then(function (store) {
                if (err) { return done(err); }

                // we now have an exchange rate!

                // create a trans_id for the transaction
                // MUST BE THE LAST REQUEST TO prevent race conditions.
                get.transactionId(function (err, trans_id) {
                  if (err) { return done(err); }

                  // we are ready to execute!
                  handleRounding(id, function (err, isPaidInFull, remainder) {
                    if (err) { return done(err); }

                    var period_id = period_object.period_id;
                    var fiscal_year_id = period_object.fiscal_year_id;

                    // we can begin copying data from CASH -> JOURNAL
     
                    // First, figure out if we are crediting or debiting the caisse
                    // This is indicated by the type.
                    // match { 'S' => debiting; 'E' => crediting }
                    var account_type = reference_payment.type !== 'E' ? 'credit_account' : 'debit_account' ;

                    // Are they a debitor or a creditor?
                    var deb_cred_type = reference_payment.type === 'E' ? '\'D\'' : '\'C\'';

                    // calculate exchange rate.  If money coming in, credit is cash.cost,
                    // credit_equiv is rate*cash.cost and vice versa.
                    var money = reference_payment.type === 'E' ?
                      '`cash`.`cost`, 0, ' + 1/store.get(reference_payment.currency_id).rate + '*`cash`.`cost`, 0, ' :
                      '0, `cash`.`cost`, 0, ' + 1/store.get(reference_payment.currency_id).rate + '*`cash`.`cost`, ' ;

                    // finally, copy the data from cash into the journal with care to convert exchange rates.
                    var cash_query =
                      'INSERT INTO `posting_journal` ' +
                        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                        '`inv_po_id`, `currency_id`, `deb_cred_uuid`, `deb_cred_type`, `origin_id`, `user_id` ) ' +
                      'SELECT `cash`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                        '`cash`.`description`, `cash`.`document_id`, `cash`.`' + account_type + '`, ' + money +
                        'null, `cash`.`currency_id`, null, null, ' +
                        [origin_id, user_id].join(', ') + ' ' +
                      'FROM `cash` JOIN `cash_item` ON ' +
                        ' `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
                      'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ' ' +
                      'LIMIT 1;'; // just in case

                    // Then copy data from CASH_ITEM -> JOURNAL
     
                    var cash_item_money = reference_payment.type === 'E' ?
                      '0, `cash_item`.`allocated_cost`, 0, ' + 1/store.get(reference_payment.currency_id).rate + '*`cash_item`.`allocated_cost`, ' :
                      '`cash_item`.`allocated_cost`, 0, '+ 1/store.get(reference_payment.currency_id).rate + '*`cash_item`.`allocated_cost`, 0, ' ;

                    var cash_item_account_id = reference_payment.type !== 'E' ? 'debit_account' : 'credit_account';

                    /*
                    var cash_item_query =
                      'INSERT INTO `posting_journal` ' +
                        '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                      'SELECT `cash`.`project_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                        '`cash`.`description`, `cash`.`document_id`, `cash`.`' + cash_item_account_id  + '`, ' + cash_item_money +
                        '`cash`.`currency_id`, `cash`.`deb_cred_uuid`, ' + deb_cred_type + ', ' +
                        '`cash_item`.`invoice_uuid`, ' + [origin_id, user_id].join(', ') + ' ' +
                      'FROM `cash` JOIN `cash_item` ON ' +
                        '`cash`.`uuid`=`cash_item`.`cash_uuid` '+
                      'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ';';
                    */

                    var cash_item_queries = [];

                    cashItems.forEach(function (item) {
                      var sql =
                        'INSERT INTO `posting_journal` ' +
                        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                      'SELECT `cash`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                        '`cash`.`description`, `cash`.`document_id`, `cash`.`' + cash_item_account_id  + '`, ' + cash_item_money +
                        '`cash`.`currency_id`, `cash`.`deb_cred_uuid`, ' + deb_cred_type + ', ' +
                        '`cash_item`.`invoice_uuid`, ' + [origin_id, user_id].join(', ') + ' ' +
                      'FROM `cash` JOIN `cash_item` ON ' +
                        '`cash`.`uuid`=`cash_item`.`cash_uuid` '+
                      'WHERE `cash_item`.`uuid`=' + sanitize.escape(item.cash_item_uuid) + ';';
                      cash_item_queries.push(sql);
                    });

                    // NOTE: In the case where the patient doesn't pay enough, we must
                    // DEBIT the balance account and credit him for the rest.

                    var rounding_query, rounding_balance_query;
                    if (isPaidInFull && remainder !== 0) {

                      //FIXME: Currently hardcoding 534 `OPERATION DE CHANGE` account as the
                      //rounding account

                      var creditOrDebitBool = remainder > 0;
                      var r = precision(Math.abs(remainder), 4);
                      var creditOrDebit = creditOrDebitBool ?
                        [r, 0, r, 0].join(', ') :  // debit
                        [0, r, 0, r].join(', ') ;   // credit

                      var description =
                        "'Rounding correction on exchange rate data for " + id + "'";

                      rounding_query =
                        'INSERT INTO `posting_journal` ' +
                        '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                        '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                      'SELECT `cash`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                        description +', `cash`.`document_id`, ' + 534  + ', ' + creditOrDebit + ', ' +
                        '`cash`.`currency_id`, null, null, `cash_item`.`invoice_uuid`, ' +
                        [origin_id, user_id].join(', ') + ' ' +
                      'FROM `cash` JOIN `cash_item` ON `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
                      'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ' LIMIT 1;';

                      if (creditOrDebitBool) {

                        var balance = creditOrDebitBool ?
                          [0, r, 0, r].join(', ') :   // credit
                          [r, 0, r, 0].join(', ') ;  // debit

                        rounding_balance_query =
                          'INSERT INTO `posting_journal` ' +
                          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                          '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
                          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                        'SELECT `cash`.`project_id`, ' + [sanitize.escape(uuid()), fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                          description +', `cash`.`document_id`, `cash`.`' + cash_item_account_id  + '`, ' + balance + ', ' +
                          '`cash`.`currency_id`, `cash`.`deb_cred_uuid`, `cash`.`deb_cred_type`, `cash_item`.`invoice_uuid`, ' +
                          [origin_id, user_id].join(', ') + ' ' +
                        'FROM `cash` JOIN `cash_item` ON `cash`.`uuid` = `cash_item`.`cash_uuid` ' +
                        'WHERE `cash`.`uuid`=' + sanitize.escape(id) + ' LIMIT 1;';
                      }
                    }

                    db.exec(cash_query)
                    .then(function () {
                      return q.all(cash_item_queries.map(function (query) {
                        return db.exec(query);
                      }));
                    })
                    .then(function () {
                      if (rounding_query) { console.log('[DEBUG] Executed Rounding Query!'); }
                      return rounding_query ? db.exec(rounding_query) : q();
                    })
                    .then(function () {
                      if (rounding_balance_query) { console.log('[DEBUG] Executed Rounding Query!'); }
                      return rounding_balance_query ? db.exec(rounding_balance_query) : q();
                    })
                    .then(function () {
                      done();
                    })
                    .catch(function (err) {
                      if (err) { return done(err); }
                    })
                    .done();

                    /*

                    db.execute(cash_query, function (err, results) {
                      if (err) return done(err);
                      db.execute(cash_item_query, function (err, results) {
                        if (err) return done(err);
                        if (rounding_query) {
                          db.execute(rounding_query, function(err, res) {
                            if (err) { return done(err); }
                            if (rounding_balance_query) {
                              db.execute(rounding_balance_query, function (err, results) {
                                if (err) { return done(err); }
                                return done(null, results);
                              });
                            } else {
                              return done(null, res);
                            }
                          });
                        } else {
                          return done(null, results);
                        }
                      });
                    });
                    */
                  });
                });
              });
            });
          });
        });
      });
    });
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
            get.transactionId(function (err, trans_id) {
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
      'SELECT `group_invoice`.`id`, `group_invoice`.`project_id`, `project`.`enterprise_id`, `group_invoice`.`debitor_id`,  ' +
      '  `group_invoice`.`note`, `group_invoice`.`authorized_by`, `group_invoice`.`date`, ' +
      '  `group_invoice`.`total`, `group_invoice_item`.`invoice_uuid`, `group_invoice_item`.`cost`, ' +
      '  `group_invoice_item`.`id` as `gid` ' +
      'FROM `group_invoice` JOIN `group_invoice_item` JOIN `sale` JOIN `project` ' +
      '  ON `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
      '  `group_invoice_item`.`invoice_uuid` = `sale`.`id` AND ' +
      '  `project`.`id` = `group_invoice`.`project_id` ' +
      'WHERE `group_invoice`.`id`=' + sanitize.escape(id) + ';';

    db.execute(sql, function (err, results) {
      if (err) return done(err);
      if (results.length === 0) {
        return done(new Error('No invoice by the id: ' + id));
      }

      var reference_invoice = results[0];
      var enterprise_id = reference_invoice.enterprise_id;
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
            get.transactionId(function (err, trans_id) {
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
                  '  `group_invoice`.`group_id` = `debitor_group`.`id`  AND ' +
                  '  `group_invoice_item`.`invoice_uuid` = `sale`.`id` AND ' +
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
                  '  `group_invoice`.`debitor_id`, \'D\', `group_invoice_item`.`invoice_uuid`, ' +
                  [origin_id, user_id].join(', ') + ' ' +
                  'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor` JOIN `debitor_group` JOIN `sale` JOIN `project` JOIN `enterprise` ON ' +
                  '  `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
                  '  `group_invoice`.`debitor_id` = `debitor`.`id`  AND ' +
                  '  `debitor`.`group_id` = `debitor_group`.`id` AND ' +
                  '  `group_invoice_item`.`invoice_uuid` = `sale`.`id` AND ' +
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
      'SELECT `credit_note`.`project_id`, `project`.`enterprise_id`, `cost`, `debitor_id`, `note_date`, `credit_note`.`sale_uuid`, ' +
        ' `description`, `note_date`, `inventory_id`, `quantity`, ' +
        '`transaction_price`, `debit`, `credit`' +
      'FROM `credit_note` JOIN `sale_item` JOIN `inventory` JOIN `inventory_unit` JOIN `project` ' +
        'ON `credit_note`.`sale_id`=`sale_item`.`sale_id` AND ' +
        '`sale_item`.`inventory_id`=`inventory`.`id` AND ' +
        '`project`.`id` = `credit_note`.`project_id` AND ' +
        '`inventory`.`unit_id`=`inventory_unit`.`id`' +
      'WHERE `credit_note`.`id`=' + sanitize.escape(id);

    db.execute(sql, function (err, results) {
      if (err) { return done(err); }
      if (results.length === 0) {
        return done(new Error('No credit note by the id: ' + id));
      }

      var reference_note= results[0];
      var enterprise_id = reference_note.enterprise_id;
      var date = reference_note.note_date;

      check.validPeriod(enterprise_id, date, function (err) {
        if (err) { done(err); }

        // Ensure a credit note hasn't already been assiged to this sale
        var reviewLegacyNotes = "SELECT id FROM credit_note WHERE sale_uuid=" + reference_note.sale_uuid + ";";
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
          console.log('[DEBUG] sum', total, 'cost', reference_note.cost);
          var totalEquality = validate.isEqual(total, reference_note.cost);
          if (!totalEquality) {
            console.log('[DEBUG] ', 'sum of costs is not equal to the total');
            //return done(new Error('Individual costs do not match total cost for invoice id: ' + id));
          }

          // all checks have passed - prepare for writing to the journal.
          get.origin('credit_note', function (err, originId) {
            if (err) { return done(err); }
            // we now have the origin!

            get.period(date, function (err, periodObject) {
              if (err) { return done(err); }

              // we now have the relevant period!
 
              // create a trans_id for the transaction
              // MUST BE THE LAST REQUEST TO prevent race conditions.
              get.transactionId(function (err, transId) {
                if(err) return done(err);
   
                var periodId = periodObject.period_id, fiscalYearId = periodObject.fiscal_year_id;
   
                // console.log('working with', row, index, periodId, originId);
     
                // Credit debtor (basically the reverse of a sale)
                var debtorQuery =
                  'INSERT INTO `posting_journal` ' +
                    '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                    '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                    '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `sale`.`project_id`, ' + [fiscalYearId, periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
                    '"' + reference_note.description + '", `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' +
                    '`sale`.`currency_id`, `sale`.`debitor_id`, \'D\', `sale`.`id`, ' + [originId, user_id].join(', ') + ' ' +
                  'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' +
                    '`sale`.`debitor_id`=`debitor`.`id` AND `debitor`.`group_id`=`debitor_group`.`id` ' +
                  'WHERE `sale`.`id`=' + sanitize.escape(reference_note.sale_uuid) + ';';

                // Debit sale items
                var itemsQuery =
                  'INSERT INTO `posting_journal` ' +
                    '(`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                    '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                    '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `sale`.`project_id`, ' + [fiscalYearId, periodId, transId, '\'' + get.date() + '\''].join(', ') + ', ' +
                    '"' + reference_note.description + '", `inventory_group`.`sales_account`, `sale_item`.`debit`, `sale_item`.`credit`, ' +
                    '`sale_item`.`debit`, `sale_item`.`credit`, `sale`.`currency_id`, null, ' +
                    ' null, `sale`.`id`, ' + [originId, user_id].join(', ') + ' ' +
                  'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inventory_group` ON ' +
                    '`sale_item`.`sale_uuid`=`sale`.`uuid` AND `sale_item`.`inventory_uuid`=`inventory`.`uuid` AND ' +
                    '`inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
                  'WHERE `sale`.`uuid`=' + sanitize.escape(reference_note.sale_uuid) + ';';
 
                db.execute(debtorQuery, function (err, rows) {
                  if(err) return done(err);

                  db.execute(itemsQuery, function (err, rows) {
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

  // router for incoming requests
  table_router = {
    'sale'     : handleSales,
    'cash'     : handleCash,
    'purchase' : handlePurchase,
    'group_invoice' : handleGroupInvoice,
    'credit_note' : handleCreditNote,
  };

  function request (table, id, user_id, done) {
    // handles all requests coming from the client
    table_router[table](id, user_id, done);
    return;
  }

  return { request : request };

};
