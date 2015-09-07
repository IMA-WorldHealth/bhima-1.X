var q        = require('q'),
    core     = require('./core'),
    uuid     = require('../../lib/guid'),
    sanitize = require('../../lib/sanitize'),
    validate = require('../../lib/validate')(),
    util     = require('../../lib/util'),
    db       = require('../../lib/db');

exports.patient = patient;
exports.service = service;


/* Distribution to a patient
 *
 * Allows a patient to claim medicine he paid for at
 * the pharmacy.
 */
function patient(id, userId, cb) {
  'use strict';

  var sql, references, queries, dayExchange, cfg = {}, ids = [];

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
  .then(function (records) {
    if (records.length === 0) { throw new Error('Could not find consumption with uuid:' + id); }
    references = records;
    return [
      core.queries.origin('distribution'),
      core.queries.period(references[0].date)
    ];
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(references[0].project_id); // fix me, ID of project
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description =  'DP/'+new Date().toISOString().slice(0, 10).toString();

    queries = references.map(function (reference) {
      var params, uid = uuid();

      // generate a new uuid and store for later error correction
      ids.push(uid);

      sql =
        'INSERT INTO posting_journal (' +
          'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id, cc_id ) ' +
        'SELECT ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, service.cost_center_id ' +
        'FROM service ' +
        'WHERE service.id = ?;';

      params = [
        uid, reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
        reference.cogs_account, 0, (reference.quantity * reference.unit_price).toFixed(4), 0,
        (reference.quantity * reference.unit_price).toFixed(4), 2, null, null, id, cfg.originId, userId,
        reference.service_id
      ];

      return db.exec(sql, params);
    });

    return q.all(queries);
  })
  .then(function () {
    queries = references.map(function (reference) {
      var params, uid = uuid();
      ids.push(uid);

      var sql =
      'INSERT INTO posting_journal (' +
        'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ' +
      'FROM inventory_group ' +
      'WHERE inventory_group.uuid = ?;';

      params = [
        uid, reference.project_id, cfg.fiscalYearId, cfg.periodId, cfg.trans_id, new Date(),
        cfg.description, reference.stock_account, (reference.quantity * reference.unit_price).toFixed(4),
        0, (reference.quantity * reference.unit_price).toFixed(4), 0, 2, reference.inventory_uuid, null,
        reference.uuid, cfg.originId, userId, reference.group_uuid
      ];

      return db.exec(sql, params);
    });

    return q.all(queries);
  })
  .then(function (res){
    cb(null, res);
  })

  // handle errors appropriately
  .catch(function (err) {

    // delete from posting journal if we've posted there
    // TODO - make a logic 1,2,3 steps to this process
    // and then replicate it everywhere
    sql = ids.length > 0 ? 'DELETE FROM posting_journal WHERE posting_journal.uuid IN (?);' : 'SELECT 1 + 1;';

    // execute in order
    db.exec(sql)
    .then(function () {
      sql = 'DELETE FROM consumption_patient WHERE consumption_patient.sale_uuid = ?;';
      return db.exec(sql, [id]);
    })
    .then(function () {
      sql = 'DELETE FROM consumption WHERE consumption.document_id = ?';
      return db.exec(sql, [id]);
    })
    .finally(function () {
      cb(err);
    });
  })
  .done();
}


/* Distribution to a Service
 *
 * Handles distribution of medicines to a service.
 *
*/
function service(id, userId, details, cb) {
  'use strict';

  var sql, queries, references, dayExchange,
      cfg = {},
      ids = [];

  sql =
    'SELECT consumption.uuid, consumption.date, consumption.unit_price, consumption.quantity, ' +
      'consumption_service.service_id, stock.inventory_uuid, inventory.purchase_price, ' +
      'inventory_group.uuid AS group_uuid, inventory_group.cogs_account, inventory_group.stock_account ' +
    'FROM consumption JOIN consumption_service JOIN stock JOIN inventory JOIN inventory_group ON ' +
      'consumption.tracking_number = stock.tracking_number AND ' +
      'consumption_service.consumption_uuid = consumption.uuid AND ' +
      'stock.inventory_uuid = inventory.uuid AND ' +
      'inventory.group_uuid = inventory_group.uuid ' +
    'WHERE consumption.document_id = ?;';

  db.exec(sql, [id])
  .then(function (records) {
    if (records.length === 0) {
      throw new Error('Could not find distribution with uuid:' + id);
    }
    references = records;
    return [
      core.queries.origin('distribution'),
      core.queries.period(new Date())
    ];
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(details.id);
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description =  'DS/'+new Date().toISOString().slice(0, 10).toString();

    queries = references.map(function (reference) {
      var params, uid = uuid();
      ids.push(uid);

      sql =
      'INSERT INTO posting_journal (' +
        'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id, cc_id) ' +
      'SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  service.cost_center_id ' +
      'FROM service WHERE service.id = ?;';

      params = [
        uid, details.id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description, reference.cogs_account,
        0, reference.quantity * reference.unit_price, 0, reference.quantity * reference.unit_price,
        details.currency_id, null, null, id, cfg.originId, reference.service_id
      ];

      return db.exec(sql, params);
    });

    return q.all(queries);
  })
  .then(function () {

    queries = references.map(function (reference) {
      var params, uid = uuid();
      ids.push(uid);

      sql =
        'INSERT INTO posting_journal (' +
          'uuid,project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
        'SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ' +
        'FROM inventory_group ' +
        'WHERE inventory_group.uuid = ?;';

      params = [
        uid, details.id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
        reference.stock_account, reference.quantity * reference.unit_price, 0, reference.quantity * reference.unit_price, 0,
        details.currency_id, sanitize.escape(reference.inventory_uuid), null, reference.uuid, cfg.originId, userId,
        reference.group_uuid
      ];

      return db.exec(sql, params);
    });

    return q.all(queries);
  })

  // all done!
  .then(function (res){
    return cb(null, res);
  })
  .catch(function (err) {
    sql = ids.length > 0 ? 'DELETE FROM posting_journal WHERE posting_journal.uuid IN (?)' : 'SELECT 1 + 1;';

    db.exec(sql, [ids])
    .then(function () {
      sql =
        'DELETE FROM consumption_service WHERE consumption_service.consumption_uuid IN (' +
          'SELECT DISTINCT consumption.uuid FROM consumption WHERE consumption.document_id = ?' +
        ');';

      return db.exec(sql, [id]);
    })
    .then(function () {
      sql = 'DELETE FROM consumption WHERE consumption.document_id = ?;';
      return db.exec(sql, [id]);
    })
    .finally(function () {
      return cb(err);
    });
  })
  .done();
}
