var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

// TODO Derive from DB
var incomeAccountId = 1;
var balanceAccountId = 2;
var titleAccountId = 3; 
var expenseAccountId = 4;

exports.compile = function (options) { 
  'use strict';
  
  // TODO Just a huge amount of this code is the same as the balance sheet 
  // Constant: root account id
  var ROOT_ACCOUNT_ID = 0;

  var formatDollar = '$0,0.00';
  var balanceDate = new Date();
  
  
  var displayAccountNumber = false;

  var deferred = q.defer();
  var context = {};

  var periods = [];
  var fiscalYears = [];
  
  var currentPeriod = {};
  var currentFiscalYear = {};


  // Querry from balance sheet 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, totals.balance, totals.period_id ' +
    'FROM account LEFT JOIN (' +
      'SELECT period_total.account_id, IFNULL(SUM(period_total.debit - period_total.credit), 0) as balance, period_total.period_id ' +
      'FROM period_total ' +
      'WHERE period_total.fiscal_year_id = ? ' +
      'GROUP BY period_total.account_id ' +
    ') AS totals ON totals.account_id = account.id ' +
    'WHERE account.account_type_id IN (?, ?, ?);';

  
  db.exec(sql, [options.fiscalYearId, incomeAccountId, titleAccountId, expenseAccountId])
    .then(function (accounts) { 
      
      var accountTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);
      
      // FIXME Extend object hack
      var incomeData = JSON.parse(JSON.stringify(accountTree));
      var expenseData = JSON.parse(JSON.stringify(accountTree));
      
      // FIXME Lots of processing, very little querrying - this is what MySQL is foreh
      incomeData = filterAccounts(incomeData, expenseAccountId);
      incomeData = trimEmptyAccounts(incomeData);

      expenseData = filterAccounts(expenseData, incomeAccountId);
      expenseData = trimEmptyAccounts(expenseData);
      
      context.incomeData = incomeData;
      context.expenseData = expenseData; 

      deferred.resolve(context);
    })
    .catch(deferred.reject)
    .done();
  
  return deferred.promise;
};

/* 
 * Utility Methods - should probably be shared acorss different reporting modules
 */
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
  
function filterAccounts(accounts, filterType) { 
  
  function typeFilter(account) { 
    var matchesFilterType = account.account_type_id === filterType;

    if (matchesFilterType) { 
      return null; 
    } else { 
      if (account.children) account.children = account.children.filter(typeFilter);
      return account;
    }
  }

  return accounts.filter(typeFilter);
}

function trimEmptyAccounts(accounts) { 
  var removedAccount = true;
    
  while (removedAccount) { 
    removedAccount = false;
    accounts = accounts.filter(emptyFilter);
  }

  function emptyFilter(account) { 
    var hasNoChildren = account.children.length === 0; 
 
    if (account.account_type_id === titleAccountId && hasNoChildren) { 
      removedAccount = true;
    } else { 
      account.children = account.children.filter(emptyFilter);
      return account;
    }
  }

  return accounts;
}


