// scripts/lib/logic/journal.js

var parser = require('../database/parser')(),
    sanitize = require('../util/sanitize'),
    util = require('../util/util'),
    Q = require('q');


// TODO: Debugging.  There's a potential we are rounding values like
// 17.5 -> 18 when posting in debit_equiv and credit_equiv.


// validation functions
var validate = {
  isValidDate : function (date) { return !Number.isNaN(date.parse(date)); },
  isValidNumber : function (number) {
    var cast = Number(number);
    return Number.isFinite(cast) && !Number.isNaN(cast);
  },
  isPositive : function (number) { 
    return this.isValidNumber(number) && Number(number) >= 0;
  },
  isNegative : function (number) { return !this.isPositive(number); },
  isEqual : function (a, b) { return a === b; },
  isDefined : function (a) { return a !== undefined; },
  isUndefined : function (a) { return !this.isDefined(a); },
  isNull : function (a) { return a === null; },
  exists : function (a) { return this.isDefined(a) && !this.isNull(a); }
};

module.exports = (function (db) {
  // deals in everything journal related
  'use strict';

  var table_router, check, get;

  // router for incoming requests
  table_router = {
    'sale'     : handleSales,
    'cash'     : handleCash,
    'purchase' : handlePurchase,
    'group_invoice' : handleGroupInvoice
  };

  function request (table, id, user_id, done) {
    // handles all requests coming from the client
    table_router[table](id, user_id, done);
    return;
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
        'SELECT `temp`.`id` ' +
        'FROM (' +
            '(' + 
              'SELECT `debitor`.`id` FROM `debitor` WHERE `id`=' + escaped_id +
            ') UNION (' + 
              'SELECT `creditor`.`id` FROM `creditor` WHERE `id`=' + escaped_id +
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
    origin : function (table, callback) {
      // uses the transaction_type table to derive an origin_id
      // to post to the journal.  Returns the id.
      var query = 
        'SELECT `id`, `service_txt` FROM `transaction_type` WHERE `service_txt`='+sanitize.escape(table)+';';
      db.execute(query, function (err, rows) {
        if (err) return callback(err);
        if (rows.length === 0) 
          return callback(new Error('Cannot find origin for transaction type : ' + table));
        return callback(null, rows[0].id);
      });
    },

    transactionId : function (callback) {
      // get a new transaction id from the journal.
      // make sure it is the last thing fired in the
      // call stack before posting.
      var query = 'SELECT MAX(`trans_id`) AS `max` FROM (SELECT MAX(`trans_id`) as `trans_id` FROM `posting_journal` UNION ALL SELECT MAX(`trans_id`) as `trans_id` FROM `general_ledger`)a;';
      db.execute(query, function (err, rows) {
        if (err) return callback(err);
        return callback(null, rows[0].max ? rows[0].max + 1 : 1);
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
  
    period : function (date, callback) {
      // gets the currency period from a mysql-compatible date.
      var sql = 
        'SELECT `id`, `fiscal_year_id` FROM `period` ' +
        'WHERE `period_start` <= ' + sanitize.escape(get.date(date)) + ' AND ' +
        ' `period_stop` >= ' + sanitize.escape(get.date(date)) + ';';

      db.execute(sql, function (err, rows) {
        if (err) return callback(err);
        if (rows.length === 0) return callback(new Error('No period or fiscal year data for date: ' + date));
        return callback(null, { period_id :rows[0].id, fiscal_year_id : rows[0].fiscal_year_id });
      });
    },

    exchangeRate : function (date, callback) {
      // expects a mysql-compatible date
      // FIXME : this logic needs perfecting..
      //   NOTE: the idea is that the rate for a day
      //   is considered as enterprise_currency -> foreign_currency
      //   for each line.  We create an object then of 
      //   {
      //     foreign_currency_id : rate
      //   }
      //   which will map currencies to rates.  If the currency is
      //   the enterprise_currency, the rate is 1.
      var sql = 
        'SELECT `enterprise_currency_id`, `foreign_currency_id`, `rate` ' +
        'FROM `exchange_rate` WHERE `date`=\'' + this.date(date) + '\';';
      db.execute(sql, function (err, rows) {
        if (err) return callback(err);
        if (rows.length === 0) return callback(new Error('No exchange rate found for date : ' + date));
        var rate_map = {};
        rows.forEach(function (line) { 
          rate_map[line.enterprise_currency_id] = 1; // enterprise currency to itself is always 1.
          rate_map[line.foreign_currency_id] = line.rate; // foreign_currency -> enterprise is rate.
        });
        return callback(null, rate_map);
      });
    }
  };

  function authorize (user_id, callback) {
    // This is a placeholder until we find out how to allow
    // users to post.  It is a permissions issue.
    db.execute('SELECT 1+1 AS ans;', function (err, results) {
      if (err) return callback(err);
      return callback(null, results);
    });
  }


  function handleSales (id, user_id, callback) {
    // sale posting requests enter here.
    var sql =
      'SELECT `sale`.`enterprise_id`, `sale`.`id`, `sale`.`currency_id`, ' + 
        '`sale`.`debitor_id`, `sale`.`seller_id`, `sale`.`discount`, `sale`.`invoice_date`, ' +
        '`sale`.`cost`, `sale`.`note`, `sale_item`.`unit_price`, `sale_item`.`total`, ' +
        '`sale_item`.`quantity`, `inventory`.`group_id` ' +
      'FROM `sale` JOIN `sale_item` JOIN `inventory` ON ' + 
        '`sale`.`id`=`sale_item`.`sale_id` AND ' +
        '`sale_item`.`inventory_id`=`inventory`.`id` ' +
      'WHERE `sale`.`id`='+sanitize.escape(id)+';';

    db.execute(sql, function (err, results) {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(new Error('No sale by the id: ' + id));

      var reference_sale = results[0];
      var enterprise_id = reference_sale.enterprise_id;
      var date = reference_sale.invoice_date;

      // first check - do we have a validPeriod?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) callback(err, null);  

        // second check - is the cost positive for every transaction?
        var costPositive = results.every(function (row) { return validate.isPositive(row.cost); });
        if (!costPositive) return callback(new Error('Negative cost detected for sale id: ' + id));

        // third check - are all the unit_price's for sale_items positive?
        var unit_pricePositive = results.every(function (row) { return validate.isPositive(row.unit_price); });
        if (!unit_pricePositive) return callback(new Error('Negative unit_price for sale id: ' + id));

        // fourth check - is the total the price * the quantity?
        var totalEquality = results.every(function (row) { return validate.isEqual(row.total, row.unit_price * row.quantity); });
        if (!totalEquality) return callback(new Error('Unit prices and quantities do not match for sale id: ' + id));
    
        // all checks have passed - prepare for writing to the journal.
        get.origin('sale', function (err, origin_id) {
          if (err) return callback(err);
          // we now have the origin!
           
          get.period(date, function (err, period_object) {
            if (err) return callback(err);

            // we now have the relevant period!

            // create a trans_id for the transaction
            // MUST BE THE LAST REQUEST TO undo race conditions.
            get.transactionId(function (err, trans_id) {
              if (err) return callback(err);

              var period_id = period_object.period_id;
              var fiscal_year_id = period_object.fiscal_year_id; 
              
              // we can begin copying data from SALE -> JOURNAL

              // First, copy the data from sale into the journal.
              // FIXME: this is unclear with get.date() which returns a mysql-compatible date
              var sale_query =
                'INSERT INTO `posting_journal` ' +
                  '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `sale`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`sale`.`note`, `debitor_group`.`account_id`, `sale`.`cost`, 0, `sale`.`cost`, 0, ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
                  '`sale`.`currency_id`, `sale`.`debitor_id`, \'D\', `sale`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `sale` JOIN `debitor` JOIN `debitor_group` ON ' + 
                  '`sale`.`debitor_id`=`debitor`.`id` AND `debitor`.`group_id`=`debitor_group`.`id` ' +
                'WHERE `sale`.`id`=' + sanitize.escape(id) + ';';

              // Then copy data from SALE_ITEMS -> JOURNAL
              var sale_item_query =
                'INSERT INTO `posting_journal` ' +
                  '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `sale`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                  '`sale`.`note`, `inv_group`.`sales_account`, 0, `sale_item`.`total`, 0, `sale_item`.`total`, ' + // last three: credit, debit_equiv, credit_equiv
                  '`sale`.`currency_id`, `sale`.`debitor_id`, \'D\', `sale`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `sale` JOIN `sale_item` JOIN `inventory` JOIN `inv_group` ON ' + 
                  '`sale_item`.`sale_id`=`sale`.`id` AND `sale_item`.`inventory_id`=`inventory`.`id` AND ' +
                  '`inventory`.`group_id`=`inv_group`.`id` ' +
                'WHERE `sale`.`id`=' + sanitize.escape(id) + ';';

              // we are ready to execute!
              
              db.execute(sale_query, function (err, rows) {
                if (err) return callback(err);
                db.execute(sale_item_query, function (err, rows) {
                  if (err) return callback(err);
                  
                  // now we must set all relevant rows from sale to "posted"
                  var sale_posted_query = 
                    'UPDATE `sale` SET `sale`.`posted`=1 WHERE `sale`.`id`='+sanitize.escape(id);

                  db.execute(sale_posted_query, function (err, rows) {
                    if (err) return callback(err);
                    return callback(null, rows);
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  function handleCash (id, user_id, callback) {
    // posting from cash to the journal.
    var sql = 
      'SELECT `cash`.`id`, `cash`.`enterprise_id`, `cash`.`date`, `cash`.`debit_account`, `cash`.`credit_account`, '  + 
        '`cash`.`deb_cred_id`, `cash`.`deb_cred_type`, `cash`.`currency_id`, `cash`.`cost`, `cash`.`cashier_id`, ' +
        '`cash`.`cashbox_id`, `cash`.`description`, `cash_item`.`cash_id`, `cash_item`.`allocated_cost`, `cash_item`.`invoice_id`, ' + 
        '`cash`.`bon`, `cash`.`bon_num` ' +
      'FROM `cash` JOIN `cash_item` ON `cash`.`id`=`cash_item`.`cash_id` ' +
      'WHERE `cash`.`id`=' + sanitize.escape(id) + ';'; 

    db.execute(sql, function (err, results) {
      if (err) return callback(err);
      if (results.length === 0) return callback(new Error('No cash value by the id: ' + id));

      var reference_payment = results[0];
      var enterprise_id = reference_payment.enterprise_id;

      var date = reference_payment.date;

      // first check - are we in the correct period/fiscal year?
      check.validPeriod(enterprise_id, date, function (err) {

        // second check - is there a bon number defined?
        var bon_num_exist = validate.exists(reference_payment.bon_num);
        if (!bon_num_exist) return callback(new Error('The Bon number is not defined for cash id: ' + id));

        // third check - is the bon defined?
        var bon_exist = validate.exists(reference_payment.bon);
        if (!bon_exist) return callback(new Error('The Bon is not defined for cash id: ' + id));

        // forth check - is the cost positive?
        var cost_positive = validate.isPositive(reference_payment.cost);
        if (!cost_positive) return callback(new Error('Invalid value for cost for cash id: ' + id));
        
        // fifth check - is the allocated cost positive for every cash item?
        var allocated_postive = results.every(function (row) { return validate.isPositive(row.allocated_cost); });
        if (!allocated_postive) return callback(new Error('Invalid payment price for one invoice with cash id: ' + id));
      
        // sixth check - do all the allocated costs add up to the total cost?
        // We must catch this because reduce fails in on a empty array.
        // FIXME : re-write this check
        var sum = results.map(function (item) { return item.allocated_cost; }).reduce(function (a, b) { return (a || 0) + (b || 0); } );
        if (!validate.isEqual(sum, reference_payment.cost)) return callback(new Error('Allocated cost do not add up to total cost in payment with cash id: ' + id));

        // seventh check - is the deb_cred_id valid?
        check.validDebitorOrCreditor(reference_payment.deb_cred_id, function (err) {
          if (err) return callback(err);

          // all checks have passed - prepare for writing to the journal.
          get.origin('cash', function (err, origin_id) {
            if (err) return callback(err);
            // we now have the origin!
             
            get.period(date, function (err, period_object) {
              if (err) return callback(err);

              // we now have the relevant period!

              get.exchangeRate(date, function (err, rate_map) {
                if (err) return callback(err);

                // we now have an exchange rate!

                // create a trans_id for the transaction
                // MUST BE THE LAST REQUEST TO prevent race conditions.
                get.transactionId(function (err, trans_id) {
                  if (err) return callback(err);


                  var period_id = period_object.period_id;
                  var fiscal_year_id = period_object.fiscal_year_id; 

                  // we can begin copying data from CASH -> JOURNAL
                  
                  // First, figure out if we are crediting or debiting the caisse
                  // This is indicated by the bon.
                  // match { 'S' => debiting; 'E' => crediting }
                  var account_type = reference_payment.bon != 'E' ? 'credit_account' : 'debit_account' ;

                  // Are they a debitor or a creditor?
                  var deb_cred_type = reference_payment.bon == 'E' ? '\'D\'' : '\'C\'';

                  // calculate exchange rate.  If money coming in, credit is cash.cost, 
                  // credit_equiv is rate*cash.cost and vice versa.
                  var money = reference_payment.bon == 'E' ?
                    '`cash`.`cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash`.`cost`, 0, ' :
                    '0, `cash`.`cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash`.`cost`, ' ;  

                  // finally, copy the data from cash into the journal with care to convert exchange rates.
                  var cash_query =
                    'INSERT INTO `posting_journal` ' +
                      '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                      '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                      '`inv_po_id`, `currency_id`, `deb_cred_id`, `deb_cred_type`, `origin_id`, `user_id` ) ' +
                    'SELECT `cash`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                      '`cash`.`description`, `cash`.`bon_num`, `cash`.`' + account_type + '`, ' + money + 
                      '`cash_item`.`invoice_id`, `cash`.`currency_id`, `cash`.`deb_cred_id`, ' + deb_cred_type + ', ' +
                      [origin_id, user_id].join(', ') + ' ' +
                    'FROM `cash` JOIN `cash_item` ON ' + 
                      ' `cash`.`id` = `cash_item`.`cash_id` ' + 
                    'WHERE `cash`.`id`=' + sanitize.escape(id) + ' ' + 
                    'LIMIT 1;'; // just in case


                  // Then copy data from CASH_ITEM -> JOURNAL
                  
                  var cash_item_money = reference_payment.bon == 'E' ?
                    '0, `cash_item`.`allocated_cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash_item`.`allocated_cost`, ' :
                    '`cash_item`.`allocated_cost`, 0, '+ 1/rate_map[reference_payment.currency_id] + '*`cash_item`.`allocated_cost`, 0, ' ;

                  var cash_item_account_id = reference_payment.bon != 'E' ? 'debit_account' : 'credit_account'  ;

                  var cash_item_query =
                    'INSERT INTO `posting_journal` ' +
                      '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                      '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                      '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                    'SELECT `cash`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                      '`cash`.`description`, `cash`.`bon_num`, `cash`.`' + cash_item_account_id  + '`, ' + cash_item_money + 
                      '`cash`.`currency_id`, `cash`.`deb_cred_id`, ' + deb_cred_type + ', ' +
                      '`cash_item`.`invoice_id`, ' + [origin_id, user_id].join(', ') + ' ' +
                    'FROM `cash` JOIN `cash_item` ON ' + 
                      '`cash`.`id`=`cash_item`.`cash_id` ' +
                    'WHERE `cash`.`id`=' + sanitize.escape(id) + ';';

                  // we are ready to execute!
                  
                  db.execute(cash_query, function (err, results) {
                    if (err) return callback(err);
                    db.execute(cash_item_query, function (err, results) {
                      if (err) return callback(err);
                      return callback(null, results);
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

  function handlePurchase (id, user_id, done) {
    // posting purchase requests 
    var sql = 
      'SELECT `purchase`.`enterprise_id`, `purchase`.`id`, `purchase`.`cost`, `purchase`.`currency_id`, ' +
        '`purchase`.`creditor_id`, `purchase`.`purchaser_id`, `purchase`.`discount`, `purchase`.`invoice_date`, ' +
        '`purchase`.`note`, `purchase`.`posted`, `purchase_item`.`unit_price`, `purchase_item`.`total`, `purchase_item`.`quantity` ' +
      'FROM `purchase` JOIN `purchase_item` ON `purchase`.`id`=`purchase_item`.`purchase_id` ' + 
      'WHERE `purchase`.`id`=' + sanitize.escape(id) + ';';
    
    db.execute(sql, function (err, results) {
      if (err) return done(err);
      if (results.length === 0) return done(new Error('No purchase order by the id: ' + id));

      var reference_purchase= results[0];
      var enterprise_id = reference_purchase.enterprise_id;
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
                  '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `purchase`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                  '`purchase`.`note`, `creditor_group`.`account_id`, 0, `purchase`.`cost`, 0, `purchase`.`cost`, ' + // last four debit, credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
                  '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `purchase` JOIN `creditor` JOIN `creditor_group` ON ' +
                  '`purchase`.`creditor_id`=`creditor`.`id` AND `creditor_group`.`id`=`creditor`.`group_id` ' +
                'WHERE `purchase`.`id`=' + sanitize.escape(id);

              var purchase_item_sql = 
                'INSERT INTO `posting_journal` ' +
                  '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                'SELECT `purchase`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                  '`purchase`.`note`, `inv_group`.`sales_account`, `purchase_item`.`total`, 0, `purchase_item`.`total`, 0, ' + // last three: credit, debit_equiv, credit_equiv
                  '`purchase`.`currency_id`, `purchase`.`creditor_id`, \'C\', `purchase`.`id`, ' + [origin_id, user_id].join(', ') + ' ' +
                'FROM `purchase` JOIN `purchase_item` JOIN `inventory` JOIN `inv_group` ON ' + 
                  '`purchase_item`.`purchase_id`=`purchase`.`id` AND `purchase_item`.`inventory_id`=`inventory`.`id` AND ' +
                  '`inventory`.`group_id`=`inv_group`.`id` ' +
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
      'SELECT `group_invoice`.`id`, `group_invoice`.`enterprise_id`, `group_invoice`.`debitor_id`,  ' +
      '  `group_invoice`.`note`, `group_invoice`.`authorized_by`, `group_invoice`.`date`, ' +
      '  `group_invoice`.`total`, `group_invoice_item`.`invoice_id`, `group_invoice_item`.`cost`, ' +
      '  `group_invoice_item`.`id` as `gid` ' + 
      'FROM `group_invoice` JOIN `group_invoice_item` JOIN `sale` ' +
      '  ON `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' + 
      '  `group_invoice_item`.`invoice_id` = `sale`.`id` ' +
      'WHERE `group_invoice`.`id`=' + sanitize.escape(id) + ';';
    
    db.execute(sql, function (err, results) {
      if (err) return done(err);
      if (results.length === 0) 
        return done(new Error('No invoice by the id: ' + id));

      var reference_invoice = results[0];
      var enterprise_id = reference_invoice.enterprise_id;
      var date = reference_invoice.invoice_date;

      // first check - do we have a validPeriod?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) done(err);  

        // second check - is the cost positive for every transaction?
        var costPositive = results.every(function (row) { return validate.isPositive(row.cost); });
        if (!costPositive) 
          return done(new Error('Negative cost detected for invoice id: ' + id));

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
                var defer = Q.defer();
                var t_id = idx + trans_id;

                // debiting the convention
                var debit_sql= 
                  'INSERT INTO `posting_journal` ' +
                  '  (`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '  `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '  `currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `group_invoice`.`enterprise_id`, ' + 
                    [fiscal_year_id, period_id, t_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                  '  `group_invoice`.`note`, `debitor_group`.`account_id`, `group_invoice_item`.`cost`, ' + 
                  '  0, `group_invoice_item`.`cost`, 0, `enterprise`.`currency_id`, ' +
                  '  null, null, `group_invoice_item`.`invoice_id`, ' + 
                  [origin_id, user_id].join(', ') + ' ' + 
                  'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor_group` JOIN `sale` JOIN `enterprise` ON ' +
                  '  `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
                  '  `group_invoice`.`group_id` = `debitor_group`.`id`  AND ' +
                  '  `group_invoice_item`.`invoice_id` = `sale`.`id` AND ' + 
                  '  `group_invoice`.`enterprise_id` = `enterprise`.`id` ' +
                  'WHERE `group_invoice_item`.`id` = ' + sanitize.escape(row.gid);

                // crediting the debitor
                var credit_sql= 
                  'INSERT INTO `posting_journal` ' +
                  '  (`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '  `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                  '  `currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                  'SELECT `group_invoice`.`enterprise_id`, ' + 
                    [fiscal_year_id, period_id, t_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                  '  `group_invoice`.`note`, `debitor_group`.`account_id`, 0, `group_invoice_item`.`cost`, ' + 
                  '  0, `group_invoice_item`.`cost`, `enterprise`.`currency_id`,  ' +
                  '  `group_invoice`.`debitor_id`, \'D\', `group_invoice_item`.`invoice_id`, ' + 
                  [origin_id, user_id].join(', ') + ' ' + 
                  'FROM `group_invoice` JOIN `group_invoice_item` JOIN `debitor` JOIN `debitor_group` JOIN `sale` JOIN `enterprise` ON ' +
                  '  `group_invoice`.`id` = `group_invoice_item`.`payment_id` AND ' +
                  '  `group_invoice`.`debitor_id` = `debitor`.`id`  AND ' +
                  '  `debitor`.`group_id` = `debitor_group`.`id` AND ' +
                  '  `group_invoice_item`.`invoice_id` = `sale`.`id` AND ' + 
                  '  `group_invoice`.`enterprise_id` = `enterprise`.`id` ' +
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


              Q.all(promise)
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

  return { request : request };

});
