// scripts/lib/logic/report.js

/*
 * TODISCUSS
 *   Reports currently joining accounts with account group and collection to get account group information, two things:
 *     -should the client download these two table seperately and filter on the grid, this avoids 3 joins
 *     -should the entire string of the account group titles be sent and grouped on - or just the ID (with a further look up for the title), grouping may be more expensive with large strings
 * 
 */

var q = require('q');

module.exports = (function (db) { 
  'use strict';

  function generate(request, params, callback) { 
    /*summary 
    *   Route request for reports, if no report matches given request, return null  
    */
    var route = {
      'finance'         : finance,
      'stock'           : stock,
      'transReport'     : transReport
      // 'account_balance' : account_balance
    };
    
    console.log('server debug', request, params);
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


    function buildFinanceQuery(requiredFiscalYears) { 
      
      //TODO Update to use period_totals, not query the posting journal/ general ledger 
      var query;
      var fiscalColumns = "";

      //add budget columns
      requiredFiscalYears.forEach(function(year) { 
        fiscalColumns += "(SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.debit else 0 end) - SUM(case when posting_journal.fiscal_year_id = "+year+" then posting_journal.credit else 0 end)) AS 'realisation "+year+"',";
      });

      query = "SELECT account.id," +
                    "account.account_number," +
                    fiscalColumns + 
                    "account.account_txt " + 
              "FROM account " +
              "LEFT JOIN posting_journal " +
              "ON account.id = posting_journal.account_id " + 
              // "AND posting_journal.period_id = 3 " +
              "GROUP BY account.account_number;";

      return query;
    }
    return deferred.promise;
  }

  function stock (reportParams) {
    var query, enterprise, group, groupby,
      defer = q.defer();

    enterprise = reportParams.enterprise;
    group = reportParams.group;
    groupby = reportParams.groupby;
    
    query = ["SELECT inventory.code, inventory.text, inv_group.symbol, inv_group.name, inventory.stock, inv_unit.text ",
             "FROM inventory JOIN inv_group JOIN inv_unit ON ", 
                "inventory.group_id = inv_group.id AND ",
                "inventory.unit_id = inv_unit.id ",
             "WHERE inventory.enterprise_id = ", db.escapestr(enterprise), " ",
             "ORDER BY inventory.group_id;"
            ];

    // db.execute(blah);

    return defer.promise;
  }


  function transReport(params){
    var params = JSON.parse(params);
    var deferred = q.defer();

    function getElementIds(id){
      var def = q.defer();
      var table, cle;
      if(params.type.toUpperCase() == 'C'){
        table = 'creditor';
        cle = 'creditor_group_id';
      }else if(params.type.toUpperCase() == 'D'){
        table = 'debitor';
        cle = 'group_id';
      }
      var sql = "SELECT id FROM "+table+" Where "+cle+" ='"+id+"'";
      db.execute(sql, function(err, ans){
        if(err){
          console.log("trans report, Query failed");
          throw err;
          return;
        }else{
          def.resolve(ans);
        }
      });
      return def.promise;
    } 

    function getArrayOf(obj){
      var tab = [];
      obj.forEach(function(item){
        tab.push(item.id);
      });
      return tab;
    }

    if(params.ig == 'I'){
      var sql = "SELECT posting_journal.id, posting_journal.trans_id, "+
              "posting_journal.trans_date, posting_journal.credit, posting_journal.debit, "+
              "account.account_number, currency.name, transaction_type.service_txt, CONCAT(user.first,' ', user.last) as \"names\""+
              "FROM posting_journal, account, currency, transaction_type, user "+
              "WHERE posting_journal.account_id = account.id AND currency.id = posting_journal.currency_id AND"+
              " transaction_type.id = posting_journal.origin_id and user.id = posting_journal.user_id AND posting_journal.deb_cred_id = '"+params.id+
              "' AND posting_journal.deb_cred_type = '"+params.type+"' AND posting_journal.trans_date <= '"+params.dt+"' AND posting_journal.trans_date >= '"+params.df+"'";

              db.execute(sql, function(err, ans) {
                if(err) {
                  console.log("trans report, Query failed");
                  throw err;
                  // deferred.reject(err);
                  return;
                }
                deferred.resolve(ans);
              });
    }else if(params.ig == 'G'){
      q.all([getElementIds(params.id)]).then(function(res){
        var tabIds = getArrayOf(res[0]);
        if(tabIds.length!=0){
        var sql = "SELECT posting_journal.id, posting_journal.trans_id, "+
                  "posting_journal.trans_date, posting_journal.credit, posting_journal.debit, "+
                  "account.account_number, currency.name, transaction_type.service_txt, "+
                  "CONCAT(user.first, ' ', user.last) as \"names\" FROM posting_journal, "+
                  "account, currency, transaction_type, user WHERE posting_journal.account_id = "+
                  "account.id AND currency.id = posting_journal.currency_id AND transaction_type.id = "+
                  " posting_journal.origin_id AND user.id = posting_journal.user_id AND posting_journal.deb_cred_type = '"+params.type+"' AND "+
                  "posting_journal.deb_cred_id IN ("+tabIds.toString()+") AND posting_journal.trans_date <= '"+params.dt+"' AND posting_journal.trans_date >= '"+params.df+"'";

        db.execute(sql, function(err, ans) {
          if(err) {
            console.log("trans report, Query failed");
            throw err;
            // deferred.reject(err);
            return;
          }
          deferred.resolve(ans);
        }); }
        else{
          console.log('groupe vide');
          deffered.resolve(tabIds); //un tableau vide
        }              
      });
    }    
    return deferred.promise;
    }

  return { 
    generate: generate
  };

});
