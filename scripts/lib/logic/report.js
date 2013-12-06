// scripts/lib/logic/report.js

/*
 * TODISCUSS
 *   Reports currently joining accounts with account group and collection to get account group information, two things:
 *     -should the client download these two table seperately and filter on the grid, this avoids 3 joins
 *     -should the entire string of the account group titles be sent and grouped on - or just the ID (with a further look up for the title), grouping may be more expensive with large strings
 * 
 */

var q = require('Q');
var PDF = require('pdfkit');

function print () {
  // prints to a particular location
  // amd returns the hashed name to
  // be sent to the browser to load.
  var doc = new PDF();
  var hashed = 'app/reports/user-date-123.pdf';
  return hashed;
}

module.exports = (function (db) { 
  'use strict';

  function generate(request, params, callback) { 
    /*summary 
    *   Route request for reports, if no report matches given request, return null  
    */
    var route = {
      'finance' : finance,
      'stock'   : stock,
      'transReport':transReport
    };

    route[request](params).then(function(report) { 
      callback(report);
    });
  }

  function finance(reportParameters) { 
    var deferred = q.defer();
    console.log('finance got', reportParameters, typeof(reportParameters));
    
    //finance expects a JSON object - invalid JSON will throw error
    var financeParams = JSON.parse(reportParameters);

    //expecting fiscal
    var requiredFiscalYears;
    //Need to get this from somwhere - 
    var currentFiscalYear = 1;

    //This is strange
    if(financeParams) { 
      requiredFiscalYears = financeParams.fiscal || [currentFiscalYear];
    }

    console.log('working with', requiredFiscalYears);

    //will require information about current fiscal year - will need to reply with YTD

    
    //TODO realisation should be a combination of credits - debits (or the other way around) - NOT two columns

    //TODO discuss how wasteful requesting a full new table / calculation is when one could just get the new columns (new fiscal year etc.)
    //could we calculate for all fiscal years every time, and then just pull from that - send all data at once, check version on client, if it matches current version on server don't re-send, just filter accordingly

    //Condition is currently in the column select (very useful for selecting a variable number of columns - based on different querries)
    //Condition could be in the ON of the join appended with an AND
    
    //this works for realisation 
    //add budget 
    //-LEFT JOIN budget 
    //SUM(case when thing.fiscal_id = 2 then SUM(budget.budget) else 0 end)
    var initial_query = buildFinanceQuery(requiredFiscalYears);

    db.execute(initial_query, function(err, ans) {
      if(err) {
        console.log("finance report, initial query failed");
        console.log(err);
        // deferred.reject(err);
        return;
      }
      deferred.resolve(ans);
    });

    return deferred.promise;
  }

  function buildFinanceQuery(requiredFiscalYears) { 

    var query;
    var fiscalColumns = "";

    //add budget columns
    requiredFiscalYears.forEach(function(year) { 
      fiscalColumns += "(SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.debit else 0 end) - SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.credit else 0 end)) AS 'realisation "+year+"',";
    });

    query = "SELECT account.id," +
                   "account.account_number," +
                   "account.account_txt," + 
                   fiscalColumns + 
                   "account_category.collection_id, " + 
                   "account_category.title as 'category_title', " + 
                   "account_collection.title as 'collection_title' " +
            "FROM account " +
            "LEFT JOIN posting_journal " +
            "ON account.id = posting_journal.account_id " + 
            "LEFT JOIN account_category " + 
            "ON account.account_category_id = account_category.id " + 
            "LEFT JOIN account_collection " + 
            "ON account_category.collection_id = account_collection.id " +
            // "AND posting_journal.period_id = 3 " +
            "GROUP BY account.account_number;";

    return query;
  }

  function stock () {
    // TODO 
  }

  function transReport(params){
    var params = JSON.parse(params);
    console.log('***********************************',params.id);
    var deferred = q.defer();
    var sql = "SELECT posting_journal.id, posting_journal.trans_id, "+
              "posting_journal.trans_date, posting_journal.credit, posting_journal.debit, "+
              "account.account_number, currency.name, transaction_type.service_txt, CONCAT(user.first,' ', user.last) as \"names\""+
              "FROM posting_journal, account, currency, transaction_type, user "+
              "WHERE posting_journal.account_id = account.id AND currency.id = posting_journal.currency_id AND"+
              " transaction_type.id = posting_journal.origin_id and user.id = posting_journal.user_id AND posting_journal.deb_cred_id = '"+params.id+
              "' AND posting_journal.deb_cred_type = '"+params.type+"'";

    db.execute(sql, function(err, ans) {
      if(err) {
        console.log("trans report, Query failed");
        throw err;
        // deferred.reject(err);
        return;
      }

      deferred.resolve(ans);
    });
    return deferred.promise;
  }

  return { 
    generate: generate
  };

});
