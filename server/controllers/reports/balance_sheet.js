// reports/balance_sheet.js
// Collects and aggregates data for the enterprise balance sheet

var db = require('../../lib/db');

// Constant: root account id
var ROOT_ACCOUNT_ID = 0;

// This method builds a tree data structure of
// accounts and children of a specified parentId.
function getChildren(accounts, parentId, depth) {
  var children;

  // Base case: There are no child accounts
  // Return an empty array
  if (accounts.length === 0) { return []; }

  // Returns all accounts where the parent is the
  // parentId
  children = accounts.filter(function (account) {
    return account.parent === parentId;
  });

  // Recursively call get children on all child accounts
  // and attach them as childen of their parent account
  children.forEach(function (account) {
    account.depth = depth;
    account.children = getChildren(accounts, account.id, depth+1);
  });

  return children;
}

// Adds the balance of a list of accounts to
// an aggregate value
function aggregate(value, account) {

  var isLeaf = account.children.length === 0;

  // if the account has children, recursively
  // recursively call aggregate on the array of accounts
  if (!isLeaf) {
    return value + account.children.reduce(aggregate, 0);
  }

  return value + account.balance;
}

// expose the http route
module.exports = function (req, res, next) {
  'use strict';

  var fiscalYearId = req.body.fiscalYearId;

  var sql =
    'SELECT account.id, account.account_number, account.account_type_id, account.parent, totals.balance, totals.period_id ' +
    'FROM account LEFT JOIN (' +
      'SELECT period_total.account_id, SUM(period_total.debit - period_total.credit) as balance, period_total.period_id ' +
      'FROM period_total ' +
      'WHERE period_total.fiscal_year_id = ? ' +
      'GROUP BY period_total.account_id ' +
    ') AS totals ON totals.account_id = account.id ' +
    'WHERE account.account_type_id = ?;';

  db.exec('SELECT id FROM account_type WHERE type="balance";')
  .then(function (rows) {

    // pull out the account type id for the balance accounts
    var balanceId = rows[0].id;

    return db.exec(sql, [fiscalYearId, balanceId]);
  })
  .then(function (accounts) {
    var accountTree;

    // Create the accounts and balances into a tree
    // data structure
    accountTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);

    // aggregate the account balances of child accounts into
    // the parent account
    accountTree.forEach(function (account) {
      account.balance = account.children.reduce(aggregate, 0);
    });

    // TODO use this to render a report and serve it

  })
  .catch(next)
  .done();
};
