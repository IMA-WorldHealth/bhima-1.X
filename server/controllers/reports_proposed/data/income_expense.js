/**
 * @description 
 *
 * @returns 
 *
 * @todo Accounts are currently filtered and organised according to 6 being a expense 
 * and 7 being income, this is hardcoded in this file. It should either be specified somewhere 
 * or account types must be split into both income and expense
 *
 * @todo Text translation and language keys
 *
 * @todo Update to use standard currency formatting library
 *
 * @todo Currently only one comparison year + variance is supported, using MySQL Case 
 * to select individual fiscal years with column selection would allow a flexible alternative
 */

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

/**
 * Default configuration options 
 * TODO Should this be served and displayed to the client for report 
 * coniguration?
 */
var DEFAULT_HEADING = 'Income Expense Statement';
var DEFAULT_YEAR_OPTIONS = [];

// FIXME Harcoded all over the place
// Constant: root account id
var ROOT_ACCOUNT_ID = 0;

// TODO Derive from DB
var incomeExpenseAccountId = 1;
var balanceAccountId = 2;
var titleAccountId = 3; 

var expenseAccountConvention = '6';
var incomeAccountConvention = '7';

exports.compile = function (options) { 
  'use strict';
 
  var deferred = q.defer();
  
  var context = {};
  var comparingYears = false;

  // Validate options/ configuration object
  var compareYearDefined = options.compare_year;
  var compareYearUnique = options.compare_year.id !== options.fiscal_year.id;

  if (!options.fiscal_year) { 
    return q.reject(new Error('Invalid report configuration'));
  }
  
  if (compareYearDefined && compareYearUnique) { 

    // Context will be compiled for both original fiscal year and comparison year
    comparingYears = true;
  }

  // Attach parameters/ defaults to completed context
  context.heading = options.heading || DEFAULT_HEADING;
  context.subheading = options.subheading;
  context.fiscalDefinition = options.fiscal_year;
  context.compareDefinition = options.compare_year;
  context.comparingYears = comparingYears;

  var accountStatusQuery =
    'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, totals.balance, totals.period_id ' +
    'FROM account LEFT JOIN (' +
      'SELECT period_total.account_id, ABS(IFNULL(SUM(period_total.debit - period_total.credit), 0)) as balance, period_total.period_id ' +
      'FROM period_total ' +
      'WHERE period_total.fiscal_year_id = ? ' +
      'GROUP BY period_total.account_id ' +
    ') AS totals ON totals.account_id = account.id ' +
    'WHERE account.account_type_id IN (?, ?);';
 
  // TODO Passing deferred is somewhat of a hack - collect methods should return promises
  if (comparingYears) { 
    collectComparisonYear(accountStatusQuery, context, options, deferred);
  } else { 
    collectSingleYear(accountStatusQuery, context, options, deferred); 
  }

  return deferred.promise;
};

// TODO Pulling from different fiscal years can be done using MySQL CASE - this 
// would allow a single search method to work on any number of fiscal year comparisons
function collectSingleYear(query, context, options, deferred) { 
  
  db.exec(query, [options.fiscal_year.id, incomeExpenseAccountId, titleAccountId])
    .then(function (accounts) { 
      
      context.fiscal = compileAccountLines(accounts);
      deferred.resolve(context);
    })
    .catch(deferred.reject)
    .done();
}

function collectComparisonYear(query, context, options, deferred) { 
  
  // Original fiscal year query
  db.exec(query, [options.fiscal_year.id, incomeExpenseAccountId, titleAccountId])
    .then(function (originalAccounts) { 
    
      // Comparison fiscal year query
      db.exec(query, [options.compare_year.id, incomeExpenseAccountId, titleAccountId])
      .then(function (comparisonAccounts) { 
   
        context.fiscal = compileAccountLines(originalAccounts);
        context.comparison = compileAccountLines(comparisonAccounts);


        console.log('data collected and compiled for both original and comparison year');
        deferred.resolve(context);
      });
    })
    .catch(deferred.reject)
    .done();
}

function compileAccountLines(accounts) { 
  var accountTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);
  
  // FIXME Extend object hack
  var incomeData = JSON.parse(JSON.stringify(accountTree));
  var expenseData = JSON.parse(JSON.stringify(accountTree));
  
  // FIXME Lots of processing, very little querrying - this is what MySQL is foreh
  incomeData = filterAccounts(incomeData, expenseAccountConvention);
  incomeData = trimEmptyAccounts(incomeData);

  expenseData = filterAccounts(expenseData, incomeAccountConvention);
  expenseData = trimEmptyAccounts(expenseData);
  
  return { 
    incomeData : incomeData,
    expenseData : expenseData
  }
}

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
    account.children = getChildren(accounts, account.account_number, depth+1);
  });

  return children;
}
  
function filterAccounts(accounts, excludeType) { 
   
  function typeFilter(account) {
    var matchesFilterType = false;

    if (account.account_number[0] === excludeType) { 
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
