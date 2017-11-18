var q         = require('q'),
    core      = require('./core'),
    uuid      = require('../../lib/guid'),
    db        = require('../../lib/db');

exports.donation = donation;
exports.serviceReturnStock = serviceReturnStock;

/* Stock Donation
 *
 * Values stock donated to the inventory
 *
*/
function donation(id, userId, data, cb) {
  'use strict';

  var sql, params, cfg = {},
      reference;

  // TODO - this is bad.  Don't do this.  Refactor.
  sql = 'SELECT * FROM inventory WHERE inventory.uuid = ?;';

  db.exec(sql, [data.inventory_uuid])
  .then(function (records) {
    if (records.length === 0) {
      throw new Error('Could not find an inventory reference with uuid:' + data.donation.uuid);
    }
    reference = records[0];
    cfg.cost = data.purchase_price * data.quantity;

    return [
      core.queries.origin('donation'),
      core.queries.period(new Date())
    ];
  })
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(data.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description =  transId.substring(1,4) + '_Donation/' + new Date().toISOString().slice(0, 10).toString();
    sql =
      'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'SELECT ?, ?, ?, ?, ?, ?, ?, inventory_group.stock_account, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ' +
      'FROM inventory_group WHERE inventory_group.uuid = ?;';

    params = [
      uuid(), data.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
      0, cfg.cost, 0, cfg.cost, data.currency_id, null, null, data.donation.uuid, cfg.originId, userId,
      reference.group_uuid
    ];

    return db.exec(sql, params);
  })
  .then(function () {
    sql =
      'INSERT INTO posting_journal (' +
        'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
      'SELECT ?, ?, ?, ?, ?, ?, ?, inventory_group.donation_account, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ' +
      'FROM inventory_group WHERE inventory_group.uuid = ?;';

    params = [
      uuid(), data.project_id, cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description,
      cfg.cost, 0, cfg.cost, 0, data.currency_id, null, null, data.donation.uuid, cfg.originId, userId,
      reference.group_uuid
    ];

    return db.exec(sql, params);
  })
  .then(function (res) {
    return cb(null, res);
  })
  .catch(function (err) {

    sql = 'DELETE FROM donations WHERE donations.uuid = ?';

    db.exec(sql, [data.donation.uuid])
    .then(function () {
      sql = 'DELETE FROM donation_item WHERE donation_item.donation_uuid = ?;';
      return db.exec(sql, [data.donation.uuid]);
    })
    .then(function () {
      sql = 'DELETE FROM movement WHERE movement.document_id = ?;';
      return db.exec(sql, [data.movement.document_id]);
    })
    .then(function () {
      sql = 'DELETE FROM stock WHERE stock.tracking_number IN (?)';
      return db.exec(sql, [data.donation.tracking_numbers]);
    })
    .done(cb);
  })
  .done();
}


/* Service Return Stock
 *
 * This function is responsible for writing in journal :
 * debit of stock account
 * cerdit of stock variation account
 * service as cost center
 *
*/
function serviceReturnStock(id, userId, cb) {
  'use strict';

  console.log('params', id);

  // iteraton dans la liste de tracking_number
  var glb = JSON.parse(id); //this id is an object
  var sql, params, references, dayExchange, cfg = {};

  // sql =
  //   'SELECT purchase.uuid, purchase.creditor_uuid , purchase.cost, purchase.currency_id, ' +
  //     'purchase.project_id, purchase.purchaser_id, purchase.emitter_id, purchase.note, ' +
  //     'purchase_item.inventory_uuid, purchase_item.total ' +
  //   'FROM purchase JOIN purchase_item ON ' +
  //     'purchase.uuid = purchase_item.purchase_uuid ' +
  //   'WHERE purchase.uuid = ?;';

  // db.exec(sql, [glb.purchase_uuid])
  // .then(function (records) {
  //   if (records.length === 0) {
  //     throw new Error('Could not find a purchase with uuid:' + id);
  //   }

  //   references = records;

    // return [
    //   core.queries.origin('service_return_stock'),
    //   core.queries.period(new Date())
    // ]
  // })

  return q.all([ core.queries.origin('service_return_stock'), core.queries.period(new Date())])
  .spread(function (originId, periodObject) {
    cfg.originId = originId;
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(glb.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;
    cfg.description =  'Service Return Stock/' + new Date().toISOString().slice(0, 10).toString();

    var queries = glb.stock_ids.map(function (item) {
      sql =
        'INSERT INTO posting_journal ('+
          'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) '+
        'SELECT ?, p.project_id, ?, ?, ?, ?, ?, ig.stock_account, ?, pi.unit_price * ' + item.quantity + ', ?, ' +
        'pi.unit_price * ' + item.quantity + ', p.currency_id, ?, ?, p.uuid, ?, ? ' +
        'FROM purchase AS p JOIN purchase_item pi ON p.uuid = pi.purchase_uuid JOIN inventory i ON ' +
        'pi.inventory_uuid = i.uuid JOIN inventory_group ig ON i.group_uuid = ig.uuid ' +
        'WHERE p.uuid = ? AND i.uuid = ?;';

      params = [
        uuid(), cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(),
        cfg.description, 0, 0, null, null, cfg.originId, userId, item.purchase_uuid, item.inventory_uuid
      ];

      return db.exec(sql, params);
    });
    return q.all(queries);
  })
  .then(function () {
    var queries = glb.stock_ids.map(function (item) {
      sql =
        'INSERT INTO posting_journal (' +
          'uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id, cc_id) ' +
        'SELECT ?, p.project_id, ?, ?, ?, ?, ?, ig.cogs_account, pi.unit_price * ' + item.quantity + ', ?, ' +
        'pi.unit_price * ' + item.quantity + ', ?, p.currency_id, ?, ?, p.uuid, ?, ?, ? ' +
        'FROM purchase AS p JOIN purchase_item pi ON p.uuid = pi.purchase_uuid JOIN inventory i ON ' +
        'pi.inventory_uuid = i.uuid JOIN inventory_group ig ON i.group_uuid = ig.uuid ' +
        'WHERE p.uuid = ? AND i.uuid = ?;';

      params = [
        uuid(), cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.description, 0, 0, null, null,
        cfg.originId, userId, glb.cost_center_id, item.purchase_uuid, item.inventory_uuid
      ];

      return db.exec(sql, params);
    });
    return q.all(queries);
  })
  .then(function (res){
    return cb(null, res);
  })
  .catch(function (err){console.log('err', err);})
  .done();
}
