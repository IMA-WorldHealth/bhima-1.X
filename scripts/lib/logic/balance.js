// scripts/lib/logic/balance.js
var q = require('q');

// module: Balance
module.exports = (function (db) {
  'use strict';
 
  var self = {},
      tests = {},
      reply = { bool: '', error: ''};

  self.check = function (req, res, callback) {
    // A couple params need to be defined.  In particular:
    //  (1) Enterprise_id
    //  (2) User_id
    // In order to generate a trial balance

    var sql = {};
    // question: should be break this out to being two checks:
    //  (1) existing account? 
    //  (2) account not locked ?
    sql.validAccount = "SELECT `posting_journal`.`id`, `account`.`id` FROM `posting_journal` LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` WHERE `account`.`locked`<>1;";
    sql.balance = "SELECT SUM(`posting_journal`.`creditAmount`) AS `creditAmounts`, SUM(`posting_journal`.`debitAmount`) AS `debitAmounts`, SUM(`posting_journal`.`debitEquiv`) AS `debitEquiv`, SUM(`posting_journal`.`creditEquiv`) AS `creditEquiv` FROM `posting_journal`;";
    sql.invpo = "SELECT `posting_journal`.`id`, `posting_journal`.`invPoNum` FROM `posting_journal` WHERE NOT EXISTS (SELECT `purchase`.`id` FROM `purchase` WHERE `purchase`.`id`=`posting_journal`.`invPoNum`) UNION (SELECT `sale`.`id` FROM `sale` WHERE `sale`.`id`=`posting_journal`.`invPoNum`);";
    sql.definedArapAccount = "SELECT `posting_journal`.`id`, `posting_journal`.`arapAccount` FROM `posting_journal` WHERE NOT EXISTS (SELECT `creditAmountor`.`id` FROM `creditAmountor` WHERE `creditAmountor`.`id`=`posting_journal`.`arapAccount`) UNION (SELECT `debitAmountor`.`id` FROM `debitAmountor` WHERE `debitAmountor`.`id`=`posting_journal`.`arapAccount`);";


    function errorChecking () {
      db.execute(sql.validAccount, function (err, res) {
        if (err) throw err;
        if (~res.length) throw 'invalid accounts detected';
      });
    }
    
    function generateReport () {}
    
  }; 


});
