/**
* Debtor Group Annual Report
*
* This report is based of an report used in Congolese hospitals.  It shows the
* opening balance (debits and credits) at the end beginning of the fiscal year
* for each debtor group, the amount billed and payed over the course of the year
* and closing balances of each account.
*
* This report should only be availabe for years that have been both opened and
* closed, elapsing an entire billing cycle.  It requires both opening and
* closing balances to exist for each debtor group.
*/

var db      = require('../../../lib/db');
var numeral = require('numeral');

var formatDollar = '$0,0.00';

// expose the http route
exports.compile = function (options) {
  'use strict';

  var sql,
      params = {},
      context = {},
      fiscalYearId = options.fy;

  context.reportDate = new Date().toDateString();

  // formating function
  function fmt(amount) {
    numeral(amount).format(formatDollar);
  }

  // get some metadata about the fiscal year
  sql =
    'SELECT fy.fiscal_year_txt AS label, MIN(p.period_start) AS start, MAX(p.period_stop) AS stop ' +
    'FROM fiscal_year AS fy JOIN period AS p ON fy.id = p.fiscal_year_id ' +
    'WHERE fy.id = ? AND p.period_number <> 0;';

  return db.exec(sql, [fiscalYearId])
  .then(function (rows) {
    var year = rows[0];

    context.meta = {
      label : year.label,
      start : year.start,
      stop  : year.stop
    };

    // get the opening balances
    sql =
      'SELECT account.id, account.account_number, dg.name, ' +
        'IFNULL(pt.debit, 0) AS debit, IFNULL(pt.credit, 0) AS credit ' +
      'FROM debitor_group AS dg JOIN account ON account.id = dg.account_id ' +
      'LEFT JOIN period_total AS pt ON dg.account_id = pt.account_id ' +
      'JOIN period AS p ON pt.period_id = p.id ' +
      'WHERE pt.fiscal_year_id = ? AND p.period_number = 0;';

    return db.exec(sql, [fiscalYearId]);
  })
  .then(function (accounts) {

    // reduce the accounts into a single account object with properties for beginning balance,
    // credits, debits, and closing balance
    context.accounts = accounts.reduce(function (object, account) {
      var id = account.number;

      object[id] = {};
      object[id].openingCredits = fmt(account.credit);
      object[id].openingDebits = fmt(account.debit);

      return object;
    }, {});

    // get the debits and credits for the entire year
    sql =
      'SELECT account.id, account.account_number, dg.name, ' +
        'IFNULL(SUM(pt.debit), 0) AS debit, IFNULL(SUM(pt.credit), 0) AS credit ' +
      'FROM debitor_group AS dg JOIN account ON account.id = dg.account_id ' +
      'LEFT JOIN period_total AS pt ON dg.account_id = pt.account_id ' +
      'JOIN period AS p ON pt.period_id = p.id ' +
      'WHERE pt.fiscal_year_id = ? AND p.period_number <> 0 ' +
      'GROUP BY pt.fiscal_year_id;';

    return db.exec(sql, [fiscalYearId]);
  })
  .then(function (accounts) {

    console.log('context.accounts', context.accounts);
    console.log('accounts:');

    accounts.forEach(function (account) {
      var ref = context.accounts[account.account_number];
      ref.debits = fmt(account.debit);
      ref.credits = fmt(account.credit);
    });

    // get the ending balance (movements + beginning balances)
    sql =
      'SELECT account.id, account.account_number, dg.name, ' +
        'SUM(IFNULL(pt.debit, 0) - IFNULL(pt.credit, 0)) AS balance ' +
      'FROM debitor_group AS dg JOIN account ON account.id = dg.account_id ' +
      'LEFT JOIN period_total AS pt ON dg.account_id = pt.account_id ' +
      'JOIN period AS p ON pt.period_id = p.id ' +
      'WHERE pt.fiscal_year_id = ? ' +
      'GROUP BY pt.fiscal_year_id;';

    return db.exec(sql, [fiscalYearId]);
  })
  .then(function (accounts) {

    accounts.forEach(function (account) {
      var ref = context.accounts[account.account_number];
      ref.closingBalance = fmt(account.balance);
    });

    return context;
  });
};
