// scripts/lib/logic/balance.js
var q = require('q');

// module: Balance

// Balance executes a series of general error checking
// functions and specific accounting logic before posting
// to the general ledger.  Any lines with dirty/invalid
// rows are retained as errors to be shipped back to the
// client and displayed.
//
// If there are not errors,  


function assert (statement) {
  return statement ? true : false;
}

module.exports = (function (db) {
  'use strict';

  var dict = {
      "account" : "invalid accounts detected: %s. account either not found in chart of accounts or locked.",
      "balance" : "credits and debits do not balance. credits: %c != debits: %d",
      "fiscal"  : "invalid fiscal year detected: %s. fiscal year either not found in fiscal years or locked.",
      "invpo"   : "invalid invoice or purchase order number: %s.",
      "defined" : "invalid debitor/creditor group: %s.",
      "general" : "internal server error.  Please examine the logs for further details."
  };

  // NOTE:
  //   All these should be updated accordingly when we update the general ledger and journal column
  //   names.

  var sql = {
    // are all accounts defined and not locked?
    account : "SELECT `posting_journal`.`id`, `account`.`id` FROM `posting_journal` LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` WHERE `account`.`locked`<>1;",
    // do the accounts balance?
    balance : "SELECT SUM(`posting_journal`.`credit`) AS `credit`, SUM(`posting_journal`.`debit`) AS `debit`, SUM(`posting_journal`.`debit_equiv`) AS `debit_equiv`, SUM(`posting_journal`.`credit_equiv`) AS `credit_equv` FROM `posting_journal`;",
    // are all the creditor/debitor groups + accounts defined
    defined : "SELECT `posting_journal`.`id`, `posting_journal`.`deb_cred_id` FROM `posting_journal` WHERE NOT EXISTS (SELECT `creditor_group`.`id` FROM `creditor_group` WHERE `creditor_group`.`account_id`=`posting_journal`.`deb_cred_id`) UNION (SELECT `debitor_group`.`id` FROM `debitor_group` WHERE `debitor_group`.`account_id`=`posting_journal`.`deb_cred_id`);",
    // are all fiscal years defined and not locked?
    fiscal  : "SELECT `fiscal_year`.`id`, `posting_journal`.`fiscal_year_id` FROM `posting_journal` LEFT JOIN `fiscal_year` ON `posting_journal`.`fiscal_year_id`=`fiscal_year`.`id` WHERE `fiscal_year`.`locked`<>1;",
    // are all periods defined and not locked?
    period  : "SELECT `period`.`id`, `posting_journal`.`period` FROM `posting_journal` LEFT JOIN `fiscal_year` ON `posting_journal`.`period`=`period`.`id` WHERE `period`.`locked`<>1;",
    // do the invoice/purchase orders exist?
    invpo   : "SELECT `posting_journal`.`id`, `posting_journal`.`invPoNum` FROM `posting_journal` WHERE NOT EXISTS (SELECT `purchase`.`id` FROM `purchase` WHERE `purchase`.`id`=`posting_journal`.`invPoNum`) UNION (SELECT `sale`.`id` FROM `sale` WHERE `sale`.`id`=`posting_journal`.`invPoNum`);"
  };
 
  var self = {};

  self.check = function (req, res, next) {

    var errors = [];

    // dirty checking
    
    function account () { 
      var d = q.defer(); 
      db.execute(sql.account, function (err, res) {
        if (err) throw err;
        if (res.length) {  // invalid accounts
          var detail = res.map(function (row) {
            console.log(row);
            return row.id;
          }).join();
          errors.push(dict.account.replace("%s", detail));
          d.resolve(true);
        }
      });
      return d.promise;
    }

    function defined () {
      var d = q.defer();
      db.execute(sql.defined, function (err, res) {
        if (err) throw err;
        if (res.length) {
          var detail = res.map(function (row) {
            console.log(row);
            return row.id;
          }).join();
          errors.push(dict.defined.replace("%s", detail));
          d.resolve(true);
        }
      });
      return d.promise;
    }

    function fiscal () {
      var d = q.defer();
      db.execute(sql.fiscal, function (err, res) {
        if (err) throw err;
        if (res.length) {
          var detail = res.map(function (row) {
            console.log(row);
            return row.id;
          }).join();
          errors.push(dict.fiscal.replace("%s", detail));
          d.resolve(true);
        }
      });
      return d.promise;
    }

    function period () {
      var d = q.defer();
      db.execute(sql.period, function (err, res) {
        if (err) throw err;
        if (res.length) {
          var detail = res.map(function (row) {
            console.log(row);
            return row.id;
          }).join();
          errors.push(dict.period.replace("%s", detail));
          d.resolve(true);
        }
      });
      return d.promise;
    }

    function invpo () {
      var d = q.defer();
      db.execute(sql.invpo, function (err, res) {
        if (err) throw err;
        if (res.length) {
          var detail = res.map(function (row) {
            console.log(row);
            return row.id;
          }).join();
          errors.push(dict.invpo.replace("%s", detail));
          d.resolve(true);
        }
      });
      return d.promise; 
    }

    // logic checking

    function balance () {
      var d = q.defer();
      db.execute(sql.balance, function (err, res) {
        if (err) throw err;
        if (res.debit !== res.credit) {
          errors.push(dict.balance.replace('%c', res.debit).replace('%d', res.credit));
          d.resolve(false);
        }
        d.resolve(true);
      });
      return d.promise; 
    }

    return [
      account(),
      defined(),
      invpo(),
      period(),
      fiscal(),
      balance()
    ];

  };

});
