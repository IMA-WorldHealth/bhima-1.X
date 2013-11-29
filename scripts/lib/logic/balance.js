// scripts/lib/logic/balance.js
var async = require('async');

// module: Balance

// Balance executes a series of general error checking
// functions and specific accounting logic before posting
// to the general ledger.  Any lines with dirty/invalid
// rows are retained as errors to be shipped back to the
// client and displayed.
//
// If there are not errors,  


module.exports = (function (db) {
  'use strict';

  var dict = {
      "account" : "invalid accounts detected: %s. account either not found in chart of accounts or locked.",
      "balance" : "credits and debits do not balance. credits: %c != debits: %d",
      "fiscal"  : "invalid fiscal year detected: %s. fiscal year either not found in fiscal years or locked.",
      "period"  : "invalid period detected: %s. Period either not found in periods or locked.",
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
    defined : "SELECT `posting_journal`.`id`, `posting_journal`.`deb_cred_id` FROM `posting_journal` WHERE NOT EXISTS ((SELECT `creditor`.`id`, `posting_journal`.`deb_cred_id` FROM `creditor`, `posting_journal` WHERE `creditor`.`id`=`posting_journal`.`deb_cred_id`) UNION (SELECT `debitor`.`id`, `posting_journal`.`deb_cred_id` FROM `debitor`, `posting_journal` WHERE `debitor`.`id`=`posting_journal`.`deb_cred_id`));",
    // are all fiscal years defined and not locked?
    fiscal  : "SELECT `fiscal_year`.`id`, `posting_journal`.`fiscal_year_id` FROM `posting_journal` LEFT JOIN `fiscal_year` ON `posting_journal`.`fiscal_year_id`=`fiscal_year`.`id` WHERE `fiscal_year`.`locked`<>1;",
    // are all periods defined and not locked?
    period  : "SELECT `period`.`id`, `posting_journal`.`period_id` FROM `posting_journal` LEFT JOIN `period` ON `posting_journal`.`period_id`=`period`.`id` WHERE `period`.`locked`<>1;",
    // do the invoice/purchase orders exist?
    invpo   : "SELECT `posting_journal`.`id`, `posting_journal`.`inv_po_id` FROM `posting_journal` WHERE NOT EXISTS ((SELECT `purchase`.`id`, `posting_journal`.`inv_po_id` FROM `purchase`, `posting_journal` WHERE `purchase`.`id`=`posting_journal`.`inv_po_id`) UNION (SELECT `sale`.`id`, `posting_journal`.`inv_po_id` FROM `sale`, `posting_journal` WHERE `sale`.`id`=`posting_journal`.`inv_po_id`));"
  };
 
  var self = {};

  self.trial = function (req, res, next) {

    var errors = [];

    // dirty checking
    
    function account (callback) { 
      db.execute(sql.account, function (err, res) {
        var detail;
        if (res.length) {  // invalid accounts
          detail = res.map(function (row) {
            return row.id;
          }).join();
        }
        callback(err, res, dict.account.replace("%s", detail));
      });
    }

    function defined (callback) {
      db.execute(sql.defined, function (err, res) {
        var detail;
        if (res.length) {
          detail = res.map(function (row) {
            return row.id;
          }).join();
        }
        callback(err, res, dict.defined.replace("%s", detail));
      });
    }

    function fiscal (callback) {
      db.execute(sql.fiscal, function (err, res) {
        var detail;
        if (res.length) {
          detail = res.map(function (row) {
            return row.id;
          }).join();
        }
        callback(err, res, dict.fiscal.replace("%s", detail));
      });
    }

    function period (callback) {
      db.execute(sql.period, function (err, res) {
        var detail;
        if (res.length) {
          detail = res.map(function (row) {
            return row.id;
          }).join();
        }
        callback(err, res, dict.period.replace('%s', detail));
      });
    }

    function invpo (callback) {
      db.execute(sql.invpo, function (err, res) {
        var detail;
        if (res.length) {
          detail = res.map(function (row) {
            return row.id;
          }).join();
        }
        callback(err, res, dict.invpo.replace("%s", detail));
      });
    }

    // logic checking

    function balance (callback) {
      db.execute(sql.balance, function (err, res) {
        if (res.debit !== res.credit) {
          callback(err, res, dict.balance.replace('%c', res.debit).replace('%d', res.credit));
        }
        callback(err, res, null);
      });
    }


    // reporting
    
    (function report () {
      async.parallel([
        account,
        defined,
        invpo,
        period,
        fiscal,
        balance,
      ], function (err, response, str) {
         if (err) throw err;
         console.log("response:",response);
         console.log("str:", str);
         // res.send(200);
      });
    })();
    
  };

  return self;

});

/*
var cfg = JSON.parse(fs.readFileSync('scripts/config.json', 'utf8'));
var db = require('./scripts/lib/database/db')(cfg.db);
var balance = require('./scripts/lib/logic/balance')(db);
*/
