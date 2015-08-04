// controllers/finance.js

var db = require('../lib/db');

// POST /journal/voucher
// Securely post a transaction to the posting journal.
// 
// The steps involved are this:
//  1) Check for an exchange rate
//  2a) Get the period_id, fiscal_year_id for the submitted date
//  2b) Validate the date isn't in the future
//  3) Check permissions and link the user with the registration
//  4) Exchange the values that need to be exchanged
//  5) Write to journal_log that a post happened
exports.postJournalVoucher = function (req, res, next) {
  'use strict';
  
  var sql;

};


// GET /finance/debtors
// returns a list of debtors
exports.getDebtors = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT d.uuid, d.text, CONCAT(p.first_name, p.middle_name, p.last_name) AS patientname, ' +
      'dg.name AS groupname, a.id AS account_id, a.account_number ' +
    'FROM debitor AS d JOIN patient AS p JOIN debitor_group AS dg JOIN account AS a ON ' +
      'd.uuid = p.debitor_uuid AND d.group_uuid = dg.uuid AND dg.account_id = a.id;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
};

// GET /finance/creditors
exports.getCreditors = function (req, res, next) {
  'use strict';

  var sql = 
    'SELECT c.uuid, c.text, cg.name, c.group_uuid, a.id AS account_id, a.account_number ' +
    'FROM creditor AS c JOIN creditor_group AS cg JOIN account AS a ' +
      'ON c.group_uuid = cg.uuid AND cg.account_id = a.id;';
  
  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
};

// GET /finance/currencies
exports.getCurrencies = function (req, res, next) {
  'use strict';

  var sql =
    'SELECT c.id, c.name, c.symbol, c.decimal, c.separator, c.note ' +
    'FROM currency AS c;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(function (error) {
    next(error);
  })
  .done();
};
