/**
 * @description 
 *
 * @returns 
 *
 * @todo Accounts are currently filtered and organised according to 6 being a expense 
 * and 7 being income, this is hardcoded in this file. It should either be specified somewhere 
 * or account types must be split into both income and expense
 */

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

// TODO Derive from DB
var incomeExpenseAccountId = 1;
var balanceAccountId = 2;
var titleAccountId = 3; 

var expenseAccountConvention = '6';
var incomeAccountConvention = '7';

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

  
  //FIXME 
  options.fiscalYearId = 1;

  // Querry from balance sheet 
  var sql =
    'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, totals.balance, totals.period_id ' +
    'FROM account LEFT JOIN (' +
      'SELECT period_total.account_id, IFNULL(SUM(period_total.debit - period_total.credit), 0) as balance, period_total.period_id ' +
      'FROM period_total ' +
      'WHERE period_total.fiscal_year_id = ? ' +
      'GROUP BY period_total.account_id ' +
    ') AS totals ON totals.account_id = account.id ' +
    'WHERE account.account_type_id IN (?, ?);';

  
  db.exec(sql, [options.fiscalYearId, incomeExpenseAccountId, titleAccountId])
    .then(function (accounts) { 
      // console.log('income_expense build got', accounts);
      console.log('[income_expense] Initial number of accounts in query: ', accounts.length);

      var accountTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);
      
      
      // FIXME Extend object hack
      var incomeData = JSON.parse(JSON.stringify(accountTree));
      var expenseData = JSON.parse(JSON.stringify(accountTree));
      
      console.log('[income_expense] Number of accounts after tree parsing: ', incomeData.length);
      console.log('[income_expense] Number of accounts after tree parsing: ', expenseData.length);
      
      // console.log('before filter', incomeData);
      
      // FIXME Lots of processing, very little querrying - this is what MySQL is foreh
      incomeData = filterAccounts(incomeData, expenseAccountConvention);
      incomeData = trimEmptyAccounts(incomeData);

      expenseData = filterAccounts(expenseData, incomeAccountConvention);
      expenseData = trimEmptyAccounts(expenseData);
      
      context.incomeData = incomeData;
      context.expenseData = expenseData; 
  

      // console.log('after trim', incomeData);
      // console.log('after trim', expenseData);
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
  
  console.log('getChildren [', accounts.length, parentId, depth, ']');
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
    // console.log('children account', account.account_number);
    account.depth = depth;
    account.children = getChildren(accounts, account.account_number, depth+1);
  });

  return children;
}
  
function filterAccounts(accounts, excludeType) { 
   
  function typeFilter(account) {
    var matchesFilterType = false;

    // console.log('filtering on', account.account_number);
    // console.log('number of children', account.children.length);

    // var matchesFilterType = account.account_type_id === filterType;
    
  
    // console.log('verifying account', account.account_number, account.account_number[0], excludeType);
    // console.log('filtering account', account);

    if (account.account_number[0] === excludeType) { 
      console.log(account.account_number[0], 'is equal to', excludeType, 'removing account.');
      matchesFilterType = true;
    }


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


