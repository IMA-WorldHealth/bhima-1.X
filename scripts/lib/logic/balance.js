// scripts/lib/logic/balance.js
var q = require('q');

// module: Balance
module.exports = (function (db) {
  'use strict';
 
  var self = {},
      tests = {},
      reply = { bool: '', error: ''};


  var account = tests.account = {};

  // are all columns defined?
  tests.allAccountsDefined = function (data) {
    var bool, sql, dfr = q.defer();

    // get all the columns of the general ledger table
    sql = 'DESCRIBE `gl`;';
    db.execute(sql, function (err, res) {
      bool = res.every(function (row) {
        return row.Field in data;
      });
      dfr.resolve(bool);
    });

    return dfr.promise;
  };

  // are all values in field non-zero?
  tests.nonnegativeValues = function (data, field) {
    var bool, dfr = q.defer();

    bool = data.every(function (row) {
      return row[data] > -1;
    });
    dfr.resolve(bool);

    return dfr.promise;
  };

  // are all accounts defined?
  tests.accountAvailable = function (data, field) {
    var bool, sql,
        accounts = Object.keys(data[field]),
        dfr = q.defer();

    // find locked and 
    sql = "SELECT `id` FROM `account` WHERE `account`.`locked`<>1;";
    db.execute(sql, function (err, res) {
      if (err) throw err;
      bool = res.every(function (row) {
        return accounts.indexOf(row.id) > -1;
      });
      dfr.resolve(bool); 
    });
    
    return dfr.promise;
  };

  self.check = function (params, callback) {
    // A couple params need to be defined.  In particular:
    //  (1) Enterprise_id
    //  (2) User_id
    // In order to generate a trial balance

    var sql = {};
    // question: should be break this out to being two checks:
    //  (1) existing account? 
    //  (2) account not locked ?
    sql.validAccount = "SELECT `posting_journal`.`id`, `account`.`id` FROM `posting_journal` LEFT JOIN `account` ON `posting_journal`.`account`=`account`.`id` WHERE `account`.`locked`<>1;";
    sql.balance = "SELECT SUM(`posting_journal`.`credit`) AS `credits`, SUM(`posting_journal`.`debit`) AS `debits`, SUM(`posting_journal`.`debit_equiv`) AS `debits_eqiv`, SUM(`posting_journal`.`credit_equiv`) AS `credits_equiv` FROM `posting_journal`;";
    sql.invpo = "SELECT `posting_journal`.`id`, `posting_journal`.`invpo` FROM `posting_journal` WHERE NOT EXISTS (SELECT `purchase`.`id` FROM `purchase` WHERE `purchase`.`id`=`posting_journal`.`invpo`) UNION (SELECT `sale`.`id` FROM `sale` WHERE `sale`.`id`=`posting_journal`.`invpo`);";
    sql.definedARAP = "SELECT `posting_journal`.`id`, `posting_journal`.`ARAP` FROM `posting_journal` WHERE NOT EXISTS (SELECT `creditor`.`id` FROM `creditor` WHERE `creditor`.`id`=`posting_journal`.`ARAP`) UNION (SELECT `debitor`.`id` FROM `debitor` WHERE `debitor`.`id`=`posting_journal`.`ARAP`);";
    // Eventually, use MonthTotals table one it is defined
    sql.report = "SELECT `posting_journal`.`account_id` AS `account`, SUM(`gl`.`account_id`) AS `before`, SUM(`posting_journal`.`debitAmount`) AS `debit`, SUM(`posting_journal`.`creditAmount`) AS `credit`, (SUM(`gl`.`account_id`) + SUM(`posting_journal`.`debitAmount`) - SUM(`posting_journal`.`creditAmount`)) AS `after` FROM `posting_journal` JOIN `gl` ON `posting_journal`.`account_id`=`gl`.`account_id`;";
    
  }; 


});
