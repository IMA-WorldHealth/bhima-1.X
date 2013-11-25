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
    var sql = "SELECT COUNT(`total`.`inv_po_id`) AS `count`, `total`.`inv_po_id`, `total`.`credit`, `total`.`debit` from ((SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`debit`, `general_ledger`.`credit` FROM `general_ledger` WHERE `general_ledger`.`deb_cred_type`='D' AND `general_ledger`.`deb_cred_id`=?) UNION (SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`debit`, `posting_journal`.`credit` FROM `posting_journal` WHERE `posting_journal`.`deb_cred_type`='D' AND `posting_journal`.`deb_cred_id`=?)) AS `total` GROUP BY `total`.`inv_po_id`;";
    sql = sql.replace(/\?/g, id);
    console.log("[ledger] Executing...", sql);
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
