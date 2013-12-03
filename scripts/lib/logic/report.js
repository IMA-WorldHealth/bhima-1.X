var q = require('Q');

module.exports = (function(db) { 
  'use strict'

  function generate(request, params, callback) { 
    /*summary 
    *   Route request for reports, if no report matches given request, return null  
    *   --This might be overly complex, it was much simpler but was decided one file was messy
    */
    var route = {
      'finance' : finance
    }

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

  function buildFinanceQuery(requiredFiscalYears) { 

    var query;
    var fiscalColumns = "";

    //add budget columns
    requiredFiscalYears.forEach(function(year) { 
      fiscalColumns += "(SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.credit else 0 end) - SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.debit else 0 end)) AS 'realisation "+year+"',";
    });

    query = "SELECT account.id," +
                   "account.account_number," +
                   fiscalColumns + 
                   "posting_journal.period_id " +
            "FROM account " +
            "LEFT JOIN posting_journal " +
            "ON account.id = posting_journal.account_id " + 
            // "AND posting_journal.period_id = 3 " +
            "GROUP BY account.account_number;";

    return query;


  }
});