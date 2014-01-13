// journal code

var parser = require('../database/parser')(),
    Q = require('q');

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
    'purchase' : handlePurchase
  };

  // validity checks
  check = {
    validPeriod : function (enterprise_id, date, errback) {
      var escaped_date = db.escapestr(get.date(date));
      var sql =
        'SELECT `period`.`id`, `fiscal_year_id` ' +
        'FROM `period` ' +
        'WHERE `period`.`period_start` <=' + escaped_date + ' AND ' +
          '`period`.`period_stop` >=' + escaped_date + ' AND ' +
          '`period`.`locked` = 0;\n';
      db.execute(sql, function (err, rows) {
        if (err) return errback(err);
        if (rows.length === 0) return errback(new Error('No period found to match the posted date : ' + date));
        return errback(null);
      });
    },
    
    validDebitorOrCreditor : function (id, errback) {
      // NOTE: This is NOT STRICT. It may find a debitor when a creditor was
      // requested, or vice versa.  This is fine for the checks here, but not
      // for posting to the general ledger.
      var escaped_id = db.escapestr(id);
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
      var query = 'SELECT `id`, `service_txt` FROM `transaction_type` WHERE `service_txt`='+db.escapestr(table)+';';
      db.execute(query, function (err, rows) {
        if (err) return callback(err);
        if (rows.length === 0) return callback(new Error('Cannot find origin for transaction type : ' + table));
        return callback(null, rows[0].id);
      });
    },

    transactionId : function (callback) {
      // get a new transaction id from the journal.
      // make sure it is the last thing fired in the
      // call stack before posting.
      var query = 'SELECT MAX(`trans_id`) AS `max` FROM `posting_journal`;';
      db.execute(query, function (err, rows) {
        if (err) return callback(err);
        return callback(null, rows[0].max ? rows[0].max + 1 : 1);
      });
    },

    date : function (date) {
      // returns a mysql-compatible date
      // Note : this transforms things into a date, not date + time
      // FIXME : There is a bug, where this changes timezones if you
      // are at midnight and converts the day to the day before.
      var offset, d;
      if (date) {
        offset = new Date(date).getDate() + 1;
        d = new Date(new Date(date).setDate(offset));
      }

      return (date ? d : new Date()).toISOString().slice(0, 10).replace('T', ' ');
    },
  
    period : function (date, callback) {
      // gets the currency period from a mysql-compatible date.
      var sql = 
        'SELECT `id`, `fiscal_year_id` FROM `period` ' +
        'WHERE `period_start` <= ' + db.escapestr(get.date(date)) + ' AND ' +
        ' `period_stop` >= ' + db.escapestr(get.date(date)) + ';';

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
      'WHERE `sale`.`id`='+db.escapestr(id)+';';

    db.execute(sql, function (err, results) {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(new Error('No sale by the id: ' + id));

      var reference_sale = results[0];
      var enterprise_id = reference_sale.enterprise_id;
      var date = reference_sale.invoice_date;

      // first check - do we have a validPeriod?
      // Also, implicit in this check is that a valid fiscal year
      // is in place.
      // FIXME : this must encapsulation all the following code!
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
                'WHERE `sale`.`id`=' + db.escapestr(id) + ';';

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
                'WHERE `sale`.`id`=' + db.escapestr(id) + ';';

              // we are ready to execute!
              
              db.execute(sale_query, function (err, rows) {
                if (err) return callback(err);
                db.execute(sale_item_query, function (err, rows) {
                  if (err) return callback(err);
                  
                  // now we must set all relevant rows from sale to "posted"
                  var sale_posted_query = 
                    'UPDATE `sale` SET `sale`.`posted`=1 WHERE `sale`.`id`='+db.escapestr(id);

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
        '`cash`.`cashbox_id`, `cash`.`text`, `cash_item`.`cash_id`, `cash_item`.`allocated_cost`, `cash_item`.`invoice_id`, ' + 
        '`cash`.`bon`, `cash`.`bon_num` ' +
      'FROM `cash` JOIN `cash_item` ON `cash`.`id`=`cash_item`.`cash_id`;'; 

    db.execute(sql, function (err, results) {
      if (err) return callback(err);
      if (results.length === 0) return callback(new Error('No cash value by the id: ' + id));

      var reference_payment = results[0];
      var enterprise_id = reference_payment.enterprise_id;
      var date = reference_payment.date;


      // first check - are we in the correct period/fiscal year?
      check.validPeriod(enterprise_id, date, function (err) {
        if (err) return callback(err);


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
        var allocated_equal;
        try { allocated_equal = results.reduce(function (a, b) { return (a.allocated_cost || a) + (b.allocated_cost || 0); }); }
        catch (e) { return callback(e); }
        if (validate.isEqual(allocated_equal, reference_payment.cost)) return callback(new Error('Allocated cost do not add up to total cost in payment with cash id: ' + id));

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
                  var account_type = reference_payment.bon == 'E' ? 'credit_account' : 'debit_account';

                  // Are they a debitor or a creditor?
                  var deb_cred_type = reference_payment.bon == 'E' ? '\'D\'' : '\'C\'';

                  // calculate exchange rate.  If money coming in, credit is cash.cost, 
                  // credit_equiv is rate*cash.cost and vice versa.
                  var money = reference_payment.bon == 'E' ?
                    '`cash`.`cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash`.`cost`, 0, ' :
                    '0, `cash`.`cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash`.`cost`, '; 
                  console.log('\nMONEY: ', money);


                  // finally, copy the data from cash into the journal with care to convert exchange rates.
                  var cash_query =
                    'INSERT INTO `posting_journal` ' +
                      '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                      '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                      '`inv_po_id`, `currency_id`, `deb_cred_id`, `deb_cred_type`, `origin_id`, `user_id` ) ' +
                    'SELECT `cash`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' +
                      '`cash`.`text`, `cash`.`bon_num`, `cash`.`' + account_type + '`, ' + money + 
                      '`cash`.`invoice_id`, `cash`.`currency_id`, `cash`.`deb_cred_id`, ' + deb_cred_type + ', ' +
                      [origin_id, user_id].join(', ') + ' ' +
                    'FROM `cash` ' + 
                    'WHERE `cash`.`id`=' + db.escapestr(id) + ';';


                  // Then copy data from CASH_ITEM -> JOURNAL
                  
                  var cash_item_money = reference_payment.bon == 'E' ?
                    '0, `cash_item`.`allocated_cost`, 0, ' + 1/rate_map[reference_payment.currency_id] + '*`cash_item`.`allocated_cost`, ':
                    '`cash_item`.`allocated_cost`, 0, '+ 1/rate_map[reference_payment.currency_id] + '*`cash_item`.`allocated_cost`, 0, ';

                  var cash_item_account_id = reference_payment.bon == 'E' ? 'debit_account' : 'credit_account';

                  var cash_item_query =
                    'INSERT INTO `posting_journal` ' +
                      '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                      '`description`, `doc_num`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
                      '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
                    'SELECT `cash`.`enterprise_id`, ' + [fiscal_year_id, period_id, trans_id, '\'' + get.date() + '\''].join(', ') + ', ' + 
                      '`cash`.`text`, `cash`.`bon_num`, `cash`.`' + cash_item_account_id  + '`, ' + cash_item_money + 
                      '`cash`.`currency_id`, `cash`.`deb_cred_id`, ' + deb_cred_type + ', ' +
                      '`cash_item`.`invoice_id`, ' + [origin_id, user_id].join(', ') + ' ' +
                    'FROM `cash` JOIN `cash_item` ON ' + 
                      '`cash`.`id`=`cash_item`.`cash_id` ' +
                    'WHERE `cash`.`id`=' + db.escapestr(id) + ';';

                  // we are ready to execute!
                  
                  db.execute(cash_query, function (err, results) {
                    if (err) return callback(err);
                    console.log('\n', results, '\n');
                    db.execute(cash_item_query, function (err, results) {
                      if (err) return callback(err);
                      console.log('\n', results, '\n');
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

  function handlePurchase () {}

  var service_name = '';
  var self = {};

  self.request = function (table, id, user_id, callback) {
    // authenticate and authorize
    authorize(user_id, function (err, res) {
      // Is this an anti-pattern?
      // I am not calling the callback but passing it along..
      if (err) return callback(err);
      table_router[table](id, user_id, callback);
    });
  };

  // this validates that we haven't posted the same thing twice.
  // I don't think it actually works, since trans_ids are automatically generated
  self.poster = function (req, res, next) { 
    req.body.forEach(function (item) {
      var sql = "SELECT `id` FROM `posting_journal` WHERE `trans_id`=" + db.escapestr(item.id) + " AND `origin_id`=" + db.escapestr(item.transaction_type) + ";\n";
      db.execute(sql, function(err, records) {
        if (err) return next(err);
        if (!records.length) getData(item, res);
      });
    }); 
  };

  function getData (posting, res) {
    //each posting object contains transaction_id, service_id, user_id properties
    //request for knowing the service
    var query = "SELECT DISTINCT `service_txt` FROM `transaction_type` WHERE `id`=" + db.escapestr(posting.transaction_type) + ';\n';
    db.execute(query, function (err, data) {
      var columnData, sql, services, service_name,
          columns = [],
          defer = Q.defer();

      service_name = data[0].service_txt.toLowerCase();
      columnData = map[service_name];
      for (var col in columnData) {
        if (col != 't') columns.push('`' + columnData.t + '`.`' + columnData[col] + '`');
      }

      services = {
        'sale' : "SELECT " + columns.join(', ') + ", `inventory_id`, `total`, `group_id` FROM " + columnData.t + " JOIN `sale_item` JOIN `inventory` ON `sale`.`id`=`sale_item`.`sale_id` AND `sale_item`.`inventory_id`=`inventory`.`id` WHERE " + columnData.t + ".`id`=" + posting.id + ";\n",
        'cash' : "SELECT " + columns.join(', ') + ", `cash_id`, `allocated_cost`, `invoice_id` FROM " + columnData.t + " JOIN `cash_item` ON `cash`.`id`=`cash_item`.`cash_id` WHERE " + columnData.t + ".`id`=" + db.escapestr(posting.id) + ";\n",
        'purchase' : "SELECT " + columns.join(', ') + ", `inventory_id`, `total`, `group_id` FROM `purchase` JOIN `purchase_item` JOIN `inventory` ON `purchase`.`id`=`purchase_item`.`purchase_id` AND `purchase_item`.`inventory_id`=`inventory`.`id` WHERE " + columnData.t +".`id`=" + db.escapestr(posting.id) + ";\n"
      };

      sql = services[service_name];
      db.execute(sql, function (err, data) {
        if (err) throw err;
        var date = data[0].invoice_date || data[0].date;
        getPeriodId(date, data[0].enterprise_id)
        .then(function (result) {
          if (result.success) process(data, posting, res, result, service_name); //verification et insertion eventuelle
        });
      });
    });
  }

  function saleDebit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer(),
        journalRecord = {},
        debitColumns = map[obj.t + '_debit'];

    for (var k in debitColumns) journalRecord[k] = data[debitColumns[k]];

    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.id = '';
    //FIXME: This code is deprecated.  Actually do this properly using a post from the client.
    journalRecord.deb_cred_type = 'D'; // TODO/FIXME
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;

    /*
    var sql = {
               'entities':[{'t':'debitor', 'c':['group_id']}],
               'cond':[{'t':'debitor', 'cl':'id', 'z':'=', 'v':journalRecord.deb_cred_id}]
              };
    */
    var req = "SELECT `group_id` FROM `debitor` WHERE `debitor`.`id`=" + db.escapestr(journalRecord.deb_cred_id) + ";\n";
//    var req = db.select(sql);
    db.execute(req, function (err, rows) {
      if (err) throw err;
      var sql = "SELECT `debitor_group`.`account_id` FROM `debitor_group` WHERE `debitor_group`.`id`=" + rows[0].group_id + ";\n";
      /*
      var sql = {
       'entities':[{'t':'debitor_group', 'c':['account_id']}],
       'cond':[{'t':'debitor_group', 'cl':'id', 'z':'=', 'v':data[0].group_id}]
      };
     */

      db.execute(sql, function (err, results) {
        if (err) throw err;
        journalRecord.account_id = results[0].account_id;
        insertData('posting_journal', journalRecord)
        .then(function (resolution) {
          defer.resolve(resolution);
        }, function (error) {
          defer.reject(error);
        });
      });
    });

    return defer.promise;
  }

  function saleCredit (obj, data, posting, res, periodExerciceIdObject) { 
    var defer = Q.defer(),
        objCredit = map[obj.t + "_credit"],
        journalRecord,
        sql;

    data.forEach(function (item) {
      journalRecord = {}; 
      sql = "SELECT `inv_group`.`sales_account` FROM `inv_group` WHERE `inv_group`.`id`=" + db.escapestr(item.group_id) + ";\n";
      /*
      sql = {
        'entities':[{'t':'inv_group', 'c':['sales_account']}],
        'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':item.group_id}]
      };
      */
      db.execute(sql, function (err, data2) {
          for (var k in objCredit) journalRecord[k] = item[objCredit[k]];
          journalRecord.origin_id = posting.transaction_type;
          journalRecord.user_id = posting.user;
          journalRecord.id = '';
          journalRecord.deb_cred_type = 'D'; 
          journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
          journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
          journalRecord.period_id = periodExerciceIdObject.pid;
          journalRecord.account_id = data2[0].sales_account;
          insertData('posting_journal', journalRecord).then(function (resolve) {
            defer.resolve(resolve);
          });
      });
    });
    return defer.promise;
  }

  function cashDebit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer();
    var journalRecord = {};
    var objDebit = map[obj.t+'_debit']; 
    journalRecord.id = '';
    for (var cle in objDebit) journalRecord[cle] = data[0][objDebit[cle]];

    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.deb_cred_type = 'D';  
    delete(journalRecord.description); // why do this?
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;
    var sql = "SELECT `debit_account` FROM `cash` WHERE `id`=" + posting.id + ";\n";
    /*
    var sql = {
      'entities':[{'t':'cash', 'c':['debit_account']}],
      'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
    };
    */
    db.execute(sql,function (err, record) {
      journalRecord.account_id = record[0].debit_account;
      insertData('posting_journal', journalRecord).then(function (resolve) {
        defer.resolve(resolve);
      });
    });
    return defer.promise;
  }

  function cashCredit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer(),
        objCredit = map[obj.t+'_credit'],
        journalRecord = {},
        sql;

    journalRecord.id = '';
    /*
    var sql = {
                'entities':[{'t':'cash', 'c':['credit_account']}],
                'cond':[{'t':'cash', 'cl':'id', 'z':'=', 'v':posting.id}]
              };
    */
    sql = "SELECT `cash`.`credit_account` FROM `cash` WHERE `cash`.`id`=" + db.escapestr(posting.id) + ";\n";
    db.execute(sql, function (err, data2) {     
      journalRecord.account_id = data2[0].credit_account;
      data.forEach(function (item) {    
        for (var cle in objCredit) journalRecord[cle] = item[objCredit[cle]];

        journalRecord.origin_id = posting.transaction_type;
        journalRecord.user_id = posting.user;
        journalRecord.deb_cred_type = 'D';
        delete(journalRecord.description);
        journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
        journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
        journalRecord.period_id = periodExerciceIdObject.pid;
        insertData('posting_journal', journalRecord).then(function (resolve) {
          defer.resolve(resolve);
        });
      });  
    });
    return defer.promise;
  }

  function purchaseDebit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer(),
        objDebit = map[obj.t+'_debit'],
        journalRecord,
        sql;

    data.forEach(function(item){
      journalRecord = {}; 
      /*
      sql = {
                 'entities':[{'t':'inv_group', 'c':['sales_account']}],
                 'cond':[{'t':'inv_group', 'cl':'id', 'z':'=', 'v':item.group_id}]
      };
      */
      sql = "SELECT `sales_account` FROM `inv_group` WHERE `inv_group`.`id`=" + db.escapestr(item.group_id) + ";\n";
      db.execute(sql, function (err, data2) {
        if (err) throw err;
        journalRecord.account_id = data2[0].sales_account;

        for (var cle in objDebit) journalRecord[cle] = item[objDebit[cle]];

        journalRecord.origin_id = posting.transaction_type;
        journalRecord.user_id = posting.user;
        journalRecord.deb_cred_type = 'C'; 
        journalRecord.id = '';
        journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
        journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
        journalRecord.period_id = periodExerciceIdObject.pid;
        insertData('posting_journal', journalRecord).then(function (resolve) {
          defer.resolve(resolve);
        });
      });
    });
    return defer.promise;
  }

  function purchaseCredit (obj, data, posting, res, periodExerciceIdObject) {
    var defer = Q.defer(); 
    var journalRecord = {};
    var objCredit = map[obj.t+'_credit'];

    for (var k in objCredit) journalRecord[k] = data[objCredit[k]];

    journalRecord.origin_id = posting.transaction_type; //this value wil be fetched in posting object
    journalRecord.user_id = posting.user;
    journalRecord.id = '';
    journalRecord.deb_cred_type = 'C'; // TODO/FIXME
    journalRecord.trans_date = util.convertToMysqlDate(journalRecord.trans_date);
    journalRecord.fiscal_year_id = periodExerciceIdObject.fid;
    journalRecord.period_id = periodExerciceIdObject.pid;
    var req = "SELECT `creditor_group_id` FROM `creditor` WHERE `id`=" + db.escapestr(journalRecord.deb_cred_id) + ";\n";
    /*
    var sql = {
               'entities':[{'t':'creditor', 'c':['creditor_group_id']}],
               'cond':[{'t':'creditor', 'cl':'id', 'z':'=', 'v':journalRecord.deb_cred_id}]
              };
    var req = db.select(sql);
    */
    db.execute(req, function(err, data) {
      /*
      var sql = {
       'entities':[{'t':'creditor_group', 'c':['account_id']}],
       'cond':[{'t':'creditor_group', 'cl':'id', 'z':'=', 'v':data[0].creditor_group_id}]
      };
      */
      var sql = "SELECT `account_id` FROM `creditor_group` WEHRE `creditor_group`.`id`=" + data[0].creditor_group_id + ";\n";
      db.execute(sql, function (err, data) {
        journalRecord.account_id = data[0].account_id;
        insertData('posting_journal', journalRecord).then(function (resolve) {
          defer.resolve(resolve);
        });
      });
    });
    return defer.promise;
  }

  function process (data, posting, res, periodExerciceIdObject, service_name) {
    var obj = map[service_name];
    
    switch (service_name) {
      case 'sale' :
        Q.all([saleDebit(obj, data[0], posting, res, periodExerciceIdObject), saleCredit(obj, data, posting, res, periodExerciceIdObject), setPosted(obj.t, posting.id)]).then(function(arr) {
          if(arr[0].success===true && arr[1].success===true && arr[2] === true){
            res.send({status: 200, insertId: arr[1].info.insertId});
          }
        });
        break;
      case 'cash' :
        Q.all([cashDebit(obj, data, posting, res, periodExerciceIdObject), cashCredit(obj, data, posting, res, periodExerciceIdObject)]).then(function(arr) {    
          if(arr[0].success===true && arr[1].success===true){
            console.log('******************* on a gagne ***********************');
            res.send({status: 200, insertId: arr[1].info.insertId});
          } else {
            console.log("Something wrong: ", arr);
          }
        });
        break;
      case 'purchase' :
        Q.all([purchaseDebit(obj, data, posting, res, periodExerciceIdObject), purchaseCredit(obj, data[0], posting, res, periodExerciceIdObject), setPosted(obj.t, posting.id)]).then(function(arr) { 
          if(arr[0].success === true && arr[1].success === true && arr[2] === true){        
            res.send({status: 200, insertId: arr[1].info.insertId});
          }
        });
        break;
    }
  }

  function setPosted (table, id) { //used to be `check`
    var defer = Q.defer(),
        sql = "UPDATE " + db.escape(table) + " SET `posted`=1 WHERE `id`=" + db.escapestr(id) + ";\n";
    db.execute(sql, function (err, data) {
      defer.resolve(err ? false : true);
    });
    return defer.promise;
  }

  function getPeriodId (date, eid) {
    var defer = Q.defer();
    var mysqlDate = db.escapestr(util.convertToMysqlDate(date));
    var sql = "SELECT `period`.`id`, `fiscal_year_id` FROM `period` WHERE `period`.`period_start`<=" + mysqlDate + " AND `period`.`period_stop`>=" + mysqlDate + ";\n";
    db.execute(sql, function(err, data) {
        if (err) throw err;
        console.log('found', data);
        defer.resolve(data.length ? {success:true, fid:data[0].fiscal_year_id, pid:data[0].id} : {success : false});
    });
    return defer.promise;
  }

  function insertData (table, data) {
    var defer = Q.defer();
    generateTransId()
    .then(function (id) {
      data.trans_id = id; // add the trans id here ...
      console.log("\ndata:", data, "\n");
      delete data.id;
      var sql = parser.insert(table, data);
      db.execute(sql, function (err, result) {
        if(err) throw err;
        console.log('\nDATA POSTED!\n');
        defer.resolve(err ? {success : false, info: err} : {success : true, info: result});
      });
    });
    return defer.promise;
  }
  
  function generateTransId () {
    var defer = Q.defer(),
        sql = "SELECT MAX(`trans_id`) as `max` FROM `posting_journal`;\n";
    db.execute(sql, function (err, rows) {
      if (err) throw err;
      defer.resolve(rows[0].max + 1);
    });
    return defer.promise;
  }

  return self;

});
