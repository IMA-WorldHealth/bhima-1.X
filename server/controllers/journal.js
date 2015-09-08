var q        = require('q'),
    db       = require('../lib/db'),
    sanitize = require('../lib/sanitize'),
    uuid     = require('../lib/guid'),
    validate = require('../lib/validate')(),
    util     = require('../lib/util'),
    core     = require('./journal/core');

var tableRouter;

// GET /journal/:table/:id
function lookupTable(req, res, next) {
  // What are the params here?
  request(req.params.table, req.params.id, req.session.user.id, function (err) {
    if (err) { return next(err); }
    res.status(200).send();
  });
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
    var date = util.toMysqlDate(new Date());
    return q([core.queries.origin('salary_advance'), core.queries.period(new Date()), core.queries.exchangeRate(date)]);

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
            cfg.trans_id, '\'' + new Date() + '\'', sanitize.escape(cfg.descrip), reference.account_creditor
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
            cfg.trans_id, '\'' + new Date() + '\'', sanitize.escape(cfg.descrip), reference.account_paiement
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
    var date = util.toMysqlDate(new Date());
    return q([core.queries.origin('group_invoice'), core.queries.period(new Date()), core.queries.exchangeRate(date)]);
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
    var date = new Date();
    postingJournal.forEach(function (item) {
      item.uuid = sanitize.escape(uuid());
      item.origin_id = cfg.originId;
      item.description = cfg.descrip;
      item.period_id = cfg.periodId;
      item.fiscal_year_id = cfg.fiscalYearId;
      item.trans_id = cfg.trans_id;
      item.trans_date = util.toMysqlDate(new Date());

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
    var date = util.toMysqlDate(new Date());
    return q([core.queries.origin('confirm_integration'), core.queries.period(new Date())]);
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
                      cfg.trans_id, '\'' + new Date() + '\'', '\'' + cfg.descrip + '\''
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
              cfg.trans_id, '\'' + new Date() + '\'', '\'' + cfg.descrip + '\''
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
  'salary_advance'          : require('./journal/primarycash').salaryAdvance,
  'primary_income'          : require('./journal/primarycash').genericIncome,
  'indirect_purchase'       : require('./journal/purchase').indirectPurchase,
  'confirm'                 : require('./journal/purchase').confirm, // TODO - rename
  'confirm_direct_purchase' : require('./journal/purchase').directPurchase,
  'distribution_patient'    : require('./journal/distribution').patient,
  'distribution_service'    : require('./journal/distribution').service,
  'consumption_loss'        : require('./journal/distribution').loss,
  'salary_payment'          : require('./jounal/primarycash').salaryPayment,
  'promesse_payment'        : require('./journal/employee').promisePayment,
  'promesse_cotisation'     : require('./journal/employee').promiseCotisation,
  'promesse_tax'            : require('./journal/employee').promiseTax,
  'donation'                : require('./journal/inventory').donation,
  'tax_payment'             : require('./journal/employee').taxPayment,
  'cotisation_payment'      : require('./journal/primarycash').cotisationPayment,
  'reversing_stock'         : require('./journal/distribution').reverseDistribution,
  'advance_paiment'         : handleAdvancePaiment,
  'cancel_support'          : handleCancelSupport,
  'create_fiscal_year'      : require('./journal/fiscal').create,
  'extra_payment'           : require('./journal/fiscal').extraPayment,
  'fiscal_year_resultat'    : require('./journal/fiscal').close,
  'confirm_integration'     : handleIntegration
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
