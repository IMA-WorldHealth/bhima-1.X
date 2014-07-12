// scripts/lib/logic/report.js

/*
 * TODISCUSS
 *   Reports currently joining accounts with account group and collection to
 *    get account group information, two things:
 *     -should the client download these two table seperately and filter on
 *        the grid, this avoids 3 joins
 *     -should the entire string of the account group titles be sent and
 *        grouped on - or just the ID (with a further look up for the title),
 *        grouping may be more expensive with large strings
 *
 */

var q = require('q'),
    querystring = require('querystring');

module.exports = function (db, sanitize) {
  'use strict';

  function buildFinanceQuery(requiredFiscalYears) {
    //TODO currently joins two very seperate querries and just extracts columns from both, these should
    //be combined and calculations (SUM etc.) performed on the single joined table

    var sql,
        budgetColumns = [],
        realisationColumns = [],
        selectColumns = [],
        differenceColumns = [];

    requiredFiscalYears.forEach(function(fiscal_year) {
      selectColumns.push('budget_result.budget_' + fiscal_year);
      selectColumns.push('period_result.realisation_' + fiscal_year);
      budgetColumns.push('SUM(case when period.fiscal_year_id = ' + fiscal_year +' then budget.budget else 0 end) AS `budget_' + fiscal_year + '`');
      realisationColumns.push('(SUM(case when period_total.fiscal_year_id = ' + fiscal_year + ' then period_total.debit else 0 end) - SUM(case when period_total.fiscal_year_id = ' + fiscal_year + ' then period_total.credit else 0 end)) AS `realisation_' + fiscal_year + '`');
      differenceColumns.push('(SUM(budget_result.budget_1) - SUM(case when period_result.realisation_1 then period_result.realisation_1 else 0 end)) AS `difference_' + fiscal_year + '`');
    });

    sql =
      'SELECT budget_result.account_id, account.account_number, account.account_txt, account.parent, account.account_type_id, ' +
      selectColumns.join(', ') + ', ' + differenceColumns.join(', ') + ' ' +
      'FROM (' +
        'SELECT budget.account_id, ' + budgetColumns.join(', ') + ' ' +
        'FROM budget' +
        'INNER JOIN period ON ' +
          'period.id = budget.period_id ' +
        'GROUP BY budget.account_id' +
      ') AS `budget_result` ' +
      'LEFT JOIN (' +
        'SELECT period_total.account_id, ' + realisationColumns.join(', ') + ' ' +
        'FROM period_total ' +
        'GROUP BY period_total.account_id' +
      ') AS `period_result` ' +
      'ON budget_result.account_id = period_result.account_id ' +
      'LEFT JOIN account ON account.id = budget_result.account_id ' +
      'GROUP BY account.id;';

    return sql;
  }

  function finance(reportParameters) {
    var requiredFiscalYears,
        initialQuery,
        financeParams = JSON.parse(reportParameters);

    if (!financeParams) {
      return q.reject(new Error('[finance.js] No fiscal years provided'));
    }

    requiredFiscalYears = financeParams.fiscal;
    initialQuery = buildFinanceQuery(requiredFiscalYears);

    return db.exec(initialQuery);
  }

  /*
  function transReport(params) {
    console.log('[transReport] params', params);
    params = JSON.parse(params);
    var deferred = q.defer();

    function getElementIds(id) {
      var table, cle, def = q.defer();

      if (params.type.toUpperCase() === 'C') {
        table = 'creditor';
        cle = 'group_id';
      }else if (params.type.toUpperCase() === 'D') {
        table = 'debitor';
        cle = 'group_id';
      }
      var sql = 'SELECT id FROM '+table+' Where '+cle+' =''+id+''';
      db.execute(sql, function(err, ans) {
        if (err) {
          console.log('trans report, Query failed');
          throw err;
          return;
        }else{
          def.resolve(ans);
        }
      });
      return def.promise;
    }

    function getArrayOf(obj) {
      var tab = [];
      obj.forEach(function(item) {
        tab.push(item.id);
      });
      return tab;
    }

    if (params.ig === 'I') {
      var sql = 'SELECT general_ledger.id, general_ledger.trans_id, '+
              'general_ledger.trans_date, general_ledger.credit, general_ledger.debit, '+
              'account.account_number, currency.name, transaction_type.service_txt, CONCAT(user.first,' ', user.last) as \'names\''+
              'FROM general_ledger, account, currency, transaction_type, user '+
              'WHERE general_ledger.account_id = account.id AND currency.id = general_ledger.currency_id AND'+
              ' transaction_type.id = general_ledger.origin_id and user.id = general_ledger.user_id AND general_ledger.deb_cred_uuid = ''+params.id+
              '' AND general_ledger.deb_cred_type = ''+params.type+'' AND general_ledger.trans_date <= ''+params.dt+'' AND general_ledger.trans_date >= ''+params.df+''';

              db.execute(sql, function(err, ans) {
                if (err) {
                  console.log('trans report, Query failed');
                  throw err;
                  // deferred.reject(err);
                  return;
                }
                deferred.resolve(ans);
              });
    }else if (params.ig == 'G') {
      q.all([getElementIds(params.id)]).then(function(res) {
        var tabIds = getArrayOf(res[0]);
        if (tabIds.length!=0) {
        var sql = 'SELECT general_ledger.id, general_ledger.trans_id, '+
                  'general_ledger.trans_date, general_ledger.credit, general_ledger.debit, '+
                  'account.account_number, currency.name, transaction_type.service_txt, '+
                  'CONCAT(user.first, ' ', user.last) as \'names\' FROM general_ledger, '+
                  'account, currency, transaction_type, user WHERE general_ledger.account_id = '+
                  'account.id AND currency.id = general_ledger.currency_id AND transaction_type.id = '+
                  ' general_ledger.origin_id AND user.id = general_ledger.user_id AND general_ledger.deb_cred_type = ''+params.type+'' AND '+
                  'general_ledger.deb_cred_uuid IN ('+tabIds.toString()+') AND general_ledger.trans_date <= ''+params.dt+'' AND general_ledger.trans_date >= ''+params.df+''';

        db.execute(sql, function(err, ans) {
          if (err) {
            console.log('trans report, Query failed');
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

  function allTrans (params) {
    var source = {
      '1' : 'posting_journal',
      '2' : 'general_ledger'
    };
    var def = q.defer();
    params = JSON.parse(params);
    var requette;
    var suite_account = (params.account_id && params.account_id !== 0)? ' AND `t`.`account_id`=''+params.account_id+''' : '';
    var suite_dates   = (params.datef && params.datet)? ' AND `t`.`trans_date`>= ''+params.datef+'' AND `t`.`trans_date` <= ''+params.datet+''' : '';
    //var suite_enterprise = ' AND `t`.`enterprise_id`=''+params.enterprise_id+''';

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
        console.log('account statement, Query failed');
        throw err;
      }
      console.log('on a les resultats', ans);
      def.resolve(ans);
    });

    return def.promise;
  }
 */

  function debitorAging(params) {
    var p, sql;
    p = JSON.parse(params);
    sql =
      'SELECT period.id, period.period_start, period.period_stop, debitor.uuid as idDebitor, debitor.text, general_ledger.debit, general_ledger.credit, general_ledger.account_id ' +
      'FROM debitor JOIN debitor_group JOIN general_ledger JOIN period ON ' +
        'debitor_group.uuid = debitor.group_uuid AND ' +
        'debitor.uuid = general_ledger.deb_cred_uuid AND ' +
        'general_ledger.period_id = period.id AND ' +
        'general_ledger.account_id = debitor_group.account_id ' +
      'WHERE general_ledger.deb_cred_type = \'D\' AND general_ledger.`fiscal_year_id` = ?';

    return db.exec(sql, [p.fiscal_id]);
  }

  function accountStatement(params) {
    var deferred = q.defer();
    var queryStatus, reportSections, report = {};

    // Parse parameters
    params = JSON.parse(params);
    if (!params.dateFrom || !params.dateTo || !params.accountId) {
      return deferred.reject('Invalid params');
    }

    params.dateFrom = '\'' + params.dateFrom + '\'';
    params.dateTo = '\'' + params.dateTo + '\'';

    // Define report sections
    report.overview = {
      query :
        'SELECT SUM(debit_equiv) as `invoiced`, SUM(credit_equiv) as `credit`, SUM(debit_equiv - credit_equiv) as `balance` ' +
        'FROM posting_journal ' +
        'WHERE account_id = ' + params.accountId + ' AND trans_date >= ' + params.dateFrom + ' AND trans_date <= ' + params.dateTo + ';',
      singleResult : true
    };

    report.account = {
      query :
        'SELECT account_number, account_txt, account_type_id, parent, created FROM account where id = ' + params.accountId + ';',
      singleResult : true
    };

    report.balance = {
      query :
        'SELECT SUM(debit_equiv) as `debit`, SUM(credit_equiv) as `credit`, sum(debit_equiv - credit_equiv) as `balance`, COUNT(uuid) as `count` ' +
        'FROM ' +
        '(SELECT uuid, debit_equiv, credit_equiv FROM posting_journal WHERE account_id = ' + params.accountId + ' AND trans_date >= ' + params.dateFrom + ' AND trans_date <= ' + params.dateTo + ' ORDER BY trans_date DESC LIMIT ' + (params.limit) + ', 18446744073709551615)a;',
      singleResult : true
    };

    report.payment = {
      query :
        'SELECT SUM(credit_equiv) as `payed` ' +
        'FROM posting_journal ' +
        'WHERE account_id=' + params.accountId + ' AND origin_id=1 ' + ' AND trans_date >= ' + params.dateFrom + ' AND trans_date <= ' + params.dateTo + ';',
      singleResult : true
    };

    report.detail = {
      query :
        'SELECT trans_date, description, inv_po_id, debit_equiv, credit_equiv, uuid ' +
        'FROM posting_journal ' +
        'WHERE account_id = ' + params.accountId + ' AND trans_date >= ' + params.dateFrom + ' AND trans_date <= ' + params.dateTo + ' ' +
        'ORDER BY trans_date DESC LIMIT ' + params.limit + ';',
      singleResult : false
    };

    // Execute querries
    reportSections = Object.keys(report);
    queryStatus = reportSections.map(function (key) {
      return db.exec(report[key].query);
    });

    // Handle results
    q.all(queryStatus)
      .then(function (result) {
        var packageResponse = {};

        reportSections.forEach(function (key, index) {
          var parseResult = report[key].singleResult ? result[index][0] : result[index];
          packageResponse[key] = report[key].result = parseResult;
        });

        // Ensure we found an account
        if (!report.account.result) {
          return deferred.reject(new Error('Unkown account ' + params.accountId));
        }

        deferred.resolve(packageResponse);
      })
      .catch(function (error) {
        console.log('failed', error);
        deferred.reject(error);
      });

    return deferred.promise;
  }

  function saleRecords(params) {
    params = JSON.parse(params);

    if (!params.dateFrom || !params.dateTo) {
      return q.reject(new Error('Invalid date parameters'));
    }

    var requestSql =
      'SELECT sale.uuid, sale.reference, sale.cost, sale.currency_id, sale.debitor_uuid, sale.invoice_date, ' +
        'sale.note, sale.posted, credit_note.uuid as `creditId`, credit_note.description as `creditDescription`, ' +
        'credit_note.posted as `creditPosted`, first_name, last_name, patient.reference as `patientReference`, CONCAT(project.abbr, sale.reference) as `hr_id` ' +
      'FROM sale LEFT JOIN credit_note on sale.uuid = credit_note.sale_uuid ' +
        'LEFT JOIN patient on sale.debitor_uuid = patient.debitor_uuid ' +
        'LEFT JOIN project on sale.project_id = project.id ' +
      'WHERE sale.invoice_date >=  \'' + params.dateTo + '\' AND sale.invoice_date <= \'' + params.dateFrom + '\' ';

    if (params.project) {
      requestSql += ('AND sale.project_id=' + params.project + ' ');
    }

    requestSql += 'ORDER BY sale.timestamp DESC;';

    return db.exec(requestSql);
  }

  function patientRecords(params) {
    var _id, p = querystring.parse(params);

    if (p.id.indexOf(',')) {
      _id = p.id.split(',').map(function (id) { return sanitize.escape(id); }).join(',');
    } else {
      _id = p.id;
    }

    var sql =
      'SELECT patient.uuid, patient.reference, project.abbr, debitor_uuid, first_name, last_name, dob, father_name, ' +
          'sex, religion, renewal, registration_date, date, CONCAT(user.first,\' \',user.last) AS registrar ' +
        'FROM `patient` JOIN `patient_visit` JOIN `project` JOIN `user` ON ' +
          '`patient`.`uuid`=`patient_visit`.`patient_uuid` AND ' +
          '`patient`.`project_id`=`project`.`id` AND ' +
          '`patient_visit`.`registered_by` = `user`.`id` ' +
        'WHERE `date` >= ? AND ' +
          ' `date` <= ? AND `project_id` IN (' + _id + ');';
    return db.exec(sql, [p.start, p.end]);
  }

  function paymentRecords(params) {
    var p = querystring.parse(params),
        _id = sanitize.escape(p.id);

    var sql =
      'SELECT c.uuid, c.document_id, c.reference, s.reference AS sale_reference, s.project_id AS sale_project, ' +
        'pr.abbr, c.cost, cr.name, c.type, p.first_name, c.description, p.project_id AS debtor_project, p.reference AS debtor_reference , ' +
        'p.last_name, c.deb_cred_uuid, c.deb_cred_type, c.currency_id, ci.invoice_uuid, c.date ' +
      'FROM `cash` AS c JOIN project AS pr JOIN `currency` as cr JOIN `cash_item` AS ci ' +
        'JOIN `debitor` AS d JOIN `patient` as p JOIN sale AS s ' +
        'ON ci.cash_uuid = c.uuid AND c.currency_id = cr.id AND ' +
        'c.project_id = pr.id AND ' +
        'c.deb_cred_uuid = d.uuid AND d.uuid = p.debitor_uuid AND ' +
        'ci.invoice_uuid = s.uuid ' +
      'WHERE c.project_id IN (' + _id + ') AND c.date >= ? AND ' +
        'c.date <= ? ' +
      'GROUP BY c.document_id;';

    return db.exec(sql, [p.start, p.end]);
  }

  function patientStanding(params) {
    params = querystring.parse(params);
    var sql,
        patient = {},
        defer = q.defer();

    sql =
      'SELECT uuid, trans_id, trans_date, sum(credit_equiv) as credit, sum(debit_equiv) as debit, description, inv_po_id ' +
      'FROM (' +
        'SELECT uuid, trans_id, trans_date, debit_equiv, credit_equiv, description, inv_po_id ' +
        'FROM posting_journal WHERE deb_cred_uuid = ? AND deb_cred_type=\'D\' ' +
      'UNION ' +
        'SELECT uuid, trans_id, trans_date, debit_equiv, credit_equiv, description, inv_po_id ' +
        'FROM general_ledger WHERE deb_cred_uuid = ? AND deb_cred_type=\'D\') as aggregate ' +
      'GROUP BY `inv_po_id` ORDER BY `trans_date` DESC;';

    db.exec(sql, [params.id, params.id])
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

  function stockLocation (params) {
    var sql, p = querystring.parse(params);

    sql =
      'SELECT inventory_uuid, stock.tracking_number, direction, expiration_date, ' +
        'SUM(stock_movement.quantity) as quantity, depot.text ' +
      'FROM stock_movement JOIN stock JOIN depot ' +
        'ON stock_movement.tracking_number = stock.tracking_number AND ' +
        'stock_movement.depot_id = depot.id ' +
      'WHERE inventory_uuid = ? ' +
      'GROUP BY tracking_number, depot_id, direction;';
    return db.exec(sql, [p.id]);
  }

  function stockCount () {
    var sql;

    sql =
      'SELECT uuid, code, text, name, SUM(quantity) AS quantity FROM (' +
        'SELECT inventory.uuid, inventory.code, text, name ' +
        'FROM inventory JOIN inventory_group ON inventory.group_uuid = inventory_group.uuid ' +
        'WHERE type_id = 0' +
      ') AS inv ' +
      'LEFT JOIN stock ON stock.inventory_uuid = inv.uuid ' +
      'GROUP BY uuid;';

    return db.exec(sql);
  }

  function priceReport () {
    var sql;

    sql =
      'SELECT inventory.code, text, price, inventory_group.code AS group_code, name, price ' +
      'FROM inventory JOIN inventory_group WHERE inventory.group_uuid = inventory_group.uuid ' +
      'ORDER BY inventory_group.code;';

    return db.exec(sql)
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

      return q(groups);
    });
  }

  function transactionsByAccount(params) {
    var sql, p = querystring.parse(params);

    sql =
      'SELECT trans_date, description, account_number, debit_equiv, credit_equiv, currency_id ' +
      'FROM (' +
        'SELECT trans_date, description, account_id, debit_equiv, credit_equiv, currency_id ' +
        'FROM posting_journal ' +
      'UNION ' +
        'SELECT trans_date, description, account_id, debit_equiv, credit_equiv, currency_id ' +
        'FROM general_ledger' +
      ') AS journal JOIN account ON ' +
        'journal.account_id = account.id ' +
      'WHERE account.id = ? ' +
      'LIMIT ?;';

    return db.exec(sql, [p.account, p.limit]);
  }

  // TODO: Revamp this code to do something like
  // var params = Array.prototype.slice.call(arguements)
  // var request = params.unshift();
  // route[request](params);
  //
  // This will increase the power of the function.
  //
  // Also consider doing some error catching (in case route doesn't exist)
  // by wrapping route[request](params) in q();
  return function generate(request, params, done) {
    /*summary
    *   Route request for reports, if no report matches given request, return null
    */
    var route = {
      'finance'          : finance,
      //'transReport'      : transReport,
      'debitorAging'     : debitorAging,
      'saleRecords'      : saleRecords,
      'patients'         : patientRecords,
      'payments'         : paymentRecords,
      'patientStanding'  : patientStanding,
      'accountStatement' : accountStatement,
      //'allTrans'         : allTrans,
      'prices'           : priceReport,
      'stock_location'   : stockLocation,
      'stock_count'      : stockCount,
      'transactions'     : transactionsByAccount
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
