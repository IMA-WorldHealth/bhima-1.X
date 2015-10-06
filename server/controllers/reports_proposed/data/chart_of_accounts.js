/**
 * @description 
 *
 * @returns 
 *
 * @todo Accept a subset delimiter for accounts to display in chart of accounts
 */

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

/**
 * Default configuration options 
 * TODO Should this be served and displayed to the client for report 
 * coniguration?
 */
var DEFAULT_HEADING = 'Chart of Accounts';

// FIXME Harcoded
var ROOT_ACCOUNT_ID = 0;
var TITLE_ACCOUNT_ID = 3; 

exports.compile = function (options) { 
  'use strict';
 
  var deferred = q.defer();
  var context = {};

  // Attach parameters/ defaults to completed context
  context.heading = options.heading || DEFAULT_HEADING;
  context.subheading = options.subheading;

  var accountQuery =
    'SELECT account.id, account.account_number, account.is_ohada, account.account_txt, account.account_type_id, account.parent ' +
    'FROM account';

  db.exec(accountQuery, [])
    .then(function (accounts) { 
      
      //FIXME What does hack really mean?
      var calculateDepthTree = getChildren(accounts, ROOT_ACCOUNT_ID, 0);
      console.log(calculateDepthTree);
      var displayAccounts = flattenAccounts(calculateDepthTree);
    
      
      context.accounts = displayAccounts;
      deferred.resolve(context);
    })
    .catch(deferred.reject)
    .done();

  return deferred.promise;
};

/* 
 * Utility Methods - should probably be shared across different reporting modules
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

      if (children) { 
      children.map(parseNode);
      }
  }

  return flattenedAccounts;
}
