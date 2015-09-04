var q        = require('q'),
    core     = require('./core'),
    uuid     = require('../../lib/guid'),
    sanitize = require('../../lib/sanitize'),
    validate = require('../../lib/validate')(),
    util     = require('../../lib/util'),
    db       = require('../../lib/db');

exports.patient = patient;


/* distribution to patient
 *
 */
function patient(id, userId, cb) {
  'use strict';

  var sql, references, dayExchange, cfg = {}, ids = [];

  sql =
    'SELECT consumption.uuid, consumption.date, consumption.unit_price, consumption.quantity, stock.inventory_uuid, ' +
      'inventory.purchase_price, inventory_group.uuid AS group_uuid, inventory_group.cogs_account, ' +
      'inventory_group.stock_account, sale.project_id, sale.service_id ' +
    'FROM consumption JOIN stock JOIN inventory JOIN inventory_group JOIN sale ON ' +
      'consumption.tracking_number = stock.tracking_number AND ' +
      'stock.inventory_uuid = inventory.uuid AND ' +
      'inventory.group_uuid = inventory_group.uuid AND ' +
      'sale.uuid = consumption.document_id ' +
    'WHERE consumption.document_id = ? AND '+
      'consumption.uuid NOT IN (' +
        'SELECT consumption_reversing.consumption_uuid FROM consumption_reversing ' +
        'WHERE consumption_reversing.document_id = ?);';

  db.exec(sql, [id, id])
  .then(getRecord)
  .then(function (records) {
    if (records.length === 0) { throw new Error('Could not find consumption with uuid:' + id); }
    references = records;
    return [
      core.queries.origin('distribution'),
      core.queries.period(references[0].date)
    ];
  })
  .spread(getDetails)
  .then(getTransId)
  .then(credit)
  .then(function (res){
    cb(null, res);
  })
  .catch(catchError)
  .done();

  function getRecord (records) {
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
        ids.push(uuid_debit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
                  'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
                  'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id, cc_id ) ' +
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
                      userId
                    ].join(',') +
                    ', service.cost_center_id FROM service WHERE service.id= ' + sanitize.escape(reference.service_id) + ';';
                  // ' FROM inventory_group WHERE inventory_group.uuid= ' + sanitize.escape(reference.group_uuid) + ';';
        return db.exec(sql);
      })
    );
  }

  function credit () {
    return q.all(
      references.map(function (reference) {
        var uuid_credit = sanitize.escape(uuid());
        ids.push(uuid_credit);

        var sql = 'INSERT INTO posting_journal ' +
                  '(uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
                  'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
                  'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
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
                      userId,
                    ].join(',') +
                  ' FROM inventory_group WHERE inventory_group.uuid= '+ sanitize.escape(reference.group_uuid) +';';
        return db.exec(sql);
      })
    );
  }

  // error handler to clean up if there are errors
  function catchError(err) {

    sql = ''


    // 
    var posting_deleting = ids.length > 0 ? 'DELETE FROM posting_journal WHERE posting_journal.uuid' + ' IN (' + ids + ')' : 'SELECT 1+1';
    var consumption_patient_deleting = 'DELETE FROM consumption_patient WHERE consumption_patient.sale_uuid=' + sanitize.escape(id);
    var consumption_deleting = 'DELETE FROM consumption WHERE consumption.document_id=' + sanitize.escape(id);

    db.exec(posting_deleting)
    .then(function () {
      return db.exec(consumption_patient_deleting);
    })
    .then(function () {
      return db.exec(consumption_deleting);
    })
    .finally(function () {
      cb(err);
    });
  }
}

