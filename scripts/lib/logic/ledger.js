// scripts/lib/logic/ledger.js

// Module: ledger
//
// This module exposes three methods:
//  (1) debitor
//  (2) credior
//  (3) general
// which encapsulate reporting the ledgers
// for each group, respectively.

module.exports = (function (db) {
  'use strict';

  function debitor (id, res) {
    // debitor query
    // FIXME: change this * syntax to make life better for everyone
    if (!id) throw new Error('No debitor id selected!');
    var query = "SELECT `account_id` FROM `debitor` JOIN `debitor_group` ON `debitor`.`group_id`=`debitor_group`.`id` WHERE `debitor`.`id`=" + db.escapestr(id) + ";\n";
    db.execute(query, function (err, result) {
      if (err) throw err;
      else {
        var debitor_account = result[0].account_id;
        var first_name = result[0].first_name;
        var last_name = result[0].last_name;
        // FIXME/TODO This should use debit_equiv and credit_equiv rather than debit and credit
        var sql = 
          "SELECT `combined`.`inv_po_id`, `combined`.`trans_date`, SUM(`combined`.`debit`) AS `debit`, SUM(`combined`.`credit`) AS `credit`, `combined`.`account_id`, `combined`.`deb_cred_id` FROM (" +
          "(" + 
            "SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit`, `posting_journal`.`credit`, `posting_journal`.`account_id`, `posting_journal`.`deb_cred_id` " + 
            "FROM `posting_journal` " + 
            "WHERE `posting_journal`.`deb_cred_type`='D'" + 
          ") UNION (" +
            "SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit`, `general_ledger`.`credit`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_id` " +
            "FROM `general_ledger` " +
            "WHERE `general_ledger`.`deb_cred_type`='D'" + 
          ")) AS `combined` " +
          "WHERE `combined`.`account_id`=" + debitor_account + " " + 
          "GROUP BY `combined`.`inv_po_id`;\n";
        db.execute(sql, function (err, rows) {
          if (err) throw err;
          console.log('\nReceived', rows, '\n');
          res.send(rows);
        });
      }
    });
  }

  function creditor (id, res) {}

  function general () {}

  return {
    debitor: debitor,
    creditor: creditor,
    general: general 
  };

});
