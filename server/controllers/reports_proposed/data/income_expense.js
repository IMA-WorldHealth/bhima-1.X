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
var moment = require('moment');

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
  var compareYearUnique;

  if (!options.fiscal_year) { 
    return q.reject(new Error('Invalid report configuration'));
  }
  
  if (compareYearDefined) { 
    compareYearUnique = options.compare_year.id !== options.fiscal_year.id;
    
    if (compareYearUnique) { 
      // Context will be compiled for both original fiscal year and comparison year
      comparingYears = true;
    }
  }

  // Attach parameters/ defaults to completed context
  context.heading = options.heading || DEFAULT_HEADING;
  context.subheading = options.subheading;
  context.fiscalDefinition = options.fiscal_year;
  context.compareDefinition = options.compare_year;
  context.comparingYears = comparingYears;
  
  // Account formatting details
  context.TITLE_ACCOUNT_ID = titleAccountId;
  
  context.fiscalDefinition.dates = calculateFiscalPeriod(context.fiscalDefinition);

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
      context.compare = {};
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
        context.compare = compileAccountLines(comparisonAccounts);
      
        // context.fiscal.varianceData = calculateVariance(
          // context.fiscal.incomeData,
          // context.fiscal.expenseData);

        //  child.aggTotal;context.compare.varianceData = calculateVariance(
          // context.compare.incomeData,
          // context.compare.expenseData);

        console.log('data collected and compiled for both original and comparison year');
        deferred.resolve(context);
      });
    })
    .catch(deferred.reject)
    .done();
}

function compileAccountLines(accounts) { 
  
  // Parses account depths for formatting etc.
  var accountTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);
  
  // FIXME Extend object hack
  var incomeData = JSON.parse(JSON.stringify(accountTree.accounts));
  var expenseData = JSON.parse(JSON.stringify(accountTree.accounts));
  
  // FIXME Lots of processing, very little querrying - this is what MySQL is foreh
  incomeData = filterAccounts(incomeData, expenseAccountConvention);
  incomeData = trimEmptyAccounts(incomeData);
  incomeData = flattenAccounts(incomeData); 

  expenseData = filterAccounts(expenseData, incomeAccountConvention);
  expenseData = trimEmptyAccounts(expenseData); 
  expenseData = flattenAccounts(expenseData);

  return { 
    incomeData : incomeData,
    expenseData : expenseData
  }
}

/* 
 * Utility Methods - should probably be shared acorss different reporting modules
 */
/*
 * FIXME The most interesting way of parsing a tree I've ever seen - it may be worth someone building
 * an effecient AST library to parse/flatten account lists
 */
function getChildren(treeObject, parentId, depth) {
  var children;
  var total = 0;

  var accounts = treeObject.accounts || treeObject;

  // Base case: There are no child accounts
  // Return an empty array
  if (accounts.length === 0) { return []; }

  // Returns all accounts where the parent is the
  // parentId
  children = accounts.filter(function (account) {
    var validChild = account.parent === parentId;
  
    return validChild;
  });

  // Recursively call get children on all child accounts
  // and attach them as childen of their parent account
  children.forEach(function (account) {
    var step; 
    
    total += account.balance;
    step = getChildren(accounts, account.account_number, depth + 1);

    account.depth = depth;

    account.children = step.accounts;
     
    total += step.aggregateTotal;
    if (account.total) { 
      account.total += step.aggregateTotal;
    } else { 
      account.total = step.aggregateTotal;
    }
  });
  
  // return children;
  return {
    accounts : children,
    aggregateTotal : total
  };
}
  
function filterAccounts(accounts, excludeType) { 

  function typeFilter(account) {
    var matchesFilterType = false;
    
    // FIXME Expensive repeated conversion - filter once
    var accountNumber = String(account.account_number)
    
    if (accountNumber[0] === excludeType) { 
      matchesFilterType = true;
    }


    if (matchesFilterType) { 
      return null; 
    } else { 
      if (account.children) account.children = account.children.filter(typeFilter);
      return account;
    }
  }
  
  var filtered = accounts.filter(typeFilter);
  return filtered;
}

function trimEmptyAccounts(accounts) { 
  var unique = 0;

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

      unique += 1;
      account.children = account.children.filter(emptyFilter);
      return account;
    }
  }

  console.log('after trim', unique);

  return accounts;
}

// TODO Completely replace this using the MySQL Query (see CASE columns update)
/*
function calculateVariance(fiscal, compare) { 
  
  // FIXME These methods entirely rely on everything working and both fiscal years having exactly the same number of elements
  var totalItems = fiscal.length;
  
  var varianceList = [];

  for (var i = 0; i < totalItems; i++) { 

    varianceList.push({
      difference : compare[i].balance - fiscal[i].balance;
    }); 
  }
  
  return varianceList;
}*/

function flattenAccounts(accountTree) { 
  
  /**
   * FIXME 
   * Massive hack for merge delay
   * 
   * Becuase of the data model changing (OHADA vs. non OHADA?) many of the accounts are duplicated, instead of resolving
   * that logical issue - this simply ignores duplicates - this is bad, fix as soon as possible
   */
  var cacheId = [];
  /**/

  var flattenedAccounts = [];
  
  accountTree.forEach(function (accountNode) { 
    parseNode(accountNode);
  });

  function parseNode(accountNode) { 
      var children = accountNode.children;

      accountNode.children = undefined;
      
      /**
       * FIXME
       */
      if (cacheId.indexOf(accountNode.id)===-1) { 
        flattenedAccounts.push(accountNode);
        cacheId.push(accountNode.id);
      }
      /**/

      children.map(parseNode);
  }
  
  console.log('total flattened', flattenedAccounts.length);
  return flattenedAccounts;
}

/** 
 * Return an object with the start and end date given a fiscal year definition 
 * @todo This assumes that periods are month long incremements - this should be verified with the
 * fiscal year creation tools
 */
function calculateFiscalPeriod(fiscalYear) { 
  var DATE_MONTH_OFFSET = 1;
  var fiscalDate = new Date(fiscalYear.start_year, fiscalYear.start_month-DATE_MONTH_OFFSET);
  var completeDate = new Date(fiscalDate);
  
  completeDate.setMonth(fiscalDate.getMonth() + fiscalYear.number_of_months);

  return { 
    start : moment(fiscalDate).format('L'),
    end : moment(completeDate).format('L')
  };
}
