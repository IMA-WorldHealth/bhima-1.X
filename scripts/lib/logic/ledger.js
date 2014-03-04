// scripts/lib/logic/ledger.js

// Module: ledger
//
// This module exposes three methods:
//  (1) debitor
//  (2) credior
//  (3) general
// which encapsulate reporting the ledgers
// for each group, respectively.

var sanitize = require('../util/sanitize'),
    util = require('../util/util');

module.exports = function (db) {
  'use strict';

  function debitor (id, callback) {
    // debitor query
    if (!id) { return callback(new Error('No debitor id selected!')); }
    else { id = sanitize.escape(id); }

    var query =
      'SELECT c.inv_po_id, c.trans_id, c.trans_date, c.account_id FROM ((SELECT p.inv_po_id, p.trans_id, p.trans_date, p.account_id FROM posting_journal as p WHERE p.deb_cred_id = ' + id + ') ' +
      'UNION (SELECT g.inv_po_id, g.trans_date, g.trans_id, g.account_id FROM general_ledger as g WHERE g.deb_cred_id = ' + id +')) as c;';

    db.execute(query, function (err, rows) {
      if (err) return callback(err);
    
      if (!rows.length) { return callback(null, []); }
      
      var invoices = rows.map(function (line) {
        return line.inv_po_id;
      });

      var account_id = rows[0].account_id;

      var sql =
        'SELECT `t`.`inv_po_id`, `t`.`trans_date`, SUM(`t`.`debit_equiv`) AS `debit`,  ' +
        'SUM(`t`.`credit_equiv`) AS `credit`, SUM(`t`.`debit_equiv` - `t`.`credit_equiv`) as balance, ' +
        '`t`.`account_id`, `t`.`deb_cred_id`, `t`.`currency_id`, `t`.`doc_num`, `t`.`description`, `t`.`account_id`, ' +
        '`t`.`comment`' +
        'FROM (' +
          '(' +
            'SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit`, ' +
              '`posting_journal`.`credit`, `posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, ' +
              '`posting_journal`.`account_id`, `posting_journal`.`deb_cred_id`, `posting_journal`.`currency_id`, ' +
              '`posting_journal`.`doc_num`, posting_journal.trans_id, `posting_journal`.`description`, `posting_journal`.`comment` ' +
            'FROM `posting_journal` ' +
          ') UNION (' +
            'SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit`, ' +
              '`general_ledger`.`credit`, `general_ledger`.`debit_equiv`, `general_ledger`.`credit_equiv`, ' +
              '`general_ledger`.`account_id`, `general_ledger`.`deb_cred_id`, `general_ledger`.`currency_id`, ' +
              '`general_ledger`.`doc_num`, general_ledger.trans_id, `general_ledger`.`description`, `general_ledger`.`comment` ' +
            'FROM `general_ledger` ' +
          ')' +
        ') AS `t` ' +
        'WHERE `t`.`inv_po_id` IN (' + invoices.join(',') + ') ' +
        'AND t.account_id = ' + account_id + ' ' +
        'GROUP BY `t`.`inv_po_id`;\n';

      db.execute(sql, function (err, rows) {
        if (err) { return callback(err); }
        return callback(null, rows);
      });
    });
  }

  function creditor (id, res) {}

  function general () {}

  return {
    debitor: debitor,
    creditor: creditor,
    general: general
  };

};
