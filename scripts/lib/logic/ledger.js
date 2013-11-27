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
    var sql;
    if (id == '*') {
      sql = "SELECT COUNT(`total`.`inv_po_id`) AS `count`, `total`.`inv_po_id`, `total`.`deb_cred_id`, `total`.`trans_date`, `total`.`credit`, `total`.`debit` from ((SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`deb_cred_id`, `general_ledger`.`trans_date`, `general_ledger`.`credit`, `general_ledger`.`debit` FROM `general_ledger` WHERE `general_ledger`.`deb_cred_type`='D') UNION (SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`deb_cred_id`, `posting_journal`.`trans_date`, `posting_journal`.`credit`, `posting_journal`.`debit` FROM `posting_journal` WHERE `posting_journal`.`deb_cred_type`='D')) AS `total` GROUP BY `total`.`inv_po_id`;";
    } else {
      sql = "SELECT COUNT(`total`.`inv_po_id`) AS `count`, `total`.`inv_po_id`, `total`.`deb_cred_id`, `total`.`trans_date`, `total`.`credit`, `total`.`debit` from ((SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`deb_cred_id`, `general_ledger`.`trans_date`, `general_ledger`.`credit`, `general_ledger`.`debit` FROM `general_ledger` WHERE `general_ledger`.`deb_cred_type`='D' AND `general_ledger`.`deb_cred_id`=?) UNION (SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`deb_cred_id`, `posting_journal`.`trans_date`, `posting_journal`.`credit`, `posting_journal`.`debit` FROM `posting_journal` WHERE `posting_journal`.`deb_cred_type`='D' AND `posting_journal`.`deb_cred_id`=?)) AS `total` GROUP BY `total`.`inv_po_id`;";
    }
    sql = sql.replace(/\?/g, id);
    db.execute(sql, function (err, rows) {
      if (err) throw err;
      res.send(rows);
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
