var q = require('Q');
module.exports = (function(db) { 
  'use strict'

  function generate(request, callback) { 
    /*summary 
    *   Route request for reports, if no report matches given request, return null  
    */
    var route = {
      'finance' : finance
    }

    route[request]().then(function(report) { 
      callback(report);
    });
  }

  function finance() { 
    //TODO realisation should be a combination of credits - debits (or the other way around) - NOT two columns

    //TODO discuss how wasteful requesting a full new table / calculation is when one could just get the new columns (new fiscal year etc.)
    //could we calculate for all fiscal years every time, and then just pull from that - send all data at once, check version on client, if it matches current version on server don't re-send, just filter accordingly
    var deferred = q.defer();

    //Condition is currently in the column select (very useful for selecting a variable number of columns - based on different querries)
    //Condition could be in the ON of the join appended with an AND
    
    //this works for realisation 
    //add budget 
    //-LEFT JOIN budget 
    //SUM(case when thing.fiscal_id = 2 then SUM(budget.budget) else 0 end)
    var initial_query = "SELECT account.id," +
                               "account.account_number," + 
                               "SUM(case when posting_journal.fiscal_year_id = 1 then posting_journal.credit else 0 end) AS account_credit," +
                               "SUM(case when posting_journal.fiscal_year_id = 1 then posting_journal.debit else 0 end) AS account_debit," +
                               "posting_journal.period_id " +
                        "FROM account " +
                        "LEFT JOIN posting_journal " +
                        "ON account.id = posting_journal.account_id " + 
                        // "AND posting_journal.period_id = 3 " +
                        "GROUP BY account.account_number;";

    db.execute(initial_query, function(err, ans) {
      if(err) {
        console.log("finance report, initial query failed");
        // deferred.reject(err);
        return;
      }
      deferred.resolve(ans);
    });

    return deferred.promise;
  }

  return { 
    generate: generate
  }
});