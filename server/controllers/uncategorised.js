var db = require('./../lib/db');

exports.services = function (req, res, next) { 
  var sql =
    'SELECT `service`.`id`, `service`.`name` AS `service`, `service`.`project_id`, `service`.`cost_center_id`, `service`.`profit_center_id`, `cost_center`.`text` AS `cost_center`, `profit_center`.`text` AS `profit_center`, `project`.`name` AS `project` '+
    'FROM `service` JOIN `cost_center` JOIN `profit_center` JOIN `project` ON `service`.`cost_center_id`=`cost_center`.`id` AND `service`.`profit_center_id`=`profit_center`.`id` '+
    'AND `service`.`project_id`=`project`.`id`';
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.availableCenters = function (req, res, next) { 
  var sql =
    'SELECT `cost_center`.`text`, `cost_center`.`id`, `cost_center`.`project_id`, `service`.`name` '+
    'FROM `cost_center` LEFT JOIN `service` ON `service`.`cost_center_id`=`cost_center`.`id`';

  function process(ccs) {
    var costCenters = ccs.filter(function(item) {
      return !item.name;
    });
    return costCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listEmployees = function (req, res, next) { 
  var sql =
    "SELECT " +
    "`employee`.`id`, `employee`.`code` AS `code_employee`, `employee`.`prenom`, `employee`.`name`, " +
    "`employee`.`postnom`, `employee`.`sexe`, `employee`.`dob`, `employee`.`date_embauche`, `employee`.`service_id`, " +
    "`employee`.`nb_spouse`, `employee`.`nb_enfant`, `employee`.`grade_id`, `grade`.`text`, `grade`.`basic_salary`, " +
    "`employee`.`phone`, `employee`.`email`, `employee`.`adresse`, `employee`.`bank`, `employee`.`bank_account`, `employee`.`daily_salary`, `employee`.`location_id`, " +  
    "`grade`.`code` AS `code_grade`, `debitor`.`uuid` as `debitor_uuid`, `debitor`.`text` AS `debitor_text`,`debitor`.`group_uuid` as `debitor_group_uuid`, " + 
    "`creditor`.`uuid` as `creditor_uuid`, `creditor`.`text` AS `creditor_text`, `creditor`.`group_uuid` as `creditor_group_uuid` " +
    "FROM " +
    "`employee`, `grade`, `debitor`, `creditor` " +
    "WHERE " +
    "`employee`.`grade_id` = `grade`.`uuid` AND " + 
    "`employee`.`debitor_uuid` = `debitor`.`uuid` AND " +
    "`employee`.`creditor_uuid` = `creditor`.`uuid` "

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listJournal = function (req, res, next) { 
  var sql =
    "SELECT `posting_journal`.`uuid`, `posting_journal`.`fiscal_year_id`, `posting_journal`.`period_id`, " + 
    "`posting_journal`.`trans_id`, `posting_journal`.`trans_date`, `posting_journal`.`doc_num`, " + 
    "`posting_journal`.`description`, `posting_journal`.`account_id`, `posting_journal`.`debit`, " +
    "`posting_journal`.`credit`, `posting_journal`.`currency_id`, `posting_journal`.`deb_cred_uuid`, " +
    "`posting_journal`.`deb_cred_type`, `posting_journal`.`inv_po_id`, " +
    "`posting_journal`.`debit_equiv`, `posting_journal`.`credit_equiv`, `posting_journal`.`currency_id`, " + 
    "`posting_journal`.`comment`, `posting_journal`.`user_id`, `posting_journal`.`pc_id`, " + 
    "`posting_journal`.`cc_id`, `account`.`account_number`, `user`.`first`, " +
    "`user`.`last`, `currency`.`symbol`, `cost_center`.`text` AS `cc`, " +
    "`profit_center`.`text` AS `pc` " +
    "FROM `posting_journal` JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` " + 
    "JOIN `user` ON `posting_journal`.`user_id`=`user`.`id` " + 
    "JOIN `currency` ON `posting_journal`.`currency_id`=`currency`.`id` " + 
    "LEFT JOIN `cost_center` ON `posting_journal`.`cc_id`=`cost_center`.`id` " + 
    "LEFT JOIN `profit_center` ON `posting_journal`.`pc_id`=`profit_center`.`id`"

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listHolidays = function (req, res, next) { 
  var pp = JSON.parse(req.params.pp);
  var sql =
    "SELECT `hollyday`.`id`, `hollyday`.`label`, `hollyday`.`dateFrom`, `hollyday`.`dateTo` " + 
    "FROM `hollyday` WHERE " + 
    "((`hollyday`.`dateFrom`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " +
    "(`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`<=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ") OR " + 
    "(`hollyday`.`dateFrom`<=" + sanitize.escape(util.toMysqlDate(pp.dateFrom)) + " AND " +
    "`hollyday`.`dateTo`>=" + sanitize.escape(util.toMysqlDate(pp.dateTo)) + ")) AND " +
    "`hollyday`.`employee_id`=" + sanitize.escape(req.params.employee_id) + ";"; 

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listAvailableProfitCenters = function (req, res, next) { 
  var sql =
    'SELECT `profit_center`.`text`, `profit_center`.`id`, `profit_center`.`project_id`, `service`.`name` '+
    'FROM `profit_center` LEFT JOIN `service` ON `service`.`profit_center_id`=`profit_center`.`id`';

  function process(pcs) {
    var profitCenters = pcs.filter(function(item) {
      return !item.name;
    });
    return profitCenters;
  }
  db.exec(sql)
  .then(function (result) {
    res.send(process(result));
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.currentProject = function (req, res, next) { 
  var sql =
    'SELECT `project`.`id`, `project`.`name`, `project`.`abbr`, `project`.`enterprise_id`, `enterprise`.`currency_id`, `enterprise`.`location_id`, `enterprise`.`name` as \'enterprise_name\', `enterprise`.`phone`, `enterprise`.`email`, `village`.`name` as \'village\', `sector`.`name` as \'sector\' ' +
    'FROM `project` JOIN `enterprise` ON `project`.`enterprise_id`=`enterprise`.`id` JOIN `village` ON `enterprise`.`location_id`=`village`.`uuid` JOIN `sector` ON `village`.`sector_uuid`=`sector`.`uuid` ' +
    'WHERE `project`.`id`=' + req.session.project_id + ';';
  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
};

// FIXME Remove
exports.userSession = function (req, res, next) { 
  res.send({ id: req.session.user_id });
};

exports.pcashTransferSummers = function (req, res, next) { 
  var sql =
    'SELECT `primary_cash`.`reference`, `primary_cash`.`date`, `primary_cash`.`cost`, `primary_cash`.`currency_id` '+
    'FROM `primary_cash` WHERE `primary_cash`.`origin_id`= (SELECT DISTINCT `primary_cash_module`.`id` FROM `primary_cash_module` '+
    'WHERE `primary_cash_module`.`text`=\'transfer\') ORDER BY date, reference DESC LIMIT 20;'; //FIX ME : this request doesn't sort
  db.exec(sql)
  .then(function () {
    var d = []; //for now
    res.send(d);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

};
