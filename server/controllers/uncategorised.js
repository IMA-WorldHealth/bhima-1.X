/**
 * Uncategorised HTTP Controllers
 *
 * This file should not exist, it can be removed once all routes have been standardised
 * and categorised
 */
var db          = require('./../lib/db');
var sanitize    = require('./../lib/sanitize');
var util        = require('./../lib/util');
var uuid        = require('./../lib/guid');
var cfg         = require('./../config/environment/server');

// Route specific requirements
var synthetic                  = require('./synthetic');
//var depot                      = require('./depot')();
var taxPayment                 = require('./taxPayment');
var donation                   = require('./postingDonation')();
var cotisationPayment          = require('./cotisationPayment')();
var promessePayment            = require('./postingPromessePayment')();
var promesseCotisation         = require('./postingPromesseCotisation')();
var promesseTax                = require('./postingPromesseTax')();

exports.exposeRoot = function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
};

exports.getPeriodByDate = function (req, res, next) {
  // var date = new Date(Number(req.params.date) + new Date(req.params.date).getTimezoneOffset());
  var date = new Date(req.params.date);
  date = util.toMysqlDate(date);

  var sql =
    'SELECT id, fiscal_year_id FROM period ' +
    'WHERE period_start <= ? AND period_stop >= ? LIMIT 1';

  db.exec(sql, [date, date])
  .then(function (rows) {
    res.send(rows[0]);
  })
  .catch(next)
  .done();
};

exports.maxTransactionByProject = function (req, res, next) {
  // When did we switch from IFNULL in the posting journal
  var sql =
    'SELECT abbr, IFNULL(MAX(increment), 1) AS increment FROM (' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
      'WHERE project_id = ? ' +
      'UNION ' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
      'WHERE project_id = ?)c;';
  db.exec(sql, [req.params.projectId, req.params.projectId])
  .then(function (ans) {
    res.send(ans);
  })
  .catch(next)
  .done();

  /*
   * Legacy method
  var project_id = sanitize.escape(req.params.project_id);
  var sql =
    'SELECT abbr, max(increment) AS increment FROM (' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM posting_journal JOIN project ON posting_journal.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ' ' +
      'UNION ' +
      'SELECT project.abbr, max(floor(substr(trans_id, 4))) + 1 AS increment ' +
      'FROM general_ledger JOIN project ON general_ledger.project_id = project.id ' +
      'WHERE project_id = ' + project_id + ')c;';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
  */
};

exports.stockExpiringByDepot = function (req, res, next) {
  //TODO : put it in a separate file
  var genSql =
    'SELECT stock.inventory_uuid, stock.tracking_number, ' +
    'stock.lot_number, stock.quantity as initial, stock.expiration_date, inventory.text '+
    'FROM stock JOIN inventory ON stock.inventory_uuid = inventory.uuid '+
    'WHERE DATE(stock.expiration_date) >=DATE('+sanitize.escape(req.params.df)+')'+
    ' AND DATE(stock.expiration_date) <=DATE('+sanitize.escape(req.params.dt)+')';

  var speSql =
    'SELECT stock.inventory_uuid, stock.tracking_number, ' +
    'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
    ', movement.quantity, (movement.quantity*-1))) as current, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
    ', movement.quantity, 0)) AS initial, inventory.text FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
    'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
    'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') AND stock.expiration_date>='+sanitize.escape(req.params.df)+
    ' AND stock.expiration_date<='+sanitize.escape(req.params.dt)+' GROUP BY movement.tracking_number';

  db.exec(req.params.depot_uuid === '*' ? genSql : speSql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.submitDonation = function (req, res, next) {
  donation.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};


exports.profitByPeriod = function (req, res, next) {
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`pc_id`=' + sanitize.escape(req.params.pc_id) +
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {profit : 0};}
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });

    var profit = availableprofitAccounts.reduce(function (x, y) {
      return x + (y.credit - y.debit);

    }, 0);

    return {profit : profit};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('pcv_periodic', req.params.id_project, {pc_id : req.params.pc_id, start : req.params.start, end : req.params.end, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
};


exports.listTaxCurrency = function (req, res, next) {
  var sql = "SELECT t.id,t.taux,t.tranche_annuelle_debut,t.tranche_annuelle_fin,t.tranche_mensuelle_debut,t.tranche_mensuelle_fin,t.ecart_annuel,t.ecart_mensuel,t.impot_annuel,t.impot_mensuel,t.cumul_annuel,t.cumul_mensuel,t.currency_id,c.symbol FROM taxe_ipr t, currency c WHERE t.currency_id = c.id";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.buildPayrollReport = function (req, res, next) {
  var sql = "SELECT paiement.uuid, paiement.employee_id, paiement.paiement_period_id, paiement.currency_id,"
          + " paiement.net_before_tax, paiement.net_after_tax, paiement.net_after_tax, paiement.net_salary,"
          + " employee.code, employee.prenom, employee.name, employee.postnom, employee.dob, employee.sexe"
          + " FROM paiement"
          + " JOIN employee ON employee.id = paiement.employee_id"
          + " WHERE paiement_period_id = " + sanitize.escape(req.query.period_id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listPaiementData = function (req, res, next) {
  var sql = "SELECT paiement.uuid, paiement.employee_id, paiement.paiement_period_id, paiement_period.dateFrom,"
          + " paiement_period.dateTo, paiement.currency_id,"
          + " paiement.net_before_tax, paiement.net_after_tax, paiement.net_after_tax, paiement.net_salary,"
          + " paiement.working_day, paiement.paiement_date, employee.code, employee.prenom, employee.name,"
          + " employee.postnom, employee.dob, employee.sexe, employee.nb_spouse, employee.nb_enfant,"
          + " employee.grade_id, grade.text, grade.code AS 'codegrade', grade.basic_salary, exchange_rate.rate,"
          + " exchange_rate.enterprise_currency_id"
          + " FROM paiement"
          + " JOIN employee ON employee.id = paiement.employee_id"
          + " JOIN grade ON grade.uuid = employee.grade_id "
          + " JOIN paiement_period ON paiement_period.id = paiement.paiement_period_id"
          + " JOIN exchange_rate ON exchange_rate.date = paiement.paiement_date"
          + " WHERE paiement.uuid = " + sanitize.escape(req.query.invoiceId);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listRubricsData = function (req, res, next) {
  var sql = "SELECT rubric_paiement.id, rubric_paiement.paiement_uuid, rubric_paiement.rubric_id, rubric.label,"
          + " rubric.is_discount, rubric_paiement.value"
          + " FROM rubric_paiement"
          + " JOIN rubric ON rubric.id = rubric_paiement.rubric_id"
          + " WHERE rubric_paiement.paiement_uuid= " + sanitize.escape(req.query.invoiceId);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listTaxesData = function (req, res, next) {
  var sql = "SELECT tax_paiement.id, tax_paiement.paiement_uuid, tax_paiement.tax_id, tax.label,"
          + " tax_paiement.value, tax.is_employee"
          + " FROM tax_paiement"
          + " JOIN tax ON tax.id = tax_paiement.tax_id"
          + " WHERE tax.is_employee = '1' AND tax_paiement.paiement_uuid = " + sanitize.escape(req.query.invoiceId);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listPaymentByEmployee = function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, e.creditor_uuid, p.uuid as paiement_uuid, p.currency_id, t.label, t.abbr, t.four_account_id AS 'other_account', z.tax_id, z.value, z.posted"
          + " FROM employee e "
          + " JOIN paiement p ON e.id=p.employee_id "
          + " JOIN tax_paiement z ON z.paiement_uuid=p.uuid "
          + " JOIN tax t ON t.id=z.tax_id "
          + " WHERE p.paiement_period_id=" + sanitize.escape(req.params.id) + " AND t.is_employee=1 "
          + " ORDER BY e.name ASC, e.postnom ASC, e.prenom ASC";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listDistinctInventory = function (req, res, next) {
  var sql = "SELECT DISTINCT inventory.code, inventory.text, stock.inventory_uuid FROM stock"
          + " JOIN inventory ON stock.inventory_uuid=inventory.uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listPaymentByEnterprise = function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, e.creditor_uuid, p.uuid as paiement_uuid, p.currency_id, t.label, t.abbr, t.four_account_id AS 'other_account', z.tax_id, z.value, z.posted"
          + " FROM employee e "
          + " JOIN paiement p ON e.id=p.employee_id "
          + " JOIN tax_paiement z ON z.paiement_uuid=p.uuid "
          + " JOIN tax t ON t.id=z.tax_id "
          + " WHERE p.paiement_period_id=" + sanitize.escape(req.params.employee_id) + " AND t.is_employee=0 "
          + " ORDER BY e.name ASC, e.postnom ASC, e.prenom ASC";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.lookupPeriod = function (req, res, next) {
  var sql = "SELECT * FROM period WHERE fiscal_year_id = " + sanitize.escape(req.query.fiscal_year_id);
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.payCotisation = function (req, res, next) {
  cotisationPayment.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.payPromesse = function (req, res, next) {
  promessePayment.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.payPromesseCotisation = function (req, res, next) {
  promesseCotisation.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.payPromesseTax = function (req, res, next) {
  promesseTax.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.setCotisationPayment = function (req, res, next) {
  var sql = "UPDATE cotisation_paiement SET posted=1"
          + " WHERE cotisation_paiement.paiement_uuid=" + sanitize.escape(req.body.paiement_uuid) + " AND cotisation_paiement.cotisation_id=" + sanitize.escape(req.body.cotisation_id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listEmployeeCotisationPayments = function (req, res, next) {
  var sql = "SELECT e.id, e.code, e.prenom, e.name, e.postnom, e.creditor_uuid, p.uuid as paiement_uuid, p.currency_id, t.label, t.abbr, t.four_account_id AS 'other_account', z.cotisation_id, z.value, z.posted"
          + " FROM employee e "
          + " JOIN paiement p ON e.id=p.employee_id "
          + " JOIN cotisation_paiement z ON z.paiement_uuid=p.uuid "
          + " JOIN cotisation t ON t.id=z.cotisation_id "
          + " WHERE p.paiement_period_id=" + sanitize.escape(req.params.id) + " ORDER BY e.name ASC, e.postnom ASC, e.prenom ASC";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listSubsidies = function (req, res, next) {
  var sql = "SELECT `subsidy`.`uuid`, `subsidy`.`text`, `subsidy`.`value`, `subsidy`.`is_percent`, `subsidy`.`debitor_group_uuid`, " +
    "`debitor_group`.`name` FROM `subsidy` JOIN `debitor_group` ON `subsidy`.`debitor_group_uuid`=`debitor_group`.`uuid`";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.getClassSolde = function (req, res, next) {

    var account_class = req.params.account_class,
        fiscal_year_id = req.params.fiscal_year;

    var sql =
      'SELECT `ac`.`id`, `ac`.`account_number`, `ac`.`account_txt`, `ac`.`is_charge`, `t`.`fiscal_year_id`, `t`.`debit`, `t`.`credit`, `t`.`debit_equiv`, `t`.`credit_equiv`, `t`.`currency_id` ' +
      'FROM (' +
        '(' +
          'SELECT `account`.`id`, `posting_journal`.`fiscal_year_id`, `posting_journal`.`project_id`, `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, ' +
            0 + ' AS debit, ' + 0 + ' AS credit, ' +
            'SUM(`posting_journal`.`debit_equiv`) AS `debit_equiv`,' +
            'SUM(`posting_journal`.`credit_equiv`) AS `credit_equiv`, `posting_journal`.`account_id`, `posting_journal`.`deb_cred_uuid`, `posting_journal`.`currency_id`, ' +
            '`posting_journal`.`doc_num`, `posting_journal`.`trans_id`, `posting_journal`.`description`, `posting_journal`.`comment` ' +
          'FROM `posting_journal` JOIN `account` ON `account`.`id`=`posting_journal`.`account_id` WHERE `posting_journal`.`fiscal_year_id`=? AND `account`.`classe`=? GROUP BY `posting_journal`.`account_id` ' +
        ') UNION ALL (' +
          'SELECT `account`.`id`, `general_ledger`.`fiscal_year_id`, `general_ledger`.`project_id`, `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, '+
            0 + ' AS credit, ' + 0 + ' AS debit, ' +
            'SUM(`general_ledger`.`debit_equiv`) AS `debit_equiv`, ' +
            'SUM(`general_ledger`.`credit_equiv`) AS `credit_equiv`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_uuid`, `general_ledger`.`currency_id`, ' +
            '`general_ledger`.`doc_num`, `general_ledger`.`trans_id`, `general_ledger`.`description`, `general_ledger`.`comment` ' +
          'FROM `general_ledger` JOIN `account` ON `account`.`id`=`general_ledger`.`account_id` WHERE `general_ledger`.`fiscal_year_id`=? AND `account`.`classe`=? GROUP BY `general_ledger`.`account_id` ' +
        ')' +
      ') AS `t`, `account` AS `ac` ' +
      'WHERE `t`.`account_id` = `ac`.`id` AND `ac`.`classe`=? AND t.fiscal_year_id = ? ';

  db.exec(sql, [fiscal_year_id, account_class, fiscal_year_id, account_class, account_class, fiscal_year_id])
  .then(function (data) {
    res.send(data);
  })
  .catch(function (err) { next(err); })
  .done();
};

/**
  * Get Type Solde
  * This function is reponsible to return a solde
  * according `account_type`, `account is charge` and `fiscal year` given
  */
  exports.getTypeSolde = function (req, res, next) {

      var fiscalYearId = req.params.fiscal_year,
          accountType   = req.params.account_type_id,
          accountIsCharge = req.params.is_charge;

      var sql =
        'SELECT `ac`.`id`, `ac`.`account_number`, `ac`.`account_txt`, `ac`.`account_type_id`, `ac`.`is_charge`, `t`.`fiscal_year_id`, `t`.`debit`, `t`.`credit`, `t`.`debit_equiv`, `t`.`credit_equiv`, `t`.`currency_id` ' +
        'FROM (' +
          '(' +
            'SELECT `account`.`id`, `account`.`account_type_id`, `account`.`is_charge`, `posting_journal`.`fiscal_year_id`, `posting_journal`.`project_id`, `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`trans_date`, ' +
              0 + ' AS debit, ' + 0 + ' AS credit, ' +
              'SUM(`posting_journal`.`debit_equiv`) AS `debit_equiv`,' +
              'SUM(`posting_journal`.`credit_equiv`) AS `credit_equiv`, `posting_journal`.`account_id`, `posting_journal`.`deb_cred_uuid`, `posting_journal`.`currency_id`, ' +
              '`posting_journal`.`doc_num`, `posting_journal`.`trans_id`, `posting_journal`.`description`, `posting_journal`.`comment` ' +
            'FROM `posting_journal` JOIN `account` ON `account`.`id`=`posting_journal`.`account_id` WHERE `posting_journal`.`fiscal_year_id`=? AND `account`.`account_type_id`=? AND `account`.`is_charge`=? GROUP BY `posting_journal`.`account_id` ' +
          ') UNION ALL (' +
            'SELECT `account`.`id`, `account`.`account_type_id`, `account`.`is_charge`, `general_ledger`.`fiscal_year_id`, `general_ledger`.`project_id`, `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, '+
              0 + ' AS credit, ' + 0 + ' AS debit, ' +
              'SUM(`general_ledger`.`debit_equiv`) AS `debit_equiv`, ' +
              'SUM(`general_ledger`.`credit_equiv`) AS `credit_equiv`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_uuid`, `general_ledger`.`currency_id`, ' +
              '`general_ledger`.`doc_num`, `general_ledger`.`trans_id`, `general_ledger`.`description`, `general_ledger`.`comment` ' +
            'FROM `general_ledger` JOIN `account` ON `account`.`id`=`general_ledger`.`account_id` WHERE `general_ledger`.`fiscal_year_id`=? AND `account`.`account_type_id`=? AND `account`.`is_charge`=? GROUP BY `general_ledger`.`account_id` ' +
          ')' +
        ') AS `t`, `account` AS `ac` ' +
        'WHERE `t`.`account_id` = `ac`.`id` AND (`ac`.`account_type_id`=? AND `ac`.`is_charge`=?) AND t.fiscal_year_id = ? ';

    db.exec(sql, [fiscalYearId, accountType, accountIsCharge, fiscalYearId, accountType, accountIsCharge, accountType, accountIsCharge, fiscalYearId])
    .then(function (data) {
      res.send(data);
    })
    .catch(function (err) { next(err); })
    .done();
  };

exports.getStockIntegration = function (req, res, next) {
  'use strict';

  var sql;

  sql =
    'SELECT DISTINCT p.uuid, CONCAT(pr.abbr, p.reference) AS reference, ' +
      'u.first, u.last, p.purchase_date, p.note, m.document_id ' +
    'FROM purchase AS p ' +
    'JOIN stock AS s ON s.purchase_order_uuid = p.uuid ' +
    'JOIN movement AS m ON s.tracking_number = m.tracking_number ' +
    'JOIN project AS pr ON pr.id = p.project_id ' +
    'JOIN user AS u ON u.id = p.emitter_id ' +
    'WHERE p.confirmed = 0 AND p.is_integration = 1;';

  db.exec(sql)
  .then(function (data) {
    res.status(200).json(data);
  })
  .catch(next)
  .done();
};
