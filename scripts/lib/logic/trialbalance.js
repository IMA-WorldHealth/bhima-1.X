// scripts/lib/logic/balance.js

// module: TrialBalance 
var q = require('q'),
    sanitize = require('../util/sanitize'),
    util = require('../util/util');

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

  var keys = {};

  function generateKey (user_id) {
    // generates a self-removing key by hashing the user_id
    // with the current date.  Expires in 25 seconds.
    var key = user_id ^ new Date().valueOf();
    keys[key] = true;
    setTimeout(function () {
      delete keys[key];
    }, 25000);
    return key;
  }

  function validateKey (key) {
    return keys[key];
  }

  // utilities for syntactic sugar
  
  function map (array, column) {
    // shorthand to return an array of just
    // the data in array.i[column];
    return array.map(function (row) { return row[column]; });
  }

  function join (array, s) {
    return ['(', array.join(s || ', '), ')'].join('');
  }

  function trialBalance (user_id, callback) {
    // Takes in a callback function which is
    // only fired when all test are complete.

    console.log('\nStarting trial balance\n');

    q.allSettled([
      areAccountsLocked(),
      areAccountsNull(),
      areAllDatesValid(),
      areCostsBalanced(),
      //areDebitorCreditorDefined()
    ])
    .then(function (array) {
      console.log('\nAll trial balance tests run\n');

      var results = {
        errors : [],
        data : [] 
      };

      // Loop through promises and college failure reasons
      array.forEach(function (promise) {
        if (promise.state == 'rejected') results.errors.push(promise.reason);
      });

      var sql = 'SELECT `pt`.`id`,  `pt`.`debit`, `pt`.`credit`, '  +
        '`pt`.`account_id`, `pt`.`balance`, `account`.`account_number` ' +
        'FROM  account JOIN ( ' +
          'SELECT `posting_journal`.`id`, SUM(`debit_equiv`) AS `debit`, SUM(`credit_equiv`) AS `credit`, ' +
          '`posting_journal`.`account_id`, (`period_total`.`debit` - `period_total`.`credit`) AS `balance` ' +
          'FROM posting_journal LEFT JOIN `period_total` ' +
          'ON `posting_journal`.`account_id` = `period_total`.`account_id` ' +
          'GROUP BY `posting_journal`.`account_id` ' +
          ') AS `pt` ' +
        'ON `account`.`id`=`pt`.`account_id`;';

      db.execute(sql, function (err, rows) {
        if (err) return callback(err);
       
        results.data = rows; 
        results.key = generateKey(user_id);
        return callback(null, results);
      });

    })
    .done();
  }


  // Tests

  // Tries to find locked accounts
  function areAccountsLocked () {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id` ' +
      'FROM `posting_journal` LEFT JOIN `account` ' +
      'ON  `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`locked`=1;';

    db.execute(sql, function (err, rows) {
      if (err) d.reject(err);
      if (rows.length) 
        d.reject('Locked accounts in line(s) :' + join(map(rows, 'id')));
      d.resolve();
    });
    
    return d.promise;
  }

  // are all accounts defined??
  function areAccountsNull () {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id` ' + 
      'FROM `posting_journal` ' +
      'LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`id` IS NULL;';

    db.execute(sql, function (err, res) {
      if (err) d.reject(err);
      if (res.length) 
        d.reject('Invalid or undefined accounts in transcation(s) :' + join(map(rows, 'id')));

      d.resolve();
    });

    return d.promise;
  }

  function areAllDatesValid () {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id`, `period_id`, `trans_date`, `period_start`, `period_stop` ' +
      'FROM `posting_journal` JOIN `period` ' + 
      'ON `posting_journal`.`period_id`=`period`.`id`;';

    db.execute(sql, function (err, rows) {
      if (err) d.reject(err);

      var bool = rows.filter(function (row) {
        return !(new Date (row.trans_date) > new Date(row.period_start) && new Date (row.trans_date) < new Date(row.period_stop));
      });

      if (bool.length)
        d.reject('Invalid dates for line(s): ' + join(map(bool, 'id')));

      d.resolve();
    });

    return d.promise; 
  }

  function areCostsBalanced () {
    var d = q.defer();
    var sql = 
      'SELECT `posting_journal`.`id`, sum(debit) as d, sum(credit) as c, sum(debit_equiv) as de, sum(credit_equiv) as ce ' +
      'FROM posting_journal ' +
      'GROUP BY `trans_id`;';

    db.execute(sql, function (err, rows) {
      if (err) d.reject(err);

      var bool = rows.filter(function (row) {
        return !(row.d === row.c && row.de === row.ce);
      });

      if (bool.length)
        d.reject('Debits and Credits (or equivalents) do not balance in lines(s) : ' + join(map(bool, 'id')));

      d.resolve();

    });

    return d.promise;
  }

  function areDebitorCreditorDefined () {
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
      if (err) d.reject(err);

      if (rows.length) 
        d.reject('Debitor/Creditors do not exist for line(s) : ' + join(rows.map(function (row) { return row.id; })));

      d.resolve();

    });

    return d.promise;
  }

  function checkPermission (user_id, key, callback) {
    // TODO / FIXME : we need to come up with a robust
    // permissions model that will disallow just anyone 
    // from posting to the journal.
    
    // First thing we need to do is see if the key is
    // expired.  If so, we should warn the client to do
    // another trial balance.
    var valid = validateKey(key);

    if (!valid) return callback(new Error('Posting Session Expired.  Please refresh the trial balance.'));
    
    var sql = 'SELECT 1 + 1 AS s';

    db.execute(sql, function (err, rows) {
      if (err) return callback(err);
      callback(null, rows);
    });

  }


  function postToGeneralLedger (user_id, key, callback) {
    // This function posts data from the journal into the general ledger.
    var defer = q.defer();

    // First thing we need to do is make sure that this posting request
    // is not an error and comes from a valid user.
    checkPermission(user_id, key, function (err, result) {
      if (err) return callback(err); 
     
      // Next, we need to generate a posting session id.
      var sql = 'INSERT INTO `posting_session` ' +
        'SELECT max(`posting_session`.`id`) + 1, ' + sanitize.escape(user_id) + ', ' +
        sanitize.escape(util.toMysqlDate()) + ' ' +
        'FROM `posting_session`;';

      db.execute(sql, function (err, rows) {
        if (err) return callback(err);

        var session_id = rows.insertId;

        // Next, we must move the data into the general ledger.
        
        var query = 
          'INSERT INTO `general_ledger` ' +
            '(`enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' + 
            '`currency_id`, `deb_cred_id`, `deb_cred_type`, `inv_po_id`, `comment`, `cost_ctrl_id`, ' +
            '`origin_id`, `user_id`, `session_id`)' +
          'SELECT `enterprise_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
            '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
            '`deb_cred_id`, `deb_cred_type`,`inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id`, ' +
            session_id + ' ' +
          'FROM `posting_journal`;';

        db.execute(query, function (err, results) {
          if (err) return callback (err);
          
          // This SQL sums all transactions for a given period from the PJ into `period_total`, updating old values if necessary
          var sql = 'INSERT INTO `period_total` (`account_id`, `credit`, `debit`, `fiscal_year_id`, `enterprise_id`, `period_id`) ' + 
                    'SELECT `account_id`, SUM(`credit`), SUM(`debit`), `fiscal_year_id`, `enterprise_id`, `period_id` FROM `posting_journal` ' +
                    'GROUP BY `account_id` ' +
                    'ON DUPLICATE KEY UPDATE `credit` = `credit` + VALUES(`credit`), `debit` = `debit` + VALUES(`debit`);';

          db.execute(sql, function (err, rows) {
            if (err) return callback(err); 

            // Finally, we can remove the data from teh posting journal 
            var sql = 'DELETE FROM `posting_journal`;';
            
            db.execute(sql, function (err, results) {
              if (err) return callback(err);
              callback(null, results);
              return;
            });
          });
        });
      });
    });
  }

  return {
    run: trialBalance,
    postToGeneralLedger: postToGeneralLedger
  };

});
