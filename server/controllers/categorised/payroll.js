var db        = require('./../../lib/db');
var sanitize  = require('./../../lib/sanitize');

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
