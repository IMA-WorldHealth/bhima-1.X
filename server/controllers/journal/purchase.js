var q = require('q'),
    db = require('../../lib/db'),
    validate = require('../../lib/validate')(),
    core = require('./core');

// handle posting purchase requests
// TODO/FIXME - it doesn't seem like this is used.  Why?
module.exports = function (id, userId, cb) {
  // posting purchase requests
  var sql, data, reference, cfg = {}, queries = {};
  sql =
    'SELECT purchase.project_id, project.enterprise_id, purchase.id, purchase.cost, purchase.currency_id, ' +
      'purchase.creditor_id, purchase.purchaser_id, purchase.discount, purchase.invoice_date, ' +
      'purchase.note, purchase.posted, purchase_item.unit_price, purchase_item.total, purchase_item.quantity ' +
    'FROM purchase JOIN purchase_item JOIN project ON ' +
      'purchase.id = purchase_item.purchase_id AND project.id = purchase.project_id ' +
    'WHERE purchase.id = ?;';

  db.exec(sql, [id])
  .then(function (results) {
    if (results.length === 0) { throw new Error('No purchase order by the id: ' + id); }

    reference = results[0];
    data = results;

    // first check - do we have a validPeriod?
    // Also, implicit in this check is that a valid fiscal year
    // is in place.
    return core.checks.validPeriod(reference.enterprise_id, reference.invoice_date);
  })
  .then(function () {
    // second check - is the cost positive for every transaction?
    var costPositive = data.every(function (row) { return validate.isPositive(row.cost); });
    if (!costPositive) {
      throw new Error('Negative cost detected for purchase id: ' + id);
    }

    // third check - are all the unit_price's for purchase_items positive?
    var unit_pricePositive = data.every(function (row) { return validate.isPositive(row.unit_price); });
    if (!unit_pricePositive) {
      throw new Error('Negative unit_price for purchase id: ' + id);
    }

    // fourth check - is the total the price * the quantity?
    var totalEquality = data.every(function (row) { return validate.isEqual(row.total, row.unit_price * row.quantity); });
    if (!totalEquality) {
      throw new Error('Unit prices and quantities do not match for purchase id: ' + id);
    }

    return core.queries.origin('purchase');
  })
  .then(function (originId) {
    cfg.originId = originId;
    return core.queries.period(reference.date);
  })
  .then(function (periodObject) {
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    return core.queries.transactionId(reference.project_id);
  })
  .then(function (transId) {
    cfg.transId = transId;

    // format queries
    queries.purchase =
      'INSERT INTO posting_journal ' +
        '(project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) ' +
      'SELECT purchase.project_id, ?, ?, ?, ?, ' +
        'purchase.note, creditor_group.account_id, 0, purchase.cost, 0, purchase.cost, ' + // last four debit, credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        'purchase.currency_id, purchase.creditor_id, \'C\', purchase.id, ?, ?' +
      'FROM purchase JOIN creditor JOIN creditor_group ON ' +
        'purchase.creditor_id=creditor.id AND creditor_group.id=creditor.group_id ' +
      'WHERE purchase.id = ?;';

    queries.purchaseItem =
      'INSERT INTO posting_journal ' +
        '(project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) ' +
      'SELECT purchase.project_id, ?, ?, ?, ? ' +
        'purchase.note, inventory_group.sales_account, purchase_item.total, 0, purchase_item.total, 0, ' + // last three: credit, debit_equiv, credit_equiv
        'purchase.currency_id, purchase.creditor_id, \'C\', purchase.id, ?, ?' +
      'FROM purchase JOIN purchase_item JOIN inventory JOIN inventory_group ON ' +
        'purchase_item.purchase_id=purchase.id AND purchase_item.inventory_id=inventory.id AND ' +
        'inventory.group_id=inventory_group.id ' +
      'WHERE purchase.id = ?;';

    return db.exec(queries.purchase, [cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.originId, userId, id]);
  })
  .then(function () {
    return db.exec(queries.purchaseItem, [cfg.fiscalYearId, cfg.periodId, cfg.transId, new Date(), cfg.originId, userId, id]);
  })
  .then(function (rows) {
    cb(null, rows);
  })
  .catch(cb)
  .done();
};
