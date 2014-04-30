// scripts/lib/logic/report.js

/*
 * TODISCUSS
 *   Reports currently joining accounts with account group and collection to get account group information, two things:
 *     -should the client download these two table seperately and filter on the grid, this avoids 3 joins
 *     -should the entire string of the account group titles be sent and grouped on - or just the ID (with a further look up for the title), grouping may be more expensive with large strings
 *
 */

var q = require('q'),
    querystring = require('querystring'),
    util = require('../util/util'),
    sanitize = require('../util/sanitize');

module.exports = function (db) {
  'use strict';

  function buildFinanceQuery(requiredFiscalYears) {
    //TODO currently joins two very seperate querries and just extracts columns from both, these should
    //be combined and calculations (SUM etc.) performed on the single joined table

    var query = [],
        budgetColumns = [],
        realisationColumns = [],
        selectColumns = [],
        differenceColumns = [];

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

  function finance(reportParameters) {
    var requiredFiscalYears,
        initialQuery,
        deferred = q.defer(),
        financeParams = JSON.parse(reportParameters);

    if(!financeParams) {
      deferred.reject(new Error("[finance.js] No fiscal years provided"));
      return deferred.promise;
    }

    requiredFiscalYears = financeParams.fiscal;
    initialQuery = buildFinanceQuery(requiredFiscalYears);

    db.execute(initialQuery, function(err, ans) {
      if (err) { return deferred.reject(err); }
      deferred.resolve(ans);
    });

    return deferred.promise;
  }

  function transReport(params) {
    console.log('[transReport] params', params);
    params = JSON.parse(params);
    var deferred = q.defer();

    function getElementIds(id){
      var table, cle, def = q.defer();

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

    if(params.ig === 'I'){
      var sql = "SELECT general_ledger.id, general_ledger.trans_id, "+
              "general_ledger.trans_date, general_ledger.credit, general_ledger.debit, "+
              "account.account_number, currency.name, transaction_type.service_txt, CONCAT(user.first,' ', user.last) as \"names\""+
              "FROM general_ledger, account, currency, transaction_type, user "+
              "WHERE general_ledger.account_id = account.id AND currency.id = general_ledger.currency_id AND"+
              " transaction_type.id = general_ledger.origin_id and user.id = general_ledger.user_id AND general_ledger.deb_cred_uuid = '"+params.id+
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
                  "general_ledger.deb_cred_uuid IN ("+tabIds.toString()+") AND general_ledger.trans_date <= '"+params.dt+"' AND general_ledger.trans_date >= '"+params.df+"'";

        db.execute(sql, function(err, ans) {
          if(err) {
            console.log("trans report, Query failed");
            throw err;
            // deferred.reject(err);
            return;
          }
          deferred.resolve(ans);
        });

        } else {
          console.log('groupe vide');
          deffered.resolve(tabIds); //un tableau vide
        }
      });
    }
    return deferred.promise;
  }

  function allTrans (params){
    var source = {
      "1" : "posting_journal",
      "2" : "general_ledger"
    };
    var def = q.defer();
    params = JSON.parse(params);
    var requette;
    var suite_account = (params.account_id && params.account_id !== 0)? " AND `t`.`account_id`='"+params.account_id+"'" : '';
    var suite_dates   = (params.datef && params.datet)? " AND `t`.`trans_date`>= '"+params.datef+"' AND `t`.`trans_date` <= '"+params.datet+"'" : '';
    //var suite_enterprise = " AND `t`.`enterprise_id`='"+params.enterprise_id+"'";

    if (!params.source || params.source === 0) {
      requette =
        'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `ac`.`account_number`, `t`.`debit_equiv` AS `debit`,  ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`currency_id`, `t`.`description`, `t`.`comment` ' +
        'FROM (' +
          '(' +
            'SELECT `posting_journal`.`project_id`, `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit_equiv`, ' +
              '`posting_journal`.`credit_equiv`, `posting_journal`.`account_id`, `posting_journal`.`deb_cred_uuid`, `posting_journal`.`currency_id`, ' +
              '`posting_journal`.`doc_num`, posting_journal.trans_id, `posting_journal`.`description`, `posting_journal`.`comment` ' +
            'FROM `posting_journal` ' +
          ') UNION (' +
            'SELECT `general_ledger`.`project_id`, `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit_equiv`, ' +
              '`general_ledger`.`credit_equiv`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_uuid`, `general_ledger`.`currency_id`, ' +
              '`general_ledger`.`doc_num`, general_ledger.trans_id, `general_ledger`.`description`, `general_ledger`.`comment` ' +
            'FROM `general_ledger` ' +
          ')' +
        ') AS `t`, account AS ac WHERE `t`.`account_id` = `ac`.`id`'+suite_account+suite_dates;

    } else {
      var sub_chaine = [
        '`enterprise_id`, ','`id`, ', '`inv_po_id`, ',
        '`trans_date`, ', '`debit_equiv`, ',
        '`credit_equiv`, ', '`account_id`, ',
        '`deb_cred_uuid`, ', '`currency_id`, ', '`doc_num`, ',
        '`trans_id`, ', '`description`, ', '`comment` '
      ].join(source[params.source] + '.');
      sub_chaine = source[params.source] + '.' + sub_chaine;
      requette =
        'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `ac`.`account_number`, `t`.`debit_equiv` AS `debit`,  ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`currency_id`, `t`.`description`, `t`.`comment` ' +
        'FROM (' +
          'SELECT '+sub_chaine+'FROM '+source[params.source]+
        ') AS `t`, account AS ac WHERE `AND `t`.`account_id` = `ac`.`id`'+suite_account+suite_dates;
    }

    db.execute(requette, function(err, ans) {
      if (err) {
        console.log("account statement, Query failed");
        throw err;
      }
      console.log('on a les resultats', ans);
      def.resolve(ans);
    });

    return def.promise;
  }

  function debitorAging (params){
    var def = q.defer();
    params = JSON.parse(params);
    var requette =
      "SELECT period.id, period.period_start, period.period_stop, debitor.uuid as idDebitor, debitor.text, general_ledger.debit, general_ledger.credit, general_ledger.account_id " +
      "FROM debitor, debitor_group, general_ledger, period WHERE debitor_group.uuid = debitor.group_uuid AND debitor.uuid = general_ledger.deb_cred_uuid " +
      "AND general_ledger.`deb_cred_type`='D' AND general_ledger.`period_id` = period.`id` AND general_ledger.account_id = debitor_group.account_id AND general_ledger.`fiscal_year_id`='"+params.fiscal_id +"'";

    db.execute(requette, function(err, ans) {
      if (err) { return def.reject(err); }
      def.resolve(ans);
    });

    return def.promise;
  }

  function accountStatement(params){
    var def = q.defer();
    params = JSON.parse(params);
    
    console.log('\n\n\n accountStatement\n');
    if (!params.dateFrom || !params.dateTo) return def.reject('Invalid params');
  
    def.resolve('Success');
    // db.execute(requette, function(err, ans) {
    //   if (err) { return def.reject(err); }
    //   def.resolve(ans);
    // });

    return def.promise;
  }

  function saleRecords(params) {
    var deferred = q.defer();
    params = JSON.parse(params);

    if (!params.dateFrom || !params.dateTo) return q.reject(new Error("Invalid date parameters"));

    var requestSql =
      "SELECT sale.uuid, sale.reference, sale.cost, sale.currency_id, sale.debitor_uuid, sale.invoice_date, " +
      "sale.note, sale.posted, credit_note.uuid as 'creditId', credit_note.description as 'creditDescription', " +
      "credit_note.posted as 'creditPosted', first_name, last_name, patient.reference as 'patientReference', CONCAT(project.abbr, sale.reference) as 'hr_id' " +
      "FROM sale LEFT JOIN credit_note on sale.uuid = credit_note.sale_uuid " +
      "LEFT JOIN patient on sale.debitor_uuid = patient.debitor_uuid " +
      "LEFT JOIN project on sale.project_id = project.id " +
      "WHERE sale.invoice_date >=  \'" + params.dateTo + "\' AND sale.invoice_date <= \'" + params.dateFrom + "\' ";

    if (params.project) requestSql += ("AND sale.project_id=" + params.project + " ");

    requestSql += "ORDER BY sale.timestamp DESC;";

    db.execute(requestSql, function(error, result) {
      if(error) return deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  function patientRecords(params) {
    var p = querystring.parse(params),
        deferred = q.defer();

    var _start = sanitize.escape(util.toMysqlDate(new Date(p.start))),
        _end =  sanitize.escape(util.toMysqlDate(new Date(p.end).setDate(new Date(p.end).getDate() + 1))),
        _id = sanitize.escape(p.id);

    var sql =
      "SELECT patient.uuid, patient.reference, project.abbr, debitor_uuid, first_name, last_name, dob, father_name, " +
          "sex, religion, renewal, registration_date, date, CONCAT(user.first,' ',user.last) AS registrar " +
        "FROM `patient` JOIN `patient_visit` JOIN `project` JOIN `user` ON " +
          "`patient`.`uuid`=`patient_visit`.`patient_uuid` AND " +
          "`patient`.`project_id`=`project`.`id` AND " +
          "`patient_visit`.`registered_by` = `user`.`id` " +
        "WHERE `date` >= " + _start + " AND " +
          " `date` <= " + _end + " AND `project_id` IN (" + _id + ");";
    db.execute(sql, function (err, res) {
      if (err) { return deferred.reject(err); }
      deferred.resolve(res);
    });

    return deferred.promise;
  }

  function paymentRecords(params) {
    var p = querystring.parse(params);

    var _start = sanitize.escape(util.toMysqlDate(new Date(p.start))),
        _end =  sanitize.escape(util.toMysqlDate(new Date(p.end))),
        _id = sanitize.escape(p.id);

    var sql =
      "SELECT c.uuid, c.document_id, c.reference, s.reference AS sale_reference, s.project_id AS sale_project, " +
        "pr.abbr, c.cost, cr.name, c.type, p.first_name, c.description, p.project_id AS debtor_project, p.reference AS debtor_reference , " +
        "p.last_name, c.deb_cred_uuid, c.deb_cred_type, c.currency_id, ci.invoice_uuid, c.date " +
      "FROM `cash` AS c JOIN project AS pr JOIN `currency` as cr JOIN `cash_item` AS ci " +
        "JOIN `debitor` AS d JOIN `patient` as p JOIN sale AS s " +
        "ON ci.cash_uuid = c.uuid AND c.currency_id = cr.id AND " +
        "c.project_id = pr.id AND " +
        "c.deb_cred_uuid = d.uuid AND d.uuid = p.debitor_uuid AND " +
        "ci.invoice_uuid = s.uuid " +
      "WHERE c.project_id IN (" + _id + ") AND c.date >= " + _start + " AND " +
        "c.date <= " + _end + " " +
      "GROUP BY c.document_id;";

    return db.exec(sql);
  }

  function invoiceRecords(params) {
    var p = querystring.parse(params),
        deferred = q.defer();

    var _start = sanitize.escape(util.toMysqlDate(new Date(p.start))),
        _end =  sanitize.escape(util.toMysqlDate(new Date(p.end))),
        _id = sanitize.escape(p.id);

    var sql =
      "SELECT i.uuid, ig.code, ig.name, ig.sales_account, SUM(si.quantity) AS quantity, " +
        "SUM(si.transaction_price) AS total_price " +
      "FROM `sale` AS s JOIN `sale_item` as si JOIN `inventory` AS i JOIN `inventory_group` AS ig " +
      "ON s.uuid = si.sale_uuid AND si.inventory_uuid = i.uuid AND i.group_uuid = ig.uuid " +
      "WHERE s.invoice_date >= " + _start + " AND " +
        "s.invoice_date < " + _end + " AND " +
        "i.enterprise_id = " + _id + " " +
      "ORDER BY i.code " +
      "GROUP BY i.id;";

    db.execute(sql, function (err, res) {
      if (err) { return deferred.reject(err); }
      deferred.resolve(res);
    });

    return deferred.promise;
  }

  function patientStanding(params) {
    params = querystring.parse(params);
    var id = sanitize.escape(params.id),
        patient = {},
        defer = q.defer(),
        sql =
        "SELECT uuid, trans_id, trans_date, sum(credit_equiv) as credit, sum(debit_equiv) as debit, description, inv_po_id " +
        "FROM (" +
          "SELECT uuid, trans_id, trans_date, debit_equiv, credit_equiv, description, inv_po_id " +
          "FROM posting_journal WHERE deb_cred_uuid=" + id + " AND deb_cred_type='D' " +
        "UNION " +
          "SELECT uuid, trans_id, trans_date, debit_equiv, credit_equiv, description, inv_po_id " +
          "FROM general_ledger WHERE deb_cred_uuid=" + id + " AND deb_cred_type='D') as aggregate " +
        "GROUP BY `inv_po_id` ORDER BY `trans_date` DESC;";

    db.exec(sql)
    .then(function (rows) {
      if (!rows.length) { return defer.resolve([]); }

      patient.receipts = rows;

      // last payment date
      sql =
        'SELECT trans_date FROM `posting_journal` WHERE `origin_id` = 1 ORDER BY `trans_date` DESC LIMIT 1;';

      return db.exec(sql);
    })
    .then(function (rows) {
      var row = rows.pop();
      patient.last_payment_date = row.trans_date;

      sql =
        'SELECT trans_date FROM `posting_journal` WHERE `origin_id` = 2 ORDER BY `trans_date` DESC LIMIT 1;';
      return db.exec(sql);
    })
    .then(function (rows) {
      var row = rows.pop();
      patient.last_purchase_date = row.trans_date;
      defer.resolve(patient);
    })
    .catch(function (err) {
      defer.reject(err);
    });

    return defer.promise;
  }

  function priceReport (params) {
    var sql, defer = q.defer();

    sql =
      "SELECT inventory.code, text, price, inventory_group.code AS group_code, name, price " +
      "FROM inventory JOIN inventory_group WHERE inventory.group_uuid = inventory_group.uuid " +
      "ORDER BY inventory_group.code;";

    db.exec(sql)
    .then(function (data) {
      var groups = {};
      data.forEach(function (row) {
        if (!groups[row.group_code]) {
          groups[row.group_code] = {};
          groups[row.group_code].name = row.name;
          groups[row.group_code].code = row.group_code;
          groups[row.group_code].rows = [];
        }
        groups[row.group_code].rows.push(row);
      });

      defer.resolve(groups);
    })
    .catch(function (error) { defer.reject(error); });

    return defer.promise;
  }


  return function generate(request, params, done) {
    /*summary
    *   Route request for reports, if no report matches given request, return null
    */
    var route = {
      'finance'         : finance,
      'transReport'     : transReport,
      'debitorAging'    : debitorAging,
      'saleRecords'     : saleRecords,
      'patients'        : patientRecords,
      'payments'        : paymentRecords,
      'patientStanding' : patientStanding,
      'accountStatement': accountStatement,
      'allTrans'        : allTrans,
      'prices'          : priceReport
    };

    route[request](params)
    .then(function (report) {
      done(report);
    })
    .catch(function (err) {
      done(null, err);
    })
    .done();
  };
};
