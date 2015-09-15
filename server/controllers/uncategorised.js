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
var depot                      = require('./depot')();
var taxPayment                 = require('./taxPayment')();
var donation                   = require('./postingDonation')();
var cotisationPayment          = require('./cotisationPayment')();
var promessePayment            = require('./postingPromessePayment')();
var promesseCotisation         = require('./postingPromesseCotisation')();
var promesseTax                = require('./postingPromesseTax')();

// TODO delegate to configuration serving controller
var errorCodes  = require('./../config/environment/errors.json');

exports.exposeRoot = function (req, res, next) {
  /* jshint unused : false */
  // This is to preserve the /#/ path in the url
  res.sendfile(cfg.rootFile);
};

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
    "`employee`.`nb_spouse`, `employee`.`nb_enfant`, `employee`.`grade_id`, `employee`.`locked`, `grade`.`text`, `grade`.`basic_salary`, " +
    "`fonction`.`id` AS `fonction_id`, `fonction`.`fonction_txt`, " +
    "`employee`.`phone`, `employee`.`email`, `employee`.`adresse`, `employee`.`bank`, `employee`.`bank_account`, `employee`.`daily_salary`, `employee`.`location_id`, " +
    "`grade`.`code` AS `code_grade`, `debitor`.`uuid` as `debitor_uuid`, `debitor`.`text` AS `debitor_text`,`debitor`.`group_uuid` as `debitor_group_uuid`, " +
    "`creditor`.`uuid` as `creditor_uuid`, `creditor`.`text` AS `creditor_text`, `creditor`.`group_uuid` as `creditor_group_uuid`, `creditor_group`.`account_id` " +
    "FROM `employee` " +
    " JOIN `grade` ON `employee`.`grade_id` = `grade`.`uuid` " +
    " JOIN `fonction` ON `employee`.`fonction_id` = `fonction`.`id` " +
    " JOIN `debitor` ON `employee`.`debitor_uuid` = `debitor`.`uuid` " +
    " JOIN `creditor` ON `employee`.`creditor_uuid` = `creditor`.`uuid` " +
    " JOIN `creditor_group` ON `creditor_group`.`uuid` = `creditor`.`group_uuid` " +
    " ORDER BY employee.name ASC, employee.postnom ASC, employee.prenom ASC";

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
    "FROM `posting_journal` LEFT JOIN `account` ON `posting_journal`.`account_id`=`account`.`id` " +
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
    "SELECT `hollyday`.`id`, `hollyday`.`label`, `hollyday`.`dateFrom`, `hollyday`.`percentage`, `hollyday`.`dateTo` " +
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
    'WHERE `project`.`id`=' + req.session.project.id + ';';
  db.exec(sql)
  .then(function (result) {
    res.send(result[0]);
  })
  .catch(function (err) { next(err); })
  .done();
};

// FIXME Remove
exports.userSession = function (req, res, next) {
  res.send({ id: req.session.user.id });
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

exports.authenticatePin = function (req, res, next) {
  var decrypt = req.params.pin >> 5;
  var sql = 'SELECT pin FROM user WHERE user.id = ' + req.session.user.id +
    ' AND pin = \'' + decrypt + '\';';
  db.exec(sql)
  .then(function (rows) {
    res.send({ authenticated : !!rows.length });
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.lookupMaxTableId = function (req, res, next) {
  var maxRequest, id = req.params.id,
      table = req.params.table,
      join = req.params.join;

  maxRequest = 'SELECT MAX(' + id + ') FROM ';

  maxRequest += '(SELECT MAX(' + id + ') AS `' + id + '` FROM ' + table;
  if (join) {
    maxRequest += ' UNION ALL SELECT MAX(' + id + ') AS `' + id + '` FROM ' + join + ')a;';
  } else {
    maxRequest += ')a;';
  }

  db.exec(maxRequest)
  .then(function (ans) {
    res.send({max: ans[0]['MAX(' + id + ')']});
  })
  .catch(function (err) {
    res.send(500, {info: 'SQL', detail: err});
    console.error(err);
    return;
  })
  .done();
};

exports.listInExAccounts = function (req, res, next) {
  var enterprise_id = sanitize.escape(req.params.id_enterprise);
  var sql =
    'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, temp.`classe`, account_type.`type`, ' +
           'temp.`parent`, temp.`balance`' +  // , temp.`fixed`
    ' FROM (' +
        'SELECT account.id, account.account_number, account.account_txt, account.classe, account.account_type_id, ' +
               'account.parent, period_total.credit - period_total.debit as balance ' +  // account.fixed,
        'FROM account LEFT JOIN period_total ' +
        'ON account.id=period_total.account_id ' +
        'WHERE account.enterprise_id = ' + enterprise_id +
        ' AND (account.classe IN (\'6\', \'7\') OR ((account.classe IN (\'1\', \'2\', \'5\') AND account.is_used_budget = 1) ))' +
    ' ) ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id = account_type.id ' +
    'ORDER BY CAST(temp.account_number AS CHAR(10));';

  function process(accounts) {
    var InExAccounts = accounts.filter(function(item) {
      var account_6_7 = item.account_number.toString().indexOf('6') === 0 || item.account_number.toString().indexOf('7') === 0,
        account_1_2_5 = item.account_number.toString().indexOf('1') === 0 || item.account_number.toString().indexOf('2') === 0 || item.account_number.toString().indexOf('5') === 0;
      return account_6_7 || account_1_2_5;
    });
    return InExAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseAccounts = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.cc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.listEnterpriseProfitAccounts = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt FROM account ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.pc_id IS NULL ' +
      'AND account.account_type_id <> 3';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.costCenterCost = function (req, res, next) {
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`cc_id` = ' + sanitize.escape(req.params.cc_id) +
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {cost : 0};}
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });

    var cost = availablechargeAccounts.reduce(function (x, y) {
      return x + (y.debit - y.credit);

    }, 0);

    return {cost : cost};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('ccc', req.params.id_project, {cc_id : req.params.cc_id, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
};

exports.processProfitCenter = function (req, res, next) {
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
    synthetic('pcv', req.params.id_project, {pc_id : req.params.pc_id, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    })
  })
  .catch(next)
  .done();

  /*
   * Legacy method
  function process (values) {
    if (values.length <= 0) { return {profit : 0}; }
    var som = 0;
    values.forEach(function (value) {
      som+= value.credit;
    });
    return {profit:som};
  }

  synthetic('sp', req.params.id_project, {service_id : req.params.service_id}, function (err, data) {
    if (err) { return next(err); }
    res.send(process(data));
  });
  */
};

exports.costCenterAccount = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN cost_center ' +
    'ON account.cc_id = cost_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.cc_id = ' + sanitize.escape(req.params.cost_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.profitCenterAccount = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN profit_center ' +
    'ON account.pc_id = profit_center.id '+
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.is_ohada = 1 ' +
      'AND account.pc_id = ' + sanitize.escape(req.params.profit_center_id) + ';';

  function process(accounts) {
    var availableprofitAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('7') === 0;
    });
    return availableprofitAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.removeFromCostCenter = function (req, res, next) {
  var tabs = JSON.parse(req.params.tab);

  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`cc_id` = NULL WHERE `account`.`id` IN ('+tabs.join(',')+')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

exports.removeFromProfitCenter = function (req, res, next) {
  var tabs = JSON.parse(req.params.tab);
  tabs = tabs.map(function (item) {
    return item.id;
  });

  var sql =
    'UPDATE `account` SET `account`.`pc_id` = NULL WHERE `account`.`id` IN (' + tabs.join(',') + ')';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

exports.auxCenterAccount = function (req, res, next) {
  var sql =
    'SELECT account.id, account.account_number, account.account_txt ' +
    'FROM account JOIN auxiliairy_center ' +
    'ON account.auxiliairy_center_id = auxiliairy_center.id ' +
    'WHERE account.enterprise_id = ' + sanitize.escape(req.params.id_enterprise) + ' ' +
      'AND account.parent <> 0 ' +
      'AND account.auxiliairy_center_id = ' + sanitize.escape(req.params.auxiliairy_center_id) + ';';

  function process(accounts) {
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });
    return availablechargeAccounts;
  }

  db.exec(sql)
  .then(function (rows) {
    res.send(process(rows));
  })
  .catch(next)
  .done();
};

exports.checkHoliday = function (req, res, next) {
  var sql = "SELECT id, employee_id, label, dateTo, percentage, dateFrom FROM hollyday WHERE employee_id = '"+ req.query.employee_id +"'"
          + " AND ((dateFrom >= '" + req.query.dateFrom +"') OR (dateTo >= '" + req.query.dateFrom + "') OR (dateFrom >= '"+ req.query.dateTo +"')"
          + " OR (dateTo >= '" + req.query.dateTo + "'))"
          + " AND ((dateFrom <= '" + req.query.dateFrom +"') OR (dateTo <= '" + req.query.dateFrom + "') OR (dateFrom <= '"+ req.query.dateTo +"')"
          + " OR (dateTo <= '" + req.query.dateTo + "'))"
  if (req.query.line !== ""){
    sql += " AND id <> '" + req.query.line + "'";
  }

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.checkOffday = function (req, res, next) {
  var sql ="SELECT * FROM offday WHERE date = '" + req.query.date + "' AND id <> '" + req.query.id +"'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.logVisit = function (req, res, next) {
  var sql, id = req.params.patientId;
  sql =
    'INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES (?, ?, ?);';

  db.exec(sql, [uuid(), id, req.session.user.id])
  .then(function () {
    res.send();
  })
  .catch(next)
  .done();

};

exports.cautionDebtor = function (req, res, next) {
  var sql, debitor_uuid = sanitize.escape(req.params.debitor_uuid),
      project_id = sanitize.escape(req.params.project_id);
  //prochaine enterprise_id sera obtenue par requette via debitor_id

  sql =
    'SELECT `enterprise`.`currency_id` ' +
    'FROM `enterprise` ' +
    'WHERE `enterprise`.`id` = (SELECT `project`.`enterprise_id` FROM `project` WHERE `project`.`id`='+project_id+')';

  db.exec(sql)
  .then(function (ans) {
    var currency_id = ans.pop().currency_id;
    sql =
      'SELECT `t`.`uuid`, `t`.`trans_id`, `t`.`trans_date`, `t`.`debit_equiv` AS `debit`, ' +
        '`t`.`credit_equiv` AS `credit`, `t`.`description`, `t`.`account_id` ' +
        'FROM (' +
          'SELECT `posting_journal`.`uuid`, `posting_journal`.`inv_po_id`, `posting_journal`.`account_id`, `posting_journal`.`trans_date`, `posting_journal`.`debit_equiv`, ' +
            '`posting_journal`.`credit_equiv`, `posting_journal`.`deb_cred_uuid`, ' +
            '`posting_journal`.`trans_id`, `posting_journal`.`description` ' +
          'FROM `posting_journal` WHERE `posting_journal`.`deb_cred_uuid` = ' + debitor_uuid +
        ' UNION ' +
          'SELECT `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`account_id`, `general_ledger`.`trans_date`, `general_ledger`.`debit_equiv`, ' +
            '`general_ledger`.`credit_equiv`, `general_ledger`.`deb_cred_uuid`, ' +
            '`general_ledger`.`trans_id`, `general_ledger`.`description` ' +
          'FROM `general_ledger` WHERE `general_ledger`.`deb_cred_uuid` = ' + debitor_uuid +
        ') AS `t` JOIN `account` ON `t`.`account_id` = `account`.`id` ' +
        'WHERE `t`.`account_id` IN (' +
          'SELECT `debitor_group`.`account_id` FROM `debitor_group` WHERE `debitor_group`.`uuid`= ' +
          '(SELECT `group_uuid` FROM `debitor` WHERE `debitor`.`uuid`=' + debitor_uuid + ' LIMIT 1));';
    return db.exec(sql);
  })
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.accountBalance = function (req, res, next) {
  // TODO : put this in a module!
  var enterprise_id = req.params.id;

  var sql =
    'SELECT temp.`id`, temp.`account_number`, temp.`account_txt`, account_type.`type`, temp.`parent`, temp.`fixed`, temp.`balance` FROM ' +
    '(' +
      'SELECT account.id, account.account_number, account.account_txt, account.account_type_id, account.parent, account.fixed, period_total.credit - period_total.debit as balance ' +
      'FROM account LEFT JOIN period_total ' +
      'ON account.id=period_total.account_id ' +
      'WHERE account.enterprise_id = ' + sanitize.escape(enterprise_id) +
    ') ' +
    'AS temp JOIN account_type ' +
    'ON temp.account_type_id = account_type.id ' +
    'ORDER BY temp.account_number;';

  db.exec(sql)
  .then(function (rows) {
    res.send(rows);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.syntheticGoal = function (req, res, next) {
  var query = decodeURIComponent(url.parse(req.url).query);
  synthetic(req.params.goal, req.params.project_id, query, function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
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

exports.getInventoryLot = function (req, res, next) {
  var sql = 'SELECT expiration_date, lot_number, tracking_number, quantity, code, uuid, text FROM stock, inventory WHERE inventory.uuid = stock.inventory_uuid AND stock.inventory_uuid='+sanitize.escape(req.params.inventory_uuid);
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
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

exports.printJournal = function (req, res, next) {
  res.send('Under Contruction');
};

exports.stockIn = function (req, res, next) {
  var sql;
  var condition =
    'WHERE stock.expiration_date >= ' + sanitize.escape(req.params.df) + ' ' +
    'AND stock.expiration_date <= ' + sanitize.escape(req.params.dt);
  condition += (req.params.depot_uuid === '*') ? '' : ' AND consumption.depot_uuid = ' + sanitize.escape(req.params.depot_uuid) + ' ';

  if (req.params.depot_uuid === '*') {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, stock.lot_number, SUM(consumption.quantity) AS consumed, ' +
        'stock.expiration_date, stock.quantity as initial ' +
      'FROM stock LEFT JOIN consumption ON ' +
        'stock.tracking_number=consumption.tracking_number '+condition+
        'GROUP BY stock.tracking_number;';

  } else {
    sql =
      'SELECT stock.inventory_uuid, stock.tracking_number, '+
      'stock.lot_number, stock.quantity, SUM(consumption.quantity) AS consumed,'+
      'movement.quantity, ';
  }

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

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

exports.stockExpiringComplete = function (req, res, next) {
  //TODO : put it in a separate file
  var genSql =
    'SELECT SUM(cons.consumed ) AS consumed ' +
    'FROM ( ' +
      'SELECT SUM(consumption.quantity) AS consumed ' +
      'FROM stock ' +
      'LEFT JOIN consumption ON stock.tracking_number = consumption.tracking_number ' +
      'WHERE stock.tracking_number = \'' + req.params.tracking_number + '\''+
    'UNION '+
      'SELECT ((SUM(consumption_reversing.quantity)) * (-1)) AS consumed ' +
      'FROM stock ' +
      'LEFT JOIN consumption_reversing ON stock.tracking_number = consumption_reversing.tracking_number ' +
      'WHERE stock.tracking_number = \''+ req.params.tracking_number + '\') AS cons;';

  var speSql =
    'SELECT SUM(cons.consumed ) AS consumed ' +
    'FROM ( ' +
      'SELECT SUM(consumption.quantity) AS consumed ' +
      'FROM stock ' +
      'LEFT JOIN consumption ON stock.tracking_number = consumption.tracking_number ' +
      'WHERE stock.tracking_number = \'' + req.params.tracking_number + '\' '+
      ' AND consumption.depot_uuid = \'' + req.params.depot_uuid + '\' '+
    'UNION '+
      'SELECT ((SUM(consumption_reversing.quantity)) * (-1)) AS consumed ' +
      'FROM stock ' +
      'LEFT JOIN consumption_reversing ON stock.tracking_number = consumption_reversing.tracking_number ' +
      'WHERE stock.tracking_number = \'' + req.params.tracking_number + '\' ' +
      'AND consumption_reversing.depot_uuid = \'' + req.params.depot_uuid + '\'  ) AS cons;';


  db.exec(req.params.depot_uuid === '*' ? genSql : speSql )
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();

};

exports.distributeStockDepot = function (req, res, next) {
  //TODO : put it in a separate file
 var sql= 'SELECT stock.inventory_uuid, stock.tracking_number, ' +
          'stock.lot_number, stock.expiration_date, SUM(if (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS entered, SUM(if (movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+
          ', movement.quantity, 0)) AS moved,  inventory.text, inventory.code, inventory.purchase_price  FROM stock JOIN inventory JOIN movement ON stock.inventory_uuid = inventory.uuid AND '+
          'stock.tracking_number = movement.tracking_number WHERE (movement.depot_entry='+sanitize.escape(req.params.depot_uuid)+
          'OR movement.depot_exit='+sanitize.escape(req.params.depot_uuid)+') GROUP BY stock.tracking_number';
  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
      next(err);
  })
  .done();
};

exports.inventoryByDepot = function (req, res, next) {
  var sql = 'SELECT '+
            'distinct inventory.text, '+
            'inventory.uuid, '+
            'inventory.code '+
            'FROM stock JOIN inventory JOIN ON stock.inventory_uuid = inventory.uuid '+
            'WHERE stock.depot_uuid='+sanitize.escape(req.params.depot_uuid);

  db.exec(sql)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.routeDepotQuery = function (req, res, next) {
  depot(req.url, req.params.depot)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.routeDrugQuery = function (req, res, next) {
  drugRouter(req.params.code)
  .then(function (ans) {
    res.send(ans);
  })
  .catch(function (err) {
    next(err);
  })
  .done();
};

exports.listErrorCodes = function (req, res, next) {
  /* jshint unused : false */
  res.send(errorCodes);
};

exports.listIncomeAccounts = function (req, res, next) {
  var sql ="SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE '6%' AND account_type_id <> '3'";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.availablePaymentPeriod = function (req, res, next) {
  var sql = "SELECT p.id, p.config_tax_id, p.config_rubric_id, p.config_accounting_id, p.config_cotisation_id, p.label, p.dateFrom, p.dateTo, r.label AS RUBRIC, t.label AS TAX, a.label AS ACCOUNT, c.label AS COTISATION FROM paiement_period p, config_rubric r, config_tax t, config_accounting a, config_cotisation c WHERE p.config_tax_id = t.id AND p.config_rubric_id = r.id AND a.id=p.config_accounting_id AND p.config_cotisation_id = c.id ORDER BY p.id DESC";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

// hah, 80 characters
exports.listConsumptionByTrackingNumber = function (req, res, next) {
  var sql = "SELECT consumption.tracking_number, SUM(consumption.quantity) AS 'quantity'"
          + " FROM consumption"
          + " GROUP BY consumption.tracking_number";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listExpiredTimes = function (req, res, next) {
  var sql;
  if(req.query.request == 'expired'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date, SUM(stock.quantity) AS quantity"
        + " FROM stock"
        + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE stock.expiration_date <= CURDATE()"
        + " GROUP BY stock.tracking_number";

  } else if(req.query.request == 'expiredDellai'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date,"
        + " SUM(stock.quantity) AS quantity"
        + " FROM stock JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE ((DATEDIFF(stock.expiration_date ,CURDATE()) > '" + req.query.inf + "')"
        + " AND ((DATEDIFF(stock.expiration_date ,CURDATE()) <  '" + req.query.sup + "')))"
        + " GROUP BY stock.tracking_number";
  } else if(req.query.request == 'oneYear'){
    sql = "SELECT inventory.text, stock.lot_number, stock.tracking_number, stock.expiration_date,"
        + " SUM(stock.quantity) AS quantity"
        + " FROM stock JOIN inventory ON inventory.uuid = stock.inventory_uuid"
        + " WHERE (DATEDIFF(stock.expiration_date ,CURDATE()) > '365')"
        + " GROUP BY stock.tracking_number";
  }

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listStockEntry = function (req, res, next) {
  var sql = "SELECT stock.inventory_uuid, stock.entry_date, stock.tracking_number, SUM(stock.quantity) AS 'quantity', inventory.text"
          + " FROM stock"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid"
          + " GROUP BY stock.inventory_uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listStockConsumption = function (req, res, next) {
  var sql = "SELECT inventory.text, SUM(consumption.quantity) AS 'quantity', inventory.uuid, stock.inventory_uuid"
          + " FROM consumption RIGHT JOIN stock ON stock.tracking_number = consumption.tracking_number"
          + " JOIN inventory ON inventory.uuid = stock.inventory_uuid "
          + " GROUP BY stock.inventory_uuid";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.frenchEnglishRoute = function (req, res, next) {
  var sql =
    'SELECT COUNT(DISTINCT(MONTH(c.date))) AS nb ' +
    'FROM consumption AS c '
    'JOIN stock AS s ON c.tracking_number = s.tracking_number '
    'JOIN inventory AS i ON i.uuid = s.inventory_uuid '
    'WHERE (c.date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND CURDATE()) '
      'AND s.inventory_uuid = ?;';

  db.exec(sql, [req.params.inventory_uuid])
  .then(function (rows) {
    res.send(rows[0]);
  })
  .catch(next)
  .done();
};

exports.listMonthlyConsumption = function (req, res, next) {
  var sql =
    "SELECT monthlyCons.uuid, monthlyCons.date, SUM(monthlyCons.quantity) AS quantity, monthlyCons.inventory_uuid " +
    "FROM ( " +
      "SELECT consumption.uuid, consumption.date, SUM(consumption.quantity) AS quantity, stock.inventory_uuid " +
      " FROM consumption " +
      " JOIN stock  ON stock.tracking_number = consumption.tracking_number " +
      " JOIN inventory ON inventory.uuid = stock.inventory_uuid " +
      " WHERE stock.inventory_uuid = " + sanitize.escape(req.params.inventory_uuid) + " AND " +
      " consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) " +
      " AND (consumption.date BETWEEN DATE_SUB(CURDATE(),INTERVAL " + sanitize.escape(req.params.inventory_uuid) + " MONTH) AND CURDATE())" +
      " GROUP BY inventory.uuid " +
    "UNION " +
      "SELECT consumption_reversing.uuid, consumption_reversing.date, ((SUM(consumption_reversing.quantity)) * (-1)) AS quantity, stock.inventory_uuid " +
      " FROM consumption_reversing " +
      " JOIN stock  ON stock.tracking_number = consumption_reversing.tracking_number " +
      " JOIN inventory ON inventory.uuid = stock.inventory_uuid " +
      " WHERE stock.inventory_uuid = " + sanitize.escape(req.params.inventory_uuid) + " AND " +
      " consumption_reversing.consumption_uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) " +
      " AND (consumption_reversing.date BETWEEN DATE_SUB(CURDATE(),INTERVAL " + sanitize.escape(req.params.inventory_uuid) + " MONTH) AND CURDATE())" +
      " GROUP BY inventory.uuid ) AS monthlyCons ";

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.listCommandes = function (req, res, next) {
  var sql = "SELECT p.purchase_date AS date_commande"
          + " FROM purchase p"
          + " JOIN purchase_item z ON p.uuid=z.purchase_uuid "
          + " JOIN inventory i ON z.inventory_uuid=i.uuid "
          + " WHERE z.inventory_uuid=" + sanitize.escape(req.params.id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.formatLotsForExpiration = function (req, res, next) {
  var sql = "SELECT s.tracking_number, s.lot_number, FLOOR(DATEDIFF(s.expiration_date,CURDATE())/30) AS months_before_expiration"
          + " FROM stock s"
          + " JOIN inventory i ON s.inventory_uuid=i.uuid "
          + " WHERE s.inventory_uuid=" + sanitize.escape(req.params.id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.submitTaxPayment = function (req, res, next) {
  taxPayment.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.submitDonation = function (req, res, next) {
  donation.execute(req.body, req.session.user.id, function (err, ans) {
    if (err) { return next(err); }
    res.send({resp: ans});
  });
};

exports.setTaxPayment = function (req, res, next) {
  var sql = "UPDATE tax_paiement SET posted=1"
          + " WHERE tax_paiement.paiement_uuid=" + sanitize.escape(req.body.paiement_uuid) + " AND tax_paiement.tax_id=" + sanitize.escape(req.body.tax_id);

  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
  .done();
};

exports.costByPeriod = function (req, res, next) {
  var sql =
    'SELECT `account`.`id`, `account`.`account_number`, `account`.`account_txt` FROM `account` '+
    'WHERE `account`.`cc_id`=' + sanitize.escape(req.params.cc_id) +
    ' AND `account`.`account_type_id` <> 3';

  function process(accounts) {
    if(accounts.length === 0) {return {cost : 0};}
    var availablechargeAccounts = accounts.filter(function(item) {
      return item.account_number.toString().indexOf('6') === 0;
    });


    var cost = availablechargeAccounts.reduce(function (x, y) {
      return x + (y.debit - y.credit);

    }, 0);

    return {cost : cost};
  }

  db.exec(sql)
  .then(function (ans) {
    synthetic('ccc_periodic', req.params.id_project, {cc_id : req.params.cc_id, start : req.params.start, end : req.params.end, accounts : ans}, function (err, data) {
      if (err) { return next(err); }
      res.send(process(data));
    });
  })
  .catch(next)
  .done();
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

exports.listExpenseAccounts = function (req, res, next) {
  var sql ="SELECT id, enterprise_id, account_number, account_txt FROM account WHERE account_number LIKE '7%' AND account_type_id <> '3'";
  db.exec(sql)
  .then(function (result) {
    res.send(result);
  })
  .catch(function (err) { next(err); })
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
          'FROM `posting_journal` JOIN `account` ON `account`.`id`=`posting_journal`.`account_id` WHERE `account`.`classe`=? GROUP BY `posting_journal`.`account_id` ' +
        ') UNION ALL (' +
          'SELECT `account`.`id`, `general_ledger`.`fiscal_year_id`, `general_ledger`.`project_id`, `general_ledger`.`uuid`, `general_ledger`.`inv_po_id`, `general_ledger`.`trans_date`, '+
            0 + ' AS credit, ' + 0 + ' AS debit, ' +
            'SUM(`general_ledger`.`debit_equiv`) AS `debit_equiv`, ' +
            'SUM(`general_ledger`.`credit_equiv`) AS `credit_equiv`, `general_ledger`.`account_id`, `general_ledger`.`deb_cred_uuid`, `general_ledger`.`currency_id`, ' +
            '`general_ledger`.`doc_num`, `general_ledger`.`trans_id`, `general_ledger`.`description`, `general_ledger`.`comment` ' +
          'FROM `general_ledger` JOIN `account` ON `account`.`id`=`general_ledger`.`account_id` WHERE `account`.`classe`=? GROUP BY `general_ledger`.`account_id` ' +
        ')' +
      ') AS `t`, `account` AS `ac` ' +
      'WHERE `t`.`account_id` = `ac`.`id` AND `ac`.`classe`=? AND t.fiscal_year_id = ? ';

  db.exec(sql, [account_class, account_class, account_class, fiscal_year_id])
  .then(function (data) {
    res.send(data);
  })
  .catch(function (err) { next(err); })
  .done();

};

exports.getStockIntegration = function (req, res, next) {

  var sql = 'SELECT DISTINCT p.uuid, p.reference, p.cost, p.creditor_uuid, p.project_id, p.emitter_id, p.purchaser_id, p.purchase_date, p.note, '
          + 'm.document_id, s.purchase_order_uuid, pr.abbr '
          + 'FROM purchase p '
          + 'JOIN stock s ON s.purchase_order_uuid=p.uuid '
          + 'JOIN movement m ON s.tracking_number=m.tracking_number '
          + 'JOIN project pr ON pr.id=p.project_id '
          + 'WHERE p.confirmed=0 AND p.is_integration=1';

  db.exec(sql)
  .then(function (data) {
    res.send(data);
  })
  .catch(function (err) { next(err); })
  .done();
};
