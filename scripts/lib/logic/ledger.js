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

  function debitor (id, callback) {
    // debitor query
    if (!id) return callback(new Error('No debitor id selected!'));

    var query = 
      'SELECT `account_id` FROM `debitor` JOIN `debitor_group` ' + 
      'ON `debitor`.`group_id`=`debitor_group`.`id` WHERE `debitor`.`id`=' +
      db.escapestr(id) + ';';
  
    db.execute(query, function (err, row) {
      if (err) return callback(err);
      
      var accnt = row[0].account_id;

      var sql = 
        'SELECT `t`.`inv_po_id`, `t`.`trans_date`, SUM(`t`.`debit_equiv`) AS `debit`,  ' +
        'SUM(`t`.`credit_equiv`) AS `credit`,SUM(`t`.`debit_equiv`) - SUM(`t`.`credit_equiv`) as balance, ' + 
        '`t`.`account_id`, `t`.`deb_cred_id`, `t`.`currency_id` ' +
        'FROM (' +
          '(' + 
            'SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit`, ' +
              '`posting_journal`.`credit`, `posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, ' +
              '`posting_journal`.`account_id`, `posting_journal`.`deb_cred_id`, `posting_journal`.`currency_id` ' + 
            'FROM `posting_journal` ' + 
            'WHERE `posting_journal`.`deb_cred_type`=\'D\'' + 
          ') UNION (' +
            'SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit`, ' +
              '`general_ledger`.`credit`, `general_ledger`.`debit_equiv`, `general_ledger`.`credit_equiv`, ' +
              '`general_ledger`.`account_id`, `general_ledger`.`deb_cred_id`, `general_ledger`.`currency_id` ' +
            'FROM `general_ledger` ' +
            'WHERE `general_ledger`.`deb_cred_type`=\'D\'' + 
          ')' +
        ') AS `t` ' +
        'WHERE `t`.`account_id`=' + db.escapestr(accnt) + ' ' + 
        'GROUP BY `t`.`inv_po_id`;\n';

      db.execute(sql, function (err, rows) {
        if (err) return callback(err);
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

});
