// scripts/lib/logic/trialbalance.js

// Module: TrialBalance
//
// Trial Balance executes a series of general error checking
// functions and specific accounting logic before posting
// to the general ledger.  Any lines with dirty/invalid
// rows are retained as errors to be shipped back to the
// client and displayed.
//
// If there are no errors, the module proceeds to post
// rows from the journal into the general ledger.

var q = require('q'),
    sanitize = require('../util/sanitize'),
    util = require('../util/util'),
    uuid = require('../util/guid');


var error = (function () {

  function _error (code, msg, details, action) {
    this.code = code;
    this.message = msg;
    this.action = action;
    this.details = details;
  }

  _error.prototype = Error.prototype;

  return _error;
})();

function KeyRing () {
  var keyStore = {};

  this.generate = function generate (userId) {
    var k = uuid();
    keyStore[userId] = {};
    keyStore[userId][k] = 1;
    setTimeout(function () {
      delete keyStore[userId][k];
    }, 25000);
    return k;
  };

  this.validate = function validate (userId, key) {
    return !!keyStore[userId][key];
  };
}


module.exports = function (db) {
  'use strict';

  var keys = new KeyRing();

  function trialBalance (userId, callback) {
    // Takes in a callback function which is
    // only fired when all test are complete.

    var results = {},
        errors,
        data;

    q.allSettled([
      areAccountsLocked(),
      areAccountsNull(),
      areAllDatesValid(),
      areCostsBalanced()
    ])
    .then(function (promises) {
      // Loop through promises and collect failure reasons
      errors = promises
      .filter(function (promise) {
        return promise.state === 'rejected';
      })
      .map(function (promise) {
        return promise.reason;
      });

      var sql = 'SELECT `pt`.`uuid`,  `pt`.`debit`, `pt`.`credit`, '  +
        '`pt`.`account_id`, `pt`.`balance`, `account`.`account_number` ' +
        'FROM  account JOIN ( ' +
          'SELECT `posting_journal`.`uuid`, SUM(`debit_equiv`) AS `debit`, SUM(`credit_equiv`) AS `credit`, ' +
          '`posting_journal`.`account_id`, (`period_total`.`debit` - `period_total`.`credit`) AS `balance` ' +
          'FROM posting_journal LEFT JOIN `period_total` ' +
          'ON `posting_journal`.`account_id` = `period_total`.`account_id` ' +
          'GROUP BY `posting_journal`.`account_id` ' +
          ') AS `pt` ' +
        'ON `account`.`id`=`pt`.`account_id`;';

      return db.exec(sql);
    })
    .then(function (rows) {
      results.data = rows;
      results.errors = errors;
      results.key = keys.generate(userId);
      callback(null, results);
    })
    .catch(function (err) {
      callback(err);
    })
    .done();
  }


  // Tests
  // Tries to find locked accounts
  function areAccountsLocked () {
    var d = q.defer();
    var sql =
      'SELECT `posting_journal`.`uuid`, `posting_journal`.`trans_id` ' +
      'FROM `posting_journal` LEFT JOIN `account` ' +
      'ON  `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`locked`=1;';

    db.execute(sql, function (err, rows) {
      if (err) { d.reject(new error('ERR_SQL', 'An error occured in the SQL query.', [], 'Please contact a system administrator')); }
      if (rows.length) { d.reject(new error('ERR_ACCNT_LOCKED', 'There are transactions on locked accounts', rows)); }
      d.resolve();
    });

    return d.promise;
  }

  // are all accounts defined??
  function areAccountsNull () {
    var d = q.defer();
    var sql =
      'SELECT `posting_journal`.`uuid`, `posting_journal`.`trans_id` ' +
      'FROM `posting_journal` ' +
      'LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` ' +
      'WHERE `account`.`id` IS NULL;';

    db.execute(sql, function (err, rows) {
      if (err) { d.reject(new error('ERR_SQL', 'An error occured in the SQL query.', [], 'Please contact a system administrator')); }
      if (rows.length) { d.reject(new error('ERR_ACCNT_NULL', 'Invalid or undefined accounts detected', rows)); }
      d.resolve();
    });

    return d.promise;
  }

  function areAllDatesValid () {
    var d = q.defer();
    var sql =
      'SELECT `posting_journal`.`uuid`, `period_id`, `trans_date`, `period_start`, `period_stop` ' +
      'FROM `posting_journal` JOIN `period` ' +
      'ON `posting_journal`.`period_id`=`period`.`id`;';

    db.execute(sql, function (err, rows) {
      if (err) { d.reject(new error('ERR_SQL', 'An error occured in the SQL query.', [], 'Please contact a system administrator')); }
      var outliers = rows.filter(function (row) {
        return !(new Date (row.trans_date) >= new Date(row.period_start) && new Date (row.trans_date) <= new Date(row.period_stop));
      });
      if (outliers.length) { d.reject(new error('ERR_INVALID_DATE', 'The dates do not match the periods', outliers)); }

      d.resolve();
    });

    return d.promise;
  }

  function areCostsBalanced () {
    var d = q.defer();
    var sql =
      'SELECT `posting_journal`.`uuid`, sum(debit) as d, sum(credit) as c, ' +
      'sum(debit_equiv) as de, sum(credit_equiv) as ce, `posting_journal`.`trans_id` ' +
      'FROM posting_journal ' +
      'GROUP BY `trans_id`;';

    db.execute(sql, function (err, rows) {
      if (err) { d.reject(new error('ERR_SQL', 'An error occured in the SQL query.', [], 'Please contact a system administrator')); }
      var outliers = rows.filter(function (row) { return row.de !== row.ce; });
      if (outliers.length) { d.reject(new error('ERR_IMBALANCE', 'The debits and credits do not balance for some transactions', outliers)); }
      d.resolve();
    });

    return d.promise;
  }

  function areDebitorCreditorDefined () {
    var d = q.defer();
    var sql =
      'SELECT `posting_journal`.`uuid`, `posting_journal`.`trans_id` ' +
      'FROM `posting_journal` ' +
      'WHERE NOT EXISTS (' +
        '(' +
          'SELECT `creditor`.`uuid`, `posting_journal`.`deb_cred_uuid` ' +
          'FROM `creditor` JOIN `posting_journal` ' +
          'ON `creditor`.`uuid`=`posting_journal`.`deb_cred_uuid`' +
        ') UNION (' +
          'SELECT `debitor`.`uuid`, `posting_journal`.`deb_cred_uuid` '+
          'FROM `debitor` JOIN `posting_journal` ON `debitor`.`uuid`=`posting_journal`.`deb_cred_uuid`' +
        ')' +
      ');';

    db.execute(sql, function (err, rows) {
      if (err) { d.reject(new error('ERR_SQL', 'An error occured in the SQL query.', [], 'Please contact a system administrator')); }
      if (rows.length) { d.reject(new error('ERR_DEB_CRED_DNE', 'Debitor or creditors do not exist for some transcations')); }
      d.resolve();
    });

    return d.promise;
  }

  function checkPermission (userId, key) {
    var sql = 'SELECT 1 + 1 AS s';

    return q(keys.validate(userId, key))
    .then(function (bool) {
      if (!bool) { throw new error('ERR_EXPIRED_SESSION', 'Posting session expired', [], 'Refresh the trial balance'); }
      return db.exec(sql);
    });
  }


  function postToGeneralLedger (userId, key, callback) {
    // Posts data from the journal into the general ledger.
    var sql, defer = q.defer();

    sql =
      'INSERT INTO `posting_session` ' +
      'SELECT max(`posting_session`.`id`) + 1, ' + sanitize.escape(userId) + ', ' +
      sanitize.escape(util.toMysqlDate()) + ' ' +
      'FROM `posting_session`;';

    // First thing we need to do is make sure that this posting request
    // is not an error and comes from a valid user.
    checkPermission(userId, key)
    .then(function (res) {
      // Next, we need to generate a posting session id.
      return db.exec(sql);
    })
    .then(function (res) {
      // Next, we must move the data into the general ledger.
      var session_id = res.insertId;
      sql =
        'INSERT INTO `general_ledger` ' +
          '(`project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `comment`, `cost_ctrl_id`, ' +
          '`origin_id`, `user_id`, `session_id`) ' +
        'SELECT `project_id`, `uuid`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
          '`deb_cred_uuid`, `deb_cred_type`,`inv_po_id`, `comment`, `cost_ctrl_id`, `origin_id`, `user_id`, ' +
          session_id + ' ' +
        'FROM `posting_journal`;';
      return db.exec(sql);
    })
    .then(function (res) {
      // This SQL sums all transactions for a given period from the PJ into `period_total`, updating old values if necessary
      sql =
        'INSERT INTO `period_total` (`account_id`, `credit`, `debit`, `fiscal_year_id`, `enterprise_id`, `period_id`) ' +
        'SELECT `account_id`, SUM(`credit`), SUM(`debit`), `fiscal_year_id`, `project`.`enterprise_id`, ' +
          '`period_id` FROM `posting_journal` JOIN `project` ON `posting_journal`.`project_id`=`project`.`id` ' +
        'GROUP BY `account_id` ' +
        'ON DUPLICATE KEY UPDATE `credit` = `credit` + VALUES(`credit`), `debit` = `debit` + VALUES(`debit`);';

      db.exec(sql);
    })
    .then(function (res) {
      // Finally, we can remove the data from teh posting journal
      sql = 'DELETE FROM `posting_journal`;';
      return db.execute(sql);
    })
    .then(function (res) {
      callback(null, res);
    })
    .catch(function (err) {
      callback(err);
    })
    .done();
  }

  return {
    run: trialBalance,
    postToGeneralLedger: postToGeneralLedger
  };

};
