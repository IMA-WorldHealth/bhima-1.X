var db = require('../../lib/db'),
    q = require('q');

// GET /analytics/cashboxes
exports.getCashBoxes = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT c.id, c.text FROM cash_box AS c;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();

};

// given a cashbox id and optional a currency id, return
// an array of accounts
function getAccountIds(cashBoxId, currencyId) {
  'use strict';

  var sql, accounts;

  // get the correct account id(s) from the cash_box_account_currency table.
  sql =
    'SELECT account_id FROM cash_box_account_currency JOIN cash_box ' +
      'ON cash_box.id = cash_box_account_currency.cash_box_id ' +
    'WHERE cash_box_id = ?';

  // if we are given a currencyId, that narrows the account_ids we are getting
  sql += (currencyId !== undefined) ? ' AND currency_id = ?;' : ';';

  // based on the cashBoxId, select the correct accountId (or use all).
  return db.exec(sql, [cashBoxId, currencyId])
  .then(function (rows) {
    accounts = rows.map(function (r) { return r.account_id; });
    return q(accounts);
  });
}

// GET /analytics/cashboxes/:id/balance?hasPostingJournal=0&currencyId=1
exports.getCashBoxBalance = function (req, res, next) {
  'use strict';

  var sql;

  getAccountIds(req.params.id, req.query.currencyId)
  .then(function (accounts) {

    // check if we are including the posting journal or not
    if (req.query.hasPostingJournal) {
      sql =
        'SELECT COUNT(trans_id) AS transactions, SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, ' +
          'SUM(debit_equiv - credit_equiv) AS balance, account_id ' +
        'FROM (' +
          'SELECT trans_id, account_id, debit_equiv, credit_equiv ' +
          'FROM posting_journal ' +
          'UNION SELECT trans_id, account_id, debit_equiv, credit_equiv ' +
          'FROM general_ledger' +
        ')c ' +
        'WHERE account_id IN (?) ' +
        'GROUP BY account_id;';
    } else {
      sql =
        'SELECT COUNT(trans_id) AS transactions, SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, ' +
          'SUM(debit_equiv - credit_equiv) AS balance, account_id ' +
        'FROM general_ledger ' +
        'WHERE account_id IN (?) ' +
        'GROUP BY account_id;';
    }

    return db.exec(sql, [accounts]);
  })
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

// GET /analytics/cashboxes/:id/history?hasPostingJournal=0&currencyId=1&grouping=month
// grouping can be (month || year || day)
exports.getCashBoxHistory = function (req, res, next) {
  'use strict';

  var sql;

  getAccountIds(req.params.id, req.query.currencyId)
  .then(function (accounts) {

    // check if we are including the posting journal or not
    if (req.query.hasPostingJournal) {
      sql =
        'SELECT COUNT(trans_id) AS transactions, SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, ' +
          'SUM(debit_equiv - credit_equiv) AS balance, trans_date, account_id ' +
        'FROM (' +
          'SELECT trans_id, account_id, trans_date, debit_equiv, credit_equiv ' +
          'FROM posting_journal ' +
          'UNION SELECT trans_id, account_id, trans_date, debit_equiv, credit_equiv ' +
          'FROM general_ledger' +
        ')c ' +
        'WHERE account_id IN (?) ';
    } else {
      sql =
        'SELECT COUNT(trans_id) AS transactions, SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, ' +
          'SUM(debit_equiv - credit_equiv) AS balance, trans_date, account_id ' +
        'FROM general_ledger ' +
        'WHERE account_id IN (?) ';
    }

    // now we tackle the grouping using MySQL's Date/Time functions
    switch (req.query.grouping.toLowerCase()) {
      case 'year':
        sql += 'GROUP BY account_id, YEAR(trans_date);';
        break;
      case 'month':
        sql += 'GROUP BY account_id, YEAR(trans_date), MONTH(trans_date);';
        break;
      case 'day':
        sql += 'GROUP BY account_id, YEAR(trans_date), MONTH(trans_date), DAY(trans_date);';
        break;
      default:
        sql += 'GROUP BY account_id;';
        break;
    }

    return db.exec(sql, [accounts]);
  })
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};
