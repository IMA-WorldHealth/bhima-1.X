// scripts/lib/logic/balance.js

// module: TrialBalance 
var q = require('q');

// Trial Balance executes a series of general error checking
// functions and specific accounting logic before posting
// to the general ledger.  Any lines with dirty/invalid
// rows are retained as errors to be shipped back to the
// client and displayed.
//
// If there are no errors, the module proceeds to post
// rows from the journal into the general ledger.

// TODO : Clean up this code immensely

module.exports = (function (db) {
  'use strict';

  function run (ids, callback) {
    // this takes in an array of ids and a callback function which is
    // only fired when all test are complete.
   
    // preprocessing
    ids = ids.map(function (id) { return db.escapestr(id); });

    var postErrs = [];
    var sysErrs = [];

    var data = {
      sysErrors : [],
      postErrors : [],
      data : []
    };

    q.all([
      areAccountsLocked(ids),
      areAccountsNull(ids),
      areAllDatesValid(ids),
      areCostsBalanced(ids),
      areDebitorCreditorDefined(ids)
    ].map(function (promise, idx) {
      var d = q.defer();

      promise.then(function () {
        console.log('Resolving idx:', idx);
        d.resolve();
      }, function (err) {
        if (err.sysErr) data.sysErrs.push(err.sysErr);
        if (err.postErr) data.postErrs.push(err.postErr);
        console.log('Resolving idx:', idx);
        d.resolve();
      });

      return d.promise;
    }))
    .done(function () {
      var sql =
        'SELECT `posting_journal`.`id`,  SUM(`debit_equiv`) AS `debit`, SUM(`credit_equiv`) AS `credit`, '+
        '`posting_journal`.`account_id`, (`period_total`.`debit` - `period_total`.`credit`) AS `balance` ' +
        'FROM `posting_journal` LEFT JOIN `period_total` ' + 
        'ON `posting_journal`.`account_id`=`period_total`.`account_id` ' + 
        'GROUP BY `posting_journal`.`account_id`;';
      db.execute(sql, function (err, result) {
        if (err) {
          data.sysErrors.push(err);
        } else {
          data.data = result;
        } 

        return callback(null, data);
      });
    });
  }


  // utilities 
  
  function map (array, column) {
    // shorthand to return an array of just
    // the data in array.i[column];
    return array.map(function (row) { return row[column]; });
  }

  function join (array, s) {
    return ['(', array.join(s || ', '), ')'].join('');
  }

  // Tests

  // Tries to find locked accounts
  function areAccountsLocked (ids) {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id` ' +
      'FROM `posting_journal` LEFT JOIN `account` ' +
      'ON  `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`locked`=1 AND `posting_journal`.`trans_id` IN ' + join(ids) + ';';

    db.execute(sql, function (err, rows) {
      if (err) 
        return d.reject({'sysErr' : err});

      if (rows.length) 
        return d.reject({'postErr' :  'Locked accounts in transaction(s) :' + join(map(rows, 'id'))});

      d.resolve();
    });
    
    return d.promise;
  }

  // are all accounts defined??
  function areAccountsNull (ids) {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id` ' + 
      'FROM `posting_journal` ' +
      'LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`id` IS NULL AND ' + 
      '`posting_journal`.`trans_id` IN ' + join(ids) + ';';

    db.execute(sql, function (err, res) {
      if (err) 
        return d.reject({'sysErr' : err});

      if (res.length) 
        return d.reject({'postErr' : 'Invalid or undefined accounts in transcation(s) :' + join(map(rows, 'id'))});

      d.resolve();
    });

    return d.promise;
  }

  function areAllDatesValid (ids) {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id`, `period_id`, `trans_date`, `period_start`, `period_stop` ' +
      'FROM `posting_journal` JOIN `period` ' + 
      'ON `posting_journal`.`period_id`=`period`.`id` ' + 
      'WHERE `trans_id` IN ' + join(ids) + ';';
    db.execute(sql, function (err, rows) {
      if (err) 
        return d.reject({'sysErr' : err});

      var bool = rows.filter(function (row) {
        return !(new Date (row.trans_date) > new Date(row.period_start) && new Date (row.trans_date) < new Date(row.period_stop));
      });

      if (bool.length)
        return d.reject({'postErr' : 'Invalid dates for transaction(s): ' + join(map(bool, 'id'))});

      d.resolve();
    });

    return d.promise; 
  }

  function areCostsBalanced (ids) {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id`, sum(debit) as d, sum(credit) as c, sum(debit_equiv) as de, sum(credit_equiv) as ce ' +
      'FROM posting_journal ' +
      'WHERE `trans_id` IN ' + join(ids) + ' ' +
      'GROUP BY `trans_id`;';

    db.execute(sql, function (err, rows) {
      if (err) 
        return d.reject({'sysErr' : err});

      var bool = rows.filter(function (row) {
        return !(row.d === row.c && row.de === row.ce);
      });

      if (bool.length)
        return d.reject({'postErr': 'Debits and Credits (or equivalents) do not balance in transaction(s) : ' + join(map(bool, 'id')) });

      d.resolve();

    });

    return d.promise;
  }

  function areDebitorCreditorDefined (ids) {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id` ' +
      'FROM `posting_journal` ' +
      'WHERE NOT EXISTS (' + 
        '(' + 
          'SELECT `creditor`.`id`, `posting_journal`.`deb_cred_id` ' +
          'FROM `creditor` JOIN `posting_journal` ' + 
          'ON `creditor`.`id`=`posting_journal`.`deb_cred_id`' +
        ') UNION (' + 
          'SELECT `debitor`.`id`, `posting_journal`.`deb_cred_id` '+
          'FROM `debitor` JOIN `posting_journal` ON `debitor`.`id`=`posting_journal`.`deb_cred_id`' +
        ')' +
      ');';

    db.execute(sql, function (err, rows) {
      if (err)
        return d.reject({'sysErr' : err });
      
      if (rows.length) 
        return d.reject({'postErr' : 'Debitor/Creditors do not exist for transaction(s) : ' + join(rows.map(function (row) { return row.id; })) });

      d.resolve();

    });

    return d.promise;
  }







  function errorChecking () {

    var errors = {
      'account_defined'            : '%number% Invalid Accounts Detected.',
      'account_locked'             : '%number% Locked Accounts Detected.',
      'balance'                    : 'Credits and debits do not balance.',
      'fiscal_defined'             : 'Invalid Fiscal Year Detected for %number% transaction(s).',
      'period_defined'             : 'Invalid Periods Detected for %number% transaction(s).',
      'inventory_purchase_defined' : 'Invalid invoice or purchase order number at line %number%.',
      'debitor_creditor_defined'   : '%number% Invalid Debitor/Creditor Groups.'
    };

    var queries = {
      // are all accounts defined?
      account_defined : 'SELECT `posting_journal`.`id` FROM `posting_journal` LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` WHERE `account`.`id` IS NULL;',
      // are any accounts locked?
      account_locked : 'SELECT `posting_journal`.`id` FROM `posting_journal` LEFT JOIN `account` ON  `posting_journal`.`account_id`=`account`.`id` WHERE `account`.`locked`=1;',
      // are all the creditor/debitor groups + accounts defined
      debitor_creditor_defined : 'SELECT `posting_journal`.`id` FROM `posting_journal` WHERE NOT EXISTS ((SELECT `creditor`.`id`, `posting_journal`.`deb_cred_id` FROM `creditor`, `posting_journal` WHERE `creditor`.`id`=`posting_journal`.`deb_cred_id`) UNION (SELECT `debitor`.`id`, `posting_journal`.`deb_cred_id` FROM `debitor`, `posting_journal` WHERE `debitor`.`id`=`posting_journal`.`deb_cred_id`));',
      // are all fiscal years defined and not locked?
      fiscal_defined : 'SELECT `posting_journal`.`id` FROM `posting_journal` LEFT JOIN `fiscal_year` ON `posting_journal`.`fiscal_year_id`=`fiscal_year`.`id` WHERE `fiscal_year`.`locked`=1;',
      // are all periods defined and not locked?
      period_defined : 'SELECT `posting_journal`.`id` FROM `posting_journal` LEFT JOIN `period` ON `posting_journal`.`period_id`=`period`.`id` WHERE `period`.`locked`=1;',
      // do the invoice/purchase orders exist?
      invoice_purchase_defined : 'SELECT `posting_journal`.`id` FROM `posting_journal` WHERE NOT EXISTS ((SELECT `purchase`.`id`, `posting_journal`.`inv_po_id` FROM `purchase`, `posting_journal` WHERE `purchase`.`id`=`posting_journal`.`inv_po_id`) UNION (SELECT `sale`.`id`, `posting_journal`.`inv_po_id` FROM `sale`, `posting_journal` WHERE `sale`.`id`=`posting_journal`.`inv_po_id`));',
      // is the posting_journal balanced?
      balance : 'SELECT SUM(`posting_journal`.`credit`) AS `credit`, SUM(`posting_journal`.`debit`) AS `debit`, SUM(`posting_journal`.`debit_equiv`) AS `debit_equiv`, SUM(`posting_journal`.`credit_equiv`) AS `credit_equv` FROM `posting_journal`;'
    };




    function fiscal_defined () {
      var d = q.defer(), error = {};

      db.execute(queries.fiscal_defined, function (err, res) {
        if (res.length) {
          error.message = errors.fiscal_defined.replace('%number%', res.length);
          error.rows = res.map(function (row) { return row.id; });
        }
        return error.message ? d.reject(error) : d.resolve();
      });
      return d.promise;
    }

    function period_defined () {
      var d = q.defer(), error = {};

      db.execute(queries.period_defined, function (err, res) {
        if (res.length) {
          error.message = errors.period_defined.replace('%number%', res.length);
          error.rows = res.map(function (row) { return row.id; });
        }
        return error.message ? d.reject(error) : d.resolve();
      });
      return d.promise;
    }

    function invoice_purchase_defined () {
      var d = q.defer(), error = {};

      db.execute(queries.invoice_purchase_defined, function (err, res) {
        if (res.length) {
          error.message = errors.invoice_purchase_defined.replace('%number%', res.length);
          error.rows = res.map(function (row) { return row.id; });
        }
        return error.message ? d.reject(error) : d.resolve();
      });

      return d.promise;
    }

  }

  function trial () {
    var defer = q.defer(),
        sql = {};

    function formatResults (gl, journal) {
      return { credit : gl.credit  + journal.credit, debit : gl.debit + journal.debit };
    }

    sql.gl_balance = 'SELECT SUM(`debit`) AS `debit`, SUM(`credit`) AS `credit` FROM `general_ledger`';

    sql.journal_balance = 'SELECT SUM(`debit`) AS `debit`, SUM(`credit`) AS `credit` FROM `posting_journal`';

    errorChecking()
    .then(function () {

      db.execute(sql.gl_balance, function (err, res) {
        if (err) defer.reject(err);
        db.execute(sql.journal_balance, function (error, results) {
          if (error) defer.reject(error);
          else {
            // ensure proper formatting
            // TODO: clean up this code
            var gl_after_balance = formatResults(res[0], results[0]);
            var object = {
              gl_balance : res[0],
              gl_after_balance : gl_after_balance,
            };
           defer.resolve(object);
          }
        });
      });
      
    }, function (reason) {
      defer.reject(reason);
    });

    return defer.promise;
  }

  function setTotals () {
    var defer = q.defer();

    // This SQL sums all transactions for a given period from the PJ into `period_total`, updating old values if necessary
    var sql = 'INSERT INTO `period_total` (`account_id`, `credit`, `debit`, `fiscal_year_id`, `enterprise_id`, `period_id`) ' + 
              'SELECT `account_id`, SUM(`credit`), SUM(`debit`), `fiscal_year_id`, `enterprise_id`, `period_id` FROM `posting_journal` GROUP BY `account_id` ' +
              'ON DUPLICATE KEY UPDATE `credit` = `credit` + VALUES(`credit`), `debit` = `debit` + VALUES(`debit`);';

    db.execute(sql, function (err, result) {
      if (err) defer.reject(err);
      defer.resolve(result);
    });

    return defer.promise;
  
  }

  function post () {

    var defer = q.defer(),
        sql = {};
    
    sql.transfer = ['INSERT INTO `general_ledger` (`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id`)', 'SELECT `enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, `description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, `deb_cred_id`, `deb_cred_type`,`inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id` FROM `posting_journal`;'].join(' ');
    sql.remove = 'DELETE FROM `posting_journal`;';

    setTotals().then(function (res) {
      db.execute(sql.transfer, function(err, res) {
        if (err) defer.reject(err);
        else {
          db.execute(sql.remove, function (error, res) {
            if (err) defer.reject(error);
            defer.resolve(res);
          });
        }
      });
    }, function (err) {
      if (err) defer.reject(err);
    });

    return defer.promise;
  }

  return { run: run, trial: trial, post: post };
});
