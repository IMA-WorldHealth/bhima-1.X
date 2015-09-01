var q = require('q'),
    core = require('./core'),
    uuid = require('../../lib/guid'),
    util = require('../../lib/util'),
    db = require('../../lib/db');

exports.transfer = transfer;
exports.refund = refund;

/*
 * Transfer cash from one cashbox to another
 *
 * The process of transfering cash from one cashbox to another
 * involves a third, middle account, which will show up
 * as two transactions in the posting journal.
 *
 * Why is is the case?  No idea.  But it is! @jniles #yolo #bhimacode
 */
function transfer(id, userId, cb) {
  var sql, data, reference, params, cfg = {}, queries = {};

  // TODO : Formalize this
  sql =
    'SELECT primary_cash.*, cash_box_account_currency.virement_account_id ' +
    'FROM primary_cash JOIN cash_box_account_currency ON ' +
      'cash_box_account_currency.account_id = primary_cash.account_id ' +
     'WHERE uuid = ?;';

  db.exec(sql, [id])
  .then(function (results) {

    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);

    return core.queries.myExchangeRate(date);
  })
  .then(function (exchangeRateStore) {
    var dailyExchange = exchangeRateStore.get(reference.currency_id);

    // TODO - wat?
    cfg.valueExchanged = parseFloat((1/dailyExchange.rate) * reference.cost).toFixed(4);

    return q([core.queries.origin('pcash_transfert'), core.queries.period(reference.date)]);
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return core.queries.transactionId(reference.project_id);
  })

  // we begin posting from the cashbox --> middle account
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description = transId.substring(0,4) + 'CASH_BOX_VIRMENT' + new Date().toISOString().slice(0, 10).toString();

    // credit query
    sql =
      'INSERT INTO posting_journal (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) '+
      'VALUES (?);';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
      reference.account_id, reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id, null, null, id,
      cfg.originId, userId
    ];

    return db.exec(sql, [params]);
  })
  .then(function () {

    // debit query
    sql =
      'INSERT INTO posting_journal (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) '+
      'VALUES (?);';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
      reference.virement_account_id, 0, reference.cost, 0, cfg.valueExchanged, reference.currency_id, null, null,
      id, cfg.originId, userId
    ];

    return db.exec(sql, [params]);
  })

  // we begin posting from middle account --> primary cashbox
  .then(function () {
    return core.queries.transactionId(reference.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description = transId.substring(0,4) + 'CASH_BOX_VIRMENT' + new Date().toISOString().slice(0, 10).toString();

    sql =
      'INSERT INTO posting_journal (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) '+
      'VALUES (?);';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(),
      cfg.description, reference.virement_account_id, reference.cost, 0, cfg.valueExchanged,
      0, reference.currency_id, null, null, id, cfg.originId, userId
    ];

    return db.exec(sql, [params]);
  })
  .then(function () {
    sql =
      'INSERT INTO posting_journal '+
        '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'SELECT ?,?,?,?,?,?, account_id,?,?,?,?,?,?,?,?,?,?,? ' +
      'FROM cash_box_account_currency ' +
      'WHERE cash_box_account_currency.cash_box_id = ? ' +
        'AND cash_box_account_currency.currency_id = ?;';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(),
      cfg.description, 0, reference.cost, 0, cfg.valueExchanged, reference.currency_id, null, null,
      id, cfg.originId, userId, reference.cash_box_id, reference.currency_id
    ];

    return db.exec(sql, params);
  })

  // all done! Report results to client
  .then(function (rows) {
    cb(null, rows);
  })
  .catch(function (error) {

    // FIXME/TODO -- why are we deleting from the primary cash??
    // We should be deleting and bad transfers from the posting journal!
    // Oh my.
    console.log('[JOURNAL] Primary Cash:', error);
    sql = 'DELETE FROM primary_cash_item WHERE primary_cash_uuid = ?;';

    db.exec(sql, [id])
    .then(function (){
      sql = 'DELETE FROM primary_cash WHERE uuid = ?;';
      return db.exec(sql, [id]);
    })
    .then(function () {
      cb(error);
    })
    .catch(cb)
    .done();
  })
  .done();
}

/*
 * Refund cash to an organisation from the Primary Cash Box
 *
 * This is used when you need to pay someone back for a previous (paid) bill.
 */
function refund(id, userId, cb) {
  var sql, data, params, reference, cfg = {}, queries = {};

  // TODO : Formalize this
  sql =
    'SELECT * FROM primary_cash WHERE primary_cash.uuid = ?;';

  // TODO -- any checks?
  db.exec(sql, [id])
  .then(function (results) {
    if (results.length === 0) {
      throw new Error('No primary_cash by the uuid: ' + id);
    }

    reference = results[0];
    data = results;
    var date = util.toMysqlDate(reference.date);

    return core.queries.myExchangeRate(date);
  })
  .then(function (exchangeRateStore) {
    var dailyExchange = exchangeRateStore.get(reference.currency_id);
    cfg.valueExchanged = parseFloat((1/dailyExchange.rate) * reference.cost).toFixed(4);

    return q([core.queries.origin('cash_return'), core.queries.period(reference.date)]); // should be core.queries.origin(pcash_transfert);
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;

    return core.queries.transactionId(reference.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;

    sql =
      'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'SELECT ?,?,?,?,?,?, account_id,?,?,?,?,?,?,?,?,?,? ' +
      'FROM cash_box_account_currency ' +
      'WHERE cash_box_account_currency.cash_box_id = ? AND ' +
          'cash_box_account_currency.currency_id = ?;';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, reference.date,
      reference.description, reference.cost, 0, cfg.valueExchanged, 0, reference.currency_id, null, null,
      id, cfg.originId, userId, reference.cash_box_id, reference.currency_id
    ];

    return db.exec(sql, params);
  })
  .then(function () {
    sql  =
      'INSERT INTO posting_journal (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
      'VALUES (?);';

    params = [
      uuid(), reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, reference.date,
      reference.description, reference.account_id, 0, reference.cost, 0, cfg.valueExchanged,
      reference.currency_id, reference.deb_cred_uuid, reference.deb_cred_type, id, cfg.originId,
      userId
    ];

    return db.exec(sql, params);
  })
  .then(function (rows) {
    cb(null, rows);
  })
  .catch(function (err) {
    sql = 'DELETE FROM primary_cash_item WHERE primary_cash_uuid = ?;';

    db.exec(sql, [id])
    .then(function() {
      sql = 'DELETE FROM primary_cash WHERE uuid = ?;;';
      return db.exec(sql, [id]);
    })
    .then(function () {
      cb(err);
    })
    .catch(cb)
    .done();
  })
  .done();
}
