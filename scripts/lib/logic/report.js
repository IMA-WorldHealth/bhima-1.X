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
      'transReport'     : transReport,
      'debitorAging'    : debitorAging,
      'accountStatement' : accountStatement,
      'saleRecords'     : saleRecords,
      'allTrans'         : allTrans
    };
    
    console.log('server debug', request, params);
    route[request](params)
    .then(
    function(report) { callback(report); },
    function(err) { callback(null, err); });
  }

  function finance(reportParameters) { 
    var requiredFiscalYears, initialQuery, deferred = q.defer(), financeParams = JSON.parse(reportParameters); 
    if(!financeParams) {
      deferred.reject(new Error("[finance.js] No fiscal years provided"));  
      return deferred.promise;
    }
      
    requiredFiscalYears = financeParams.fiscal;
    initialQuery = buildFinanceQuery(requiredFiscalYears);

    db.execute(initialQuery, function(err, ans) {
      if(err) return deferred.reject(err);
      deferred.resolve(ans);
    });

    function buildFinanceQuery(requiredFiscalYears) { 
      //TODO currently joins two very seperate querries and just extracts columns from both, these should
      //be combined and calculations (SUM etc.) performed on the single joined table


      var query = [], budgetColumns = [], realisationColumns = [], selectColumns = [], differenceColumns = [];

      requiredFiscalYears.forEach(function(fiscal_year) { 
        selectColumns.push("budget_result.budget_" + fiscal_year);
        selectColumns.push("period_result.realisation_" + fiscal_year);
        budgetColumns.push("SUM(case when period.fiscal_year_id = " + fiscal_year +" then budget.budget else 0 end) AS `budget_" + fiscal_year + "`");
        realisationColumns.push("(SUM(case when period_total.fiscal_year_id = " + fiscal_year + " then period_total.debit else 0 end) - SUM(case when period_total.fiscal_year_id = " + fiscal_year + " then period_total.credit else 0 end)) AS `realisation_" + fiscal_year + "`");
        differenceColumns.push("(SUM(budget_result.budget_1) - SUM(case when period_result.realisation_1 then period_result.realisation_1 else 0 end)) AS `difference_" + fiscal_year + "`"); 
      });

      query = [
        "SELECT budget_result.account_id, account.account_number, account.account_txt, account.parent, account.account_type_id,",
        selectColumns.join(","),
        ",",
        differenceColumns.join(","),
        // ",(SUM(budget_result.budget_1) - SUM(case when period_result.realisation_1 then period_result.realisation_1 else 0 end)) AS `difference_1`",
        "FROM",
        "(SELECT budget.account_id,",
        budgetColumns.join(","),
        "FROM budget inner join period ON",
        "period.id = budget.period_id",
        // "fiscal_year_id = 1",
        "GROUP BY budget.account_id)",
        "AS `budget_result`",
        "LEFT JOIN",
        "(SELECT period_total.account_id,",
        realisationColumns.join(","),
        "FROM period_total",
        "group by period_total.account_id)",
        "AS `period_result`",
        "ON budget_result.account_id = period_result.account_id",
        "LEFT JOIN",
        "account ON account.id = budget_result.account_id",
        "GROUP BY account.id;"
      ];


      return query.join(' ');
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

  function transReport(params) {
    var params = JSON.parse(params);
    var deferred = q.defer();

    function getElementIds(id){
      var def = q.defer();
      var table, cle;
      if(params.type.toUpperCase() == 'C'){
        table = 'creditor';
        cle = 'group_id';
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
      var sql = "SELECT general_ledger.id, general_ledger.trans_id, "+
              "general_ledger.trans_date, general_ledger.credit, general_ledger.debit, "+
              "account.account_number, currency.name, transaction_type.service_txt, CONCAT(user.first,' ', user.last) as \"names\""+
              "FROM general_ledger, account, currency, transaction_type, user "+
              "WHERE general_ledger.account_id = account.id AND currency.id = general_ledger.currency_id AND"+
              " transaction_type.id = general_ledger.origin_id and user.id = general_ledger.user_id AND general_ledger.deb_cred_id = '"+params.id+
              "' AND general_ledger.deb_cred_type = '"+params.type+"' AND general_ledger.trans_date <= '"+params.dt+"' AND general_ledger.trans_date >= '"+params.df+"'";

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
        var sql = "SELECT general_ledger.id, general_ledger.trans_id, "+
                  "general_ledger.trans_date, general_ledger.credit, general_ledger.debit, "+
                  "account.account_number, currency.name, transaction_type.service_txt, "+
                  "CONCAT(user.first, ' ', user.last) as \"names\" FROM general_ledger, "+
                  "account, currency, transaction_type, user WHERE general_ledger.account_id = "+
                  "account.id AND currency.id = general_ledger.currency_id AND transaction_type.id = "+
                  " general_ledger.origin_id AND user.id = general_ledger.user_id AND general_ledger.deb_cred_type = '"+params.type+"' AND "+
                  "general_ledger.deb_cred_id IN ("+tabIds.toString()+") AND general_ledger.trans_date <= '"+params.dt+"' AND general_ledger.trans_date >= '"+params.df+"'";

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

  function allTrans (params){
    var def = q.defer();
    var params = JSON.parse(params);
    if(!params.source || params.source === 0){

       var requette =
        'SELECT `t`.`trans_id`, `t`.`trans_date`, `t`.`account_id`, `t`.`debit_equiv` AS `debit`,  ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`currency_id`, `t`.`description`, `t`.`comment` ' +
        'FROM (' +
          '(' +
            'SELECT `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit`, ' +
              '`posting_journal`.`credit`, `posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, ' +
              '`posting_journal`.`account_id`, `posting_journal`.`deb_cred_id`, `posting_journal`.`currency_id`, ' +
              '`posting_journal`.`doc_num`, posting_journal.trans_id, `posting_journal`.`description`, `posting_journal`.`comment` ' +
            'FROM `posting_journal` ' +
          ') UNION (' +
            'SELECT `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit`, ' +
              '`general_ledger`.`credit`, `general_ledger`.`debit_equiv`, `general_ledger`.`credit_equiv`, ' +
              '`general_ledger`.`account_id`, `general_ledger`.`deb_cred_id`, `general_ledger`.`currency_id`, ' +
              '`general_ledger`.`doc_num`, general_ledger.trans_id, `general_ledger`.`description`, `general_ledger`.`comment` ' +
            'FROM `general_ledger` ' +
          ')' +
        ') AS `t`';

     // console.log('getting from posting and generale ledger');

    }else{
      console.log('la source est definie');
    }
   // console.log('les parametre a allTrans est est :', params);

    //requette
    //var requette = "SELECT account.id, account.parent, account.account_txt, period_total.period_id, period_total.debit, period_total.credit "+
              //     "FROM account, period_total, period WHERE account.id = period_total.account_id AND period_total.period_id = period.id AND period_total.`fiscal_year_id`='"+params.fiscal_id+"'";

    db.execute(requette, function(err, ans) {
      if(err) {
        console.log("account statement, Query failed");
        throw err;
        return;
      }
      console.log('alltrans', ans);
      def.resolve(ans);
    });

    //promesse
    return def.promise;
  }



  function debitorAging(params){
    //deferred
    var def = q.defer();

    //requette
    var params = JSON.parse(params);
    var requette = "SELECT period.id, period.period_start, period.period_stop, debitor.id as idDebitor, debitor.text, general_ledger.`debit`, general_ledger.`credit`, general_ledger.`account_id` "+
                   "FROM debitor, debitor_group, general_ledger, period WHERE debitor_group.id = debitor.group_id AND debitor.`id` = general_ledger.`deb_cred_id` "+
                   "AND general_ledger.`deb_cred_type`='D' AND general_ledger.`period_id` = period.`id` AND general_ledger.account_id = debitor_group.account_id AND general_ledger.`fiscal_year_id`='"+params.fiscal_id+"'";
    
    db.execute(requette, function(err, ans) {
      if(err) {
        console.log("debitor aging, Query failed");
        throw err;
        return;
      }
      def.resolve(ans);
    });

    //promesse

    return def.promise;
  }

  function accountStatement(params){
    //deferred
    var def = q.defer();
    var params = JSON.parse(params);

    //requette
    var requette = "SELECT account.id, account.parent, account.account_txt, period_total.period_id, period_total.debit, period_total.credit "+
                   "FROM account, period_total, period WHERE account.id = period_total.account_id AND period_total.period_id = period.id AND period_total.`fiscal_year_id`='"+params.fiscal_id+"'";

    db.execute(requette, function(err, ans) {
      if(err) {
        console.log("account statement, Query failed");
        throw err;
        return;
      }
      console.log('account statement', ans);
      def.resolve(ans);
    });

    //promesse

    return def.promise;
  }

  function saleRecords(params) { 
    var deferred = q.defer(); 
    var span = params.span || 'week';
    var spanMap = {};
    
    // TODO implement span, week, day, month etc. WHERE invoice_date <> date
    var requestSql = "SELECT sale.id, sale.cost, sale.currency_id, sale.debitor_id, sale.invoice_date, sale.note, sale.posted, credit_note.id as 'creditId', credit_note.description as 'creditDescription', credit_note.posted as 'creditPosted', first_name, last_name " + 
      "FROM sale LEFT JOIN credit_note on sale.id = credit_note.sale_id " +
      "LEFT JOIN patient on sale.debitor_id = patient.debitor_id;";

    db.execute(requestSql, function(error, result) { 
      if(error) return deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  return { 
    generate: generate
  }; 
});
