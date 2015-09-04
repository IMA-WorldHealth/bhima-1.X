var q        = require('q'),
    db       = require('../lib/db'),
    sanitize = require('../lib/sanitize'),
    uuid     = require('../lib/guid'),
    validate = require('../lib/validate')(),
    util     = require('../lib/util'),
    core     = require('./journal/core');

var tableRouter;

function getDate(date) {
  return util.toMysqlDate(date || new Date());
}

// GET /journal/:table/:id
function lookupTable(req, res, next) {
  // What are the params here?
  request(req.params.table, req.params.id, req.session.user.id, function (err) {
    if (err) { return next(err); }
    res.status(200).send();
  });
}
function handleConfirmDirectPurchase (id, user_id, done){
  var references, dayExchange, cfg = {};

  var sql = 'SELECT `purchase`.`uuid`, `purchase`.`creditor_uuid` , `purchase`.`cost`, `purchase`.`currency_id`, `purchase`.`project_id`,' +
            ' `purchase`.`purchaser_id`, ' +
            ' `purchase_item`.`inventory_uuid`, `purchase_item`.`total` FROM' +
            ' `purchase`, `purchase_item` WHERE' +
            ' `purchase`.`uuid` = `purchase_item`.`purchase_uuid` AND' +
            ' `purchase`.`is_direct` = 1 AND ' +
            ' `purchase`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('confirm_purchase'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(references[0].project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'CONFIRM C.A. DIRECT/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT '+
                    [
                      sanitize.escape(uuid()),
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\''+getDate()+'\'', '\''+cfg.descrip+'\''
                    ].join(',') + ', `inventory_group`.`stock_account`, '+
                    [
                      0, reference.total.toFixed(4),
                      0, reference.total.toFixed(4),
                      reference.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT ' +
                  [
                    sanitize.escape(uuid()),
                    reference.project_id,
                    cfg.fiscalYearId,
                    cfg.periodId,
                    cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\''
                  ].join(',') + ', `inventory_group`.`cogs_account`, ' +
                  [
                    reference.total.toFixed(4),0,
                    reference.total.toFixed(4),0,
                    reference.currency_id,
                    sanitize.escape(reference.inventory_uuid),
                    '\' \''
                  ].join(',') + ', ' +
                  [
                    sanitize.escape(reference.uuid),
                    cfg.originId,
                    user_id
                  ].join(',') + ' FROM `inventory_group` WHERE `inventory_group`.`uuid`=' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }
}

function handleDistributionPatient (id, user_id, done) {
  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`,`consumption`.`unit_price`, `consumption`.`quantity`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account`, `sale`.`project_id`, `sale`.`service_id` FROM `consumption`, `stock`, `inventory`,`inventory_group`, `sale` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `sale`.`uuid`=`consumption`.`document_id` AND `consumption`.`document_id` =' + sanitize.escape(id) +
    ' AND `consumption`.`uuid` NOT IN ' +
    '(SELECT `consumption_reversing`.`consumption_uuid` FROM `consumption_reversing` WHERE `consumption_reversing`.`document_id` =' + sanitize.escape(id) + ');';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('distribution'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(references[0].project_id); // fix me, ID of project
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'DP/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`, `cc_id` ) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      2
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                    ', `service`.`cost_center_id` FROM `service` WHERE `service`.`id`= ' + sanitize.escape(reference.service_id) + ';';
                  // ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      2, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_patient_deleting = 'DELETE FROM `consumption_patient` WHERE `consumption_patient`.`sale_uuid`=' + sanitize.escape(id);
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_patient_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleDistributionService (id, user_id, details, done) {

  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`, `consumption`.`unit_price`, `consumption`.`quantity`, `consumption_service`.`service_id`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account` FROM `consumption`, `consumption_service`, `stock`, `inventory`,`inventory_group` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `consumption_service`.`consumption_uuid`=`consumption`.`uuid` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `consumption`.`document_id` =' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('distribution'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(details.id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'DS/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`, `cc_id`) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      details.currency_id
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ', `service`.`cost_center_id` FROM `service` WHERE `service`.`id`= ' + sanitize.escape(reference.service_id) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      details.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_service_deleting = 'DELETE FROM `consumption_service` WHERE `consumption_service`.`consumption_uuid` IN (SELECT DISTINCT `consumption`.`uuid` FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id) + ')';
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_service_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleDistributionLoss (id, user_id, details, done) {

  var array_uuid_credit = [], array_uuid_debit = [];
  var references, dayExchange, cfg = {};
  var sql =
    'SELECT `consumption`.`uuid`, `consumption`.`date`, `consumption`.`quantity`, `consumption`.`unit_price`, `stock`.`inventory_uuid`, `inventory`.`purchase_price`, `inventory_group`.`uuid` AS group_uuid, ' +
    '`inventory_group`.`cogs_account`, `inventory_group`.`stock_account` FROM `consumption`, `consumption_loss`, `stock`, `inventory`,`inventory_group` ' +
    'WHERE `consumption`.`tracking_number`=`stock`.`tracking_number` AND `consumption_loss`.`consumption_uuid`=`consumption`.`uuid` AND `stock`.`inventory_uuid`=`inventory`.`uuid` AND `inventory`.`group_uuid`=`inventory_group`.`uuid` ' +
    'AND `consumption`.`document_id` =' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('stock_loss'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(details.id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'LO/'+new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var uuid_debit = sanitize.escape(uuid());
        array_uuid_debit.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_debit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.cogs_account
                    ].join(',') + ', ' +
                    [
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      0, (reference.quantity * reference.unit_price).toFixed(4),
                      details.currency_id
                    ].join(',') +
                    ', null, null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        array_uuid_credit.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
                  'SELECT ' +
                    [
                      uuid_credit,
                      details.id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\'', reference.stock_account
                    ].join(',') + ', ' +
                    [
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      (reference.quantity * reference.unit_price).toFixed(4), 0,
                      details.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(id),
                      cfg.originId,
                      user_id,
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var condition = array_uuid_credit.concat(array_uuid_debit).join(',');
    var posting_deleting = condition.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid`' + ' IN (' + condition + ')' : 'SELECT 1+1';
    var consumption_loss_deleting = 'DELETE FROM `consumption_loss` WHERE `consumption_loss`.`document_uuid`=' + sanitize.escape(id);
    var consumption_deleting = 'DELETE FROM `consumption` WHERE `consumption`.`document_id`=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_loss_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}


function handleSalaryPayment (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, ' +
      '`deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `primary_cash`.`uuid` = ' + sanitize.escape(reference.primary_cash_uuid) + ';';

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';


    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('payroll'), core.queries.period(getDate()), core.queries.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    cfg.account_cashbox = res2[0].account_id;
    rate = cfg.store.get(reference.currency_id).rate;

    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_PaySalary/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), cfg.account_id
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handlePromesseTax (id, user_id, data, done) {
  // Cette fonction ecrit dans le journal la promesse d'un paiment de cotisation
  // mais la cotisation n'est pas encore payE effectivement.
  var sql, rate, state = {}, reference, cfg = {}, references;
  state.user_id = user_id;

  sql =
    'SELECT `tax`.`label`, `tax`.`abbr`, `tax`.`is_employee`, `tax`.`four_account_id`, `tax`.`six_account_id`, ' +
    '`paiement`.`employee_id`, `paiement`.`paiement_date`, `paiement`.`currency_id`, `tax_paiement`.`value` FROM `tax`, `paiement`, `tax_paiement` ' +
    'WHERE `tax`.`id` = `tax_paiement`.`tax_id` AND `paiement`.`uuid` = `tax_paiement`.`paiement_uuid` AND `paiement`.`uuid`=' + sanitize.escape(data.paiement_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    var sql2;
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    references = records;
    sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` AS `creditor_uuid` FROM `paiement`' +
    ' JOIN `employee` ON `employee`.`id`=`paiement`.`employee_id`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`employee`.`creditor_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `paiement`.`uuid` = ' + sanitize.escape(data.paiement_uuid) + ';';

    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('tax_engagement'), core.queries.period(getDate()), core.queries.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].creditor_uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return core.queries.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_EngagementTax/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + reference.label + '/' + reference.abbr;
        var account, debitSql;

        if (!reference.six_account_id){
          account = cfg.account_id;

          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id, sanitize.escape(cfg.creditor_uuid)
              ].join(',') +
            ', \'C\', ' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';

        } else {
          account = reference.six_account_id;

          debitSql =
            'INSERT INTO posting_journal ' +
            '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
            '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
            '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
            'VALUES (' +
              [
                sanitize.escape(uuid()),
                data.project_id,
                cfg.fiscalYearId,
                cfg.periodId,
                cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.note), account
              ].join(',') + ', ' +
              [
                0, (reference.value).toFixed(4),
                0, (reference.value / rate).toFixed(4),
                reference.currency_id
              ].join(',') +
            ',null, null,' +
              [
                sanitize.escape(data.paiement_uuid),
                cfg.originId,
                user_id
              ].join(',') + ');';
        }

        return db.exec(debitSql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        cfg.note = cfg.descrip + '/' + reference.label + '/' + reference.abbr;
        var credit_sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              sanitize.escape(uuid()),
              data.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.note), reference.four_account_id
            ].join(',') + ', ' +
            [
              reference.value.toFixed(4), 0,
              (reference.value / rate).toFixed(4), 0,
              reference.currency_id,
              sanitize.escape(cfg.creditor_uuid)
            ].join(',') + ', null, ' + [sanitize.escape(data.paiement_uuid), cfg.originId, user_id].join(',') +
          ');';
        return db.exec(credit_sql);
      })
    );
  }
}

function handleSalaryAdvance (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
    'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
    ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid`' +
    ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    ' WHERE `primary_cash`.`uuid` = ' + sanitize.escape(reference.primary_cash_uuid) + ';';


    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('salary_advance'), core.queries.period(getDate()), core.queries.exchangeRate(date), db.exec(sql2)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_SalaryAdvance/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), cfg.account_id
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), reference.account_id
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}


function handleDonation (id, user_id, data, done) {
  var cfg = {},
      reference,
      sql = 'SELECT * FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(data.inventory_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res) {
    return done(null, res);
  })
  .catch(catchError);

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    cfg.cost = (data.purchase_price * data.quantity).toFixed(4);
    return q([core.queries.origin('donation'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(data.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(1,4) + '_Donation/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var sql =
      'INSERT INTO posting_journal '+
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) '+
      'SELECT '+
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip)
        ].join(',') + ', `inventory_group`.`stock_account`, ' +
        [
          0, cfg.cost,
          0, cfg.cost,
          data.currency_id, sanitize.escape(data.inventory_uuid)
        ].join(',') +
        ', null, ' +
        [
          sanitize.escape(data.donation.uuid),
          cfg.originId,
          user_id
        ].join(',') +
      ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid);
    return db.exec(sql);
  }

  function credit () {
    var sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'SELECT ' +
        [
          sanitize.escape(uuid()),
          data.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip)
        ].join(',') + ', `inventory_group`.`donation_account`, ' +
        [
          cfg.cost, 0,
          cfg.cost, 0,
          data.currency_id
        ].join(',') +
        ', null, null, ' +
        [
          sanitize.escape(data.donation.uuid),
          cfg.originId,
          user_id
        ].join(',') +
      ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' + sanitize.escape(reference.group_uuid);
    return db.exec(sql);
  }

  function catchError (err) {

    var tracks = data.tracking_numbers.map(function (item){
      return sanitize.escape(item);
    });
    var donation_deleting = 'DELETE FROM `donations` WHERE `donations`.`uuid`=' + sanitize.escape(data.donation.uuid),
        donation_item_deleting = 'DELETE FROM `donation_item` WHERE `donation_item`.`donation_uuid`=' + sanitize.escape(data.donation.uuid),
        movement_deleting = 'DELETE FROM `movement` WHERE `movement`.`document_id`=' + sanitize.escape(data.movement.document_id),
        stock_deleting = 'DELETE FROM `stock` WHERE `stock`.`tracking_number` IN (' + tracks.join() + ')';

    db.exec(donation_item_deleting)
    .then(function () {
      return db.exec(donation_deleting);
    })
    .then(function () {
      return db.exec(movement_deleting);
    })
    .then(function () {
      return db.exec(stock_deleting);
    })
    .catch(function (err) {
      console.log('erreur pendant la suppression ::: ', err);
    })
    .finally(function () {
      return done(err, null);
    });
  }
}

function handleTaxPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];

    var sql2 =
      'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
      ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid` ' +
      ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
      ' WHERE `primary_cash`.`deb_cred_uuid`=' + sanitize.escape(reference.deb_cred_uuid) + ';';
    var date = util.toMysqlDate(getDate());

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';

    return q([core.queries.origin('tax_payment'), core.queries.period(getDate()), core.queries.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.employee_account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.store = store;
    cfg.account_cashbox = res2[0].account_id;

    rate = cfg.store.get(reference.currency_id).rate;
    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Tax Payment/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), sanitize.escape(reference.account_id)
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleCotisationPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `primary_cash_item`.`primary_cash_uuid`, `reference`, `project_id`, `date`, `deb_cred_uuid`, `deb_cred_type`, `currency_id`, ' +
      '`account_id`, `cost`, `user_id`, `description`, `cash_box_id`, `origin_id`, `primary_cash_item`.`debit`, ' +
      '`primary_cash_item`.`credit`, `primary_cash_item`.`inv_po_id`, `primary_cash_item`.`document_uuid` ' +
    'FROM `primary_cash` JOIN `primary_cash_item` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `primary_cash`.`uuid` = ' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    var sql2 =
            'SELECT `creditor_group`.`account_id`, `creditor`.`uuid` FROM `primary_cash`' +
            ' JOIN `creditor` ON `creditor`.`uuid`=`primary_cash`.`deb_cred_uuid` ' +
            ' JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
            ' WHERE `primary_cash`.`deb_cred_uuid`=' + sanitize.escape(reference.deb_cred_uuid) + ';';

    var sql3 =
    'SELECT `cash_box_account_currency`.`account_id` ' +
    'FROM `cash_box_account_currency` ' +
    'WHERE `cash_box_account_currency`.`currency_id` = ' + sanitize.escape(reference.currency_id) + ' ' +
    'AND `cash_box_account_currency`.`cash_box_id` = ' + sanitize.escape(reference.cash_box_id) + ';';

    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('cotisation_paiement'), core.queries.period(getDate()), core.queries.exchangeRate(date), db.exec(sql2), db.exec(sql3)]);
  }

  function getDetails (originId, periodObject, store, res, res2) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.employee_account_id = res[0].account_id;
    cfg.creditor_uuid = res[0].uuid;
    cfg.account_cashbox = res2[0].account_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_PayCotisation/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), sanitize.escape(reference.account_id)
        ].join(',') + ', ' +
        [
          0, (reference.cost).toFixed(4),
          0, (reference.cost / rate).toFixed(4),
          reference.currency_id,
          sanitize.escape(cfg.creditor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(reference.document_uuid),
          cfg.originId,
          user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          reference.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), cfg.account_cashbox
        ].join(',') + ', ' +
        [
          reference.cost.toFixed(4), 0,
          (reference.cost / rate).toFixed(4), 0,
          reference.currency_id
        ].join(',') + ', null, null, ' + [sanitize.escape(reference.document_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

function handleCreateFiscalYear (id, user_id, details, done) {

  var rate, cfg = {},
      array_journal_uuid = [];

  getOrigin()
  .spread(getDetails)
  .then(getTransId)
  .then(postingEntry)
  .then(function (res) {
    done(null, res);
  })
  .catch(catchError);

  function getOrigin () {
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('journal'), core.queries.period(getDate()), core.queries.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store) {
    cfg.balance = details[0];
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(cfg.balance.currencyId).rate;
    return core.queries.transactionId(cfg.balance.projectId);
  }

  function getTransId (transId) {
    cfg.transId = transId;
    cfg.description =  transId.substring(0,4) + '/' + cfg.balance.description;
  }

  function postingEntry () {
    return q.all(
      details.map(function (balance) {
        var journal_uuid = sanitize.escape(uuid());
        array_journal_uuid.push(journal_uuid);

        var sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `origin_id`, `user_id` ) ' +
          'VALUES (' +
            [
              journal_uuid,
              balance.projectId,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.transId, '\'' + getDate() + '\'', sanitize.escape(cfg.description), balance.accountId
            ].join(',') + ', ' +
            [
              balance.credit.toFixed(4), balance.debit.toFixed(4),
              (balance.credit / rate).toFixed(4), (balance.debit / rate).toFixed(4),
              balance.currencyId,
              cfg.originId,
              user_id
            ].join(',') +
          ');';
        return db.exec(sql);
      })
    );
  }

  function catchError (err) {
    var sql = array_journal_uuid.length > 0 ? 'DELETE FROM `posting_journal` WHERE `posting_journal`.`uuid` IN (' + array_journal_uuid.join(',') + '); ' : 'SELECT 1+1;';

    db.exec(sql)
    .then(function () {
      console.error('[ROLLBACK]: deleting last entries in posting journal, Because => ', err);
      return done(err);
    })
    .catch(function (err2) {
      console.error('[ERR2]:', err2);
    });
  }
}

function handleReversingStock (id, user_id, details, done) {
  var sql, rate, transact, state = {}, queries = {}, data, reference, postingJournal, cfg = {};
  state.user_id = user_id;
  sql =
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `posting_journal`' +
    'WHERE `posting_journal`.`trans_id`=' + sanitize.escape(id) +
    'UNION ' +
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `general_ledger`' +
    'WHERE `general_ledger`.`trans_id`=' + sanitize.escape(id) ;

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(function (res){
    return done(null, res);
  })
  .then(function (res) {
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    postingJournal = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('reversing_stock'), core.queries.period(getDate()), core.queries.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;
    transact = core.queries.transactionId(reference.project_id);
    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'REVERSING STOCK ' + new Date().toISOString().slice(0, 10).toString();
    return requests();
  }

  function requests () {
    queries.items = [];
    var date = getDate();
    postingJournal.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(getDate());

      if (item.deb_cred_uuid){
        item.deb_cred_uuid = sanitize.escape(item.deb_cred_uuid);
      } else {
        item.deb_cred_uuid = null;
      }

      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `currency_id`, ' +
          '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
          '`user_id`, `cc_id`, `pc_id`) ' +
        'VALUES (' +
          item.uuid + ', ' +
          item.project_id + ', ' +
          item.fiscal_year_id + ', ' +
          item.period_id + ', ' +
          item.trans_id + ', ' +
          sanitize.escape(item.trans_date) + ', ' +
          item.doc_num + ', ' +
          sanitize.escape(item.description) + ', ' +
          item.account_id + ', ' +
          item.credit + ', ' +
          item.debit + ', ' +
          item.credit_equiv + ', ' +
          item.debit_equiv + ', ' +
          item.currency_id + ', ' +
          sanitize.escape(item.deb_cred_uuid) + ', ' +
          sanitize.escape(item.inv_po_id) + ', ' +
          item.cost_ctrl_id + ', ' +
          item.origin_id + ', ' +
          item.user_id + ', ' +
          item.cc_id + ', ' +
          item.pc_id +
        ');';
      queries.items.push(sql);
    });
    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  }
}

function handleAdvancePaiment (id, user_id, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  sql =
    'SELECT `rubric_paiement`.`id`, `rubric_paiement`.`rubric_id`, `rubric_paiement`.`paiement_uuid`, `rubric_paiement`.`value`, ' +
    '`rubric`.`is_advance`, `paiement`.`currency_id`, `paiement`.`employee_id`, `employee`.`prenom`, `employee`.`name`, `employee`.`creditor_uuid`, ' +
    '`creditor_group`.`account_id` AS `account_creditor`, `config_accounting`.`account_id` AS `account_paiement`, `primary_cash`.`project_id` ' +
    'FROM `rubric_paiement` ' +
    'JOIN `rubric` ON `rubric`.`id` = `rubric_paiement`.`rubric_id` ' +
    'JOIN `paiement` ON `paiement`.`uuid` = `rubric_paiement`.`paiement_uuid` ' +
    'JOIN `paiement_period` ON `paiement_period`.`id` = `paiement_period`.`config_accounting_id` ' +
    'JOIN `config_accounting` ON `config_accounting`.`id` = `paiement_period`.`config_accounting_id` ' +
    'JOIN `employee` ON `employee`.`id` = `paiement`.`employee_id` ' +
    'JOIN `creditor` ON `creditor`.`uuid`= `employee`.`creditor_uuid` ' +
    'JOIN `creditor_group` ON `creditor_group`.`uuid`=`creditor`.`group_uuid` ' +
    'JOIN `primary_cash_item` ON `primary_cash_item`.`inv_po_id` = `rubric_paiement`.`paiement_uuid` ' +
    'JOIN `primary_cash` ON `primary_cash`.`uuid` = `primary_cash_item`.`primary_cash_uuid` ' +
    'WHERE `rubric_paiement`.`paiement_uuid` = ' + sanitize.escape(id) +
    'AND `rubric`.`is_advance` = 1 ';


  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }

    reference = records[0];
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('salary_advance'), core.queries.period(getDate()), core.queries.exchangeRate(date)]);

  }

  function getDetails (originId, periodObject, store) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;

    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Pay Advance salary/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    if (reference.value > 0) {
      var debitSql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
        'VALUES (' +
          [
            sanitize.escape(uuid()),
            reference.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), reference.account_creditor
          ].join(',') + ', ' +
          [
            (reference.value).toFixed(4), 0,
            (reference.value / rate).toFixed(4), 0,
            reference.currency_id,
            sanitize.escape(reference.creditor_uuid)
          ].join(',') +
        ', \'C\', ' +
          [
            sanitize.escape(reference.paiement_uuid),
            cfg.originId,
            user_id
          ].join(',') + ');';

      return db.exec(debitSql);
    }
  }

  function credit () {
    if (reference.value > 0) {
      var credit_sql =
        'INSERT INTO posting_journal ' +
        '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
        '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
        '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
        'VALUES (' +
          [
            sanitize.escape(uuid()),
            reference.project_id,
            cfg.fiscalYearId,
            cfg.periodId,
            cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), reference.account_paiement
          ].join(',') + ', ' +
          [
            0, reference.value.toFixed(4),
            0, (reference.value / rate).toFixed(4),
            reference.currency_id
          ].join(',') + ', null, null, ' + [sanitize.escape(reference.paiement_uuid), cfg.originId, user_id].join(',') +
        ');';
      return db.exec(credit_sql);
    }
  }
}

function handleCancelSupport (id, user_id, details, done) {
  var sql, rate, transact, state = {}, queries = {}, data, reference, postingJournal, cfg = {};
  state.user_id = user_id;
  sql =
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `posting_journal`' +
    'WHERE `posting_journal`.`inv_po_id`=' + sanitize.escape(id) +
    'UNION ALL' +
    'SELECT `uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
    '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`,  `deb_cred_type`, `currency_id`, ' +
    '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
    '`user_id`, `cc_id`, `pc_id` ' +
    'FROM `general_ledger`' +
    'WHERE `general_ledger`.`inv_po_id`=' + sanitize.escape(id) ;

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(function (res){
    return done(null, res);
  })
  .then(function (res) {
    done(null, res);
  })
  .catch(function (err) {
    done(err);
  });

  function getRecord (records) {
    if (records.length === 0) { return; }
    reference = records[0];
    postingJournal = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('group_invoice'), core.queries.period(getDate()), core.queries.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store, res) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(reference.currency_id).rate;

    console.log(postingJournal.length);

    postingJournal = postingJournal.filter(function (item) {
      return item.origin_id === cfg.originId;
    });


    transact = core.queries.transactionId(reference.project_id);
    return core.queries.transactionId(reference.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'CANCEL SUPPORTED ' + new Date().toISOString().slice(0, 10).toString();
    return requests();
  }

  function requests () {
    queries.items = [];
    var date = getDate();
    postingJournal.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(getDate());

      if (item.deb_cred_uuid){
        item.deb_cred_uuid = sanitize.escape(item.deb_cred_uuid);
      } else {
        item.deb_cred_uuid = null;
      }

      var sql =
        'INSERT INTO `posting_journal` ' +
          '(`uuid`, `project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, `doc_num`, ' +
          '`description`, `account_id`, `debit`, `credit`, `debit_equiv`, `credit_equiv`, `deb_cred_type`, `currency_id`, ' +
          '`deb_cred_uuid`, `inv_po_id`, `cost_ctrl_id`, `origin_id`, '+
          '`user_id`, `cc_id`, `pc_id`) ' +
        'VALUES (' +
          item.uuid + ', ' +
          item.project_id + ', ' +
          item.fiscal_year_id + ', ' +
          item.period_id + ', ' +
          item.trans_id + ', ' +
          sanitize.escape(item.trans_date) + ', ' +
          item.doc_num + ', ' +
          sanitize.escape(item.description) + ', ' +
          item.account_id + ', ' +
          item.credit + ', ' +
          item.debit + ', ' +
          item.credit_equiv + ', ' +
          item.debit_equiv + ', ' +
          sanitize.escape(item.deb_cred_type) + ', ' +
          item.currency_id + ', ' +
          sanitize.escape(item.deb_cred_uuid) + ', ' +
          sanitize.escape(item.inv_po_id) + ', ' +
          item.cost_ctrl_id + ', ' +
          item.origin_id + ', ' +
          item.user_id + ', ' +
          item.cc_id + ', ' +
          item.pc_id +
        ');';
      queries.items.push(sql);
    });
    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  }
}

function handleIntegration (id, user_id, done) {
  var references, dayExchange, cfg = {};

  var sql = 'SELECT `purchase`.`uuid`, `purchase`.`creditor_uuid` , `purchase`.`cost`, `purchase`.`currency_id`, `purchase`.`project_id`,' +
            ' `purchase`.`purchaser_id`, `purchase`.`emitter_id`, ' +
            ' `purchase_item`.`inventory_uuid`, `purchase_item`.`total` FROM' +
            ' `purchase`, `purchase_item` WHERE' +
            ' `purchase`.`uuid` = `purchase_item`.`purchase_uuid` AND' +
            ' `purchase`.`uuid`=' + sanitize.escape(id) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    references = records;
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('confirm_integration'), core.queries.period(getDate())]);
  }

  function getDetails (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(references[0].project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  'Confirm Integration/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    return q.all(
      references.map(function (reference) {
        var sql = 'INSERT INTO posting_journal '+
                  '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
                  '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
                  '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) '+
                  'SELECT '+
                    [
                      sanitize.escape(uuid()),
                      reference.project_id,
                      cfg.fiscalYearId,
                      cfg.periodId,
                      cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\''
                    ].join(',') + ', `inventory_group`.`stock_account`, '+
                    [
                      0, reference.total.toFixed(4),
                      0, reference.total.toFixed(4),
                      reference.currency_id, sanitize.escape(reference.inventory_uuid)
                    ].join(',') +
                    ', null, ' +
                    [
                      sanitize.escape(reference.uuid),
                      cfg.originId,
                      user_id
                    ].join(',') +
                  ' FROM `inventory_group` WHERE `inventory_group`.`uuid`= ' +
                  '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }

  function credit () {

    return q.all(
      references.map(function (reference) {
        var sql =
          'INSERT INTO posting_journal ' +
          '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
          '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
          '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
          'SELECT ' +
            [
              sanitize.escape(uuid()),
              reference.project_id,
              cfg.fiscalYearId,
              cfg.periodId,
              cfg.trans_id, '\'' + getDate() + '\'', '\'' + cfg.descrip + '\''
            ].join(',') + ', `inventory_group`.`cogs_account`, ' +
            [
              reference.total.toFixed(4),0,
              reference.total.toFixed(4),0,
              reference.currency_id,
              sanitize.escape(reference.inventory_uuid)
            ].join(',') + ', null, ' +
            [
              sanitize.escape(reference.uuid),
              cfg.originId,
              user_id
            ].join(',') + ' FROM `inventory_group` WHERE `inventory_group`.`uuid`=' +
            '(SELECT `inventory`.`group_uuid` FROM `inventory` WHERE `inventory`.`uuid`=' + sanitize.escape(reference.inventory_uuid) + ')';
        return db.exec(sql);
      })
    );
  }
}

function handleExtraPayment (id, user_id, details, done) {
  var sql, rate, state = {}, data, reference, cfg = {};
  state.user_id = user_id;

  console.info(details, id, user_id);

  sql =
    'SELECT `g`.`account_id` ' +
    'FROM `sale` ' +
    'JOIN `debitor` AS `d` ON `d`.`uuid` = `sale`.`debitor_uuid` ' +
    'JOIN `debitor_group` AS `g` ON `g`.`uuid` = `d`.`group_uuid` ' +
    'WHERE `sale`.`uuid` = ' + sanitize.escape(details.sale_uuid) + ';';

  db.exec(sql)
  .then(getRecord)
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    return done(null, res);
  })
  .catch(function (err){
    return done(err, null);
  });

  function getRecord (records) {
    if (records.length === 0) { throw new Error('pas enregistrement'); }
    reference = records[0];
    details.cost = parseFloat(details.cost);
    console.info(reference);
    var date = util.toMysqlDate(getDate());
    return q([core.queries.origin('journal'), core.queries.period(getDate()), core.queries.exchangeRate(date)]);
  }

  function getDetails (originId, periodObject, store) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.store = store;
    rate = cfg.store.get(details.currency_id).rate;
    return core.queries.transactionId(details.project_id);
  }

  function getTransId (trans_id) {
    cfg.trans_id = trans_id;
    cfg.descrip =  trans_id.substring(0,4) + '_Extra_Payment/' + new Date().toISOString().slice(0, 10).toString();
    return debit();
  }

  function debit () {
    var debitSql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id`) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          details.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), details.wait_account
        ].join(',') + ', ' +
        [
          0, (details.cost).toFixed(4),
          0, (details.cost / rate).toFixed(4),
          details.currency_id,
          sanitize.escape(details.debitor_uuid)
        ].join(',') +
      ', \'C\', ' +
        [
          sanitize.escape(details.sale_uuid),
          cfg.originId,
          details.user_id
        ].join(',') + ');';
    return db.exec(debitSql);
  }

  function credit () {
    var credit_sql =
      'INSERT INTO posting_journal ' +
      '(`uuid`,`project_id`, `fiscal_year_id`, `period_id`, `trans_id`, `trans_date`, ' +
      '`description`, `account_id`, `credit`, `debit`, `credit_equiv`, `debit_equiv`, ' +
      '`currency_id`, `deb_cred_uuid`, `deb_cred_type`, `inv_po_id`, `origin_id`, `user_id` ) ' +
      'VALUES (' +
        [
          sanitize.escape(uuid()),
          details.project_id,
          cfg.fiscalYearId,
          cfg.periodId,
          cfg.trans_id, '\'' + getDate() + '\'', sanitize.escape(cfg.descrip), reference.account_id
        ].join(',') + ', ' +
        [
          details.cost.toFixed(4), 0,
          (details.cost / rate).toFixed(4), 0,
          details.currency_id,
          sanitize.escape(details.debitor_uuid),
        ].join(',') + ', \'D\', ' + [sanitize.escape(details.sale_uuid), cfg.originId, user_id].join(',') +
      ');';
    return db.exec(credit_sql);
  }
}

tableRouter = {
  'sale'                    : require('./journal/sale').create,
  'cash'                    : require('./journal/cash').payment,
  'cash_discard'            : require('./journal/cash').refund, // TODO - make this
  'cash_return'             : require('./journal/primarycash').refund,
  'transfert'               : require('./journal/primarycash').transfer,
  //'payroll'                 : require('./journal/primarycash').payroll,
  'group_invoice'           : require('./journal/convention').invoice,
  'employee_invoice'        : require('./journal/employee').invoice,
  'credit_note'             : require('./journal/sale').creditNote,
  'caution'                 : require('./journal/sale').caution,
  'pcash_convention'        : require('./journal/primarycash').convention,
  'pcash_employee'          : require('./journal/primarycash').payEmployee,
  'primary_expense'         : require('./journal/primarycash').genericExpense,
  'primary_income'          : require('./journal/primarycash').genericIncome,
  'indirect_purchase'       : require('./journal/purchase').indirectPurchase,
  'confirm'                 : require('./journal/purchase').confirm, // TODO - rename
  'confirm_direct_purchase' : require('./journal/purchase').directPurchase,
  'distribution_patient'    : handleDistributionPatient,
  'distribution_service'    : handleDistributionService,
  'consumption_loss'        : handleDistributionLoss,
  'salary_payment'          : handleSalaryPayment,
  'promesse_payment'        : require('./journal/employee').promisePayment,
  'promesse_cotisation'     : require('./journal/employee').promiseCotisation,
  'promesse_tax'            : handlePromesseTax,
  'donation'                : handleDonation,
  'tax_payment'             : handleTaxPayment,
  'cotisation_payment'      : handleCotisationPayment,
  'salary_advance'          : handleSalaryAdvance,
  'create_fiscal_year'      : handleCreateFiscalYear,
  'reversing_stock'         : handleReversingStock,
  'advance_paiment'         : handleAdvancePaiment,
  'cancel_support'          : handleCancelSupport,
  'fiscal_year_resultat'    : require('./journal/fiscal').close,
  'confirm_integration'     : handleIntegration,
  'extra_payment'           : handleExtraPayment
};


// FIXME - standardize this API
function request (table, id, user_id, done, debCaution, details) {
  // handles all requests coming from the client
  if (debCaution >= 0) {
    tableRouter[table](id, user_id, done, debCaution);
  } else if (details) {
    tableRouter[table](id, user_id, details, done);
  } else {
    tableRouter[table](id, user_id, done);
  }
  return;
}

module.exports = {
  request : request,
  lookupTable : lookupTable
};
