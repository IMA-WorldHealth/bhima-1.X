var q        = require('q'),
    db       = require('../../lib/db'),
    uuid     = require('../../lib/guid'),
    validate = require('../../lib/validate')(),
    util     = require('../../lib/util'),
    core     = require('./core');

exports.invoice = invoice;

/* Invoice Debtor Groups
 *
 * previously known as group invoice, this allows a
 * particular convention to be invoiced for a patient
 * bill.
 */
function invoice(id, userId, cb) {
  'use strict';

  var sql, references = {}, cfg = {};

  sql =
    'SELECT group_invoice.uuid, group_invoice.project_id, project.enterprise_id, group_invoice.debitor_uuid,  ' +
      'group_invoice.note, group_invoice.authorized_by, group_invoice.date, ' +
      'group_invoice.total, group_invoice_item.invoice_uuid, group_invoice_item.cost, ' +
      'group_invoice_item.uuid as gid ' +
    'FROM group_invoice JOIN group_invoice_item JOIN sale JOIN project ON ' +
      'group_invoice.uuid = group_invoice_item.payment_uuid AND ' +
      'group_invoice_item.invoice_uuid = sale.uuid AND ' +
      'project.id = group_invoice.project_id ' +
    'WHERE group_invoice.uuid = ?;';

  db.exec(sql, [id])
  .then(function (results) {

    if (results.length === 0) {
      throw new Error('no record found');
    }

    // extract metadata
    references = results;
    cfg.enterprise_id = results[0].enterprise_id;
    cfg.project_id = results[0].project_id;
    cfg.date = results[0].date;

    return core.checks.validPeriod(cfg.enterprise_id, cfg.date);
  })
  .then(function () {
    var costPositive = references.every(function (row) {
      return validate.isPositive(row.cost);
    });

    if (!costPositive) {
      throw new Error('Negative cost detected for invoice id: ' + id);
    }

    return core.queries.origin('group_deb_invoice');
  })
  .then(function (originId) {
    cfg.originId = originId;
    return core.queries.period(cfg.date);
  })
  .then(function (periodObject) {
    cfg.period_id = periodObject.id;
    cfg.fiscal_year_id = periodObject.fiscal_year_id;

    references.forEach(function (row) {

      return core.queries.transactionId(cfg.project_id)
      .then(function  (trans_id) {
        cfg.descript = trans_id.substring(0,4) + '_VENTE_CHARITE/' + new Date().toISOString().slice(0, 10).toString();
        var debitSql=
          'INSERT INTO posting_journal ' +
          '  (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
          'SELECT ' +
            [sanitize.escape(uuid()), cfg.project_id, cfg.fiscal_year_id, cfg.period_id, trans_id,  new Date() , sanitize.escape(cfg.descript)].join(', ') + ', ' +
          'debitor_group.account_id, group_invoice_item.cost, ' +
          '  0, group_invoice_item.cost, 0, enterprise.currency_id, ' +
          '  null, null, group_invoice_item.invoice_uuid, ' +
          [cfg.originId, userId].join(', ') + ' ' +
          'FROM group_invoice JOIN group_invoice_item JOIN debitor_group JOIN sale JOIN project JOIN enterprise ON ' +
          '  group_invoice.uuid = group_invoice_item.payment_uuid AND ' +
          '  group_invoice.group_uuid = debitor_group.uuid  AND ' +
          '  group_invoice_item.invoice_uuid = sale.uuid AND ' +
          '  group_invoice.project_id = project.id AND ' +
          '  project.enterprise_id = enterprise.id ' +
          'WHERE group_invoice_item.uuid = ' + sanitize.escape(row.gid);
        var credit_sql=
          'INSERT INTO posting_journal ' +
          '  (project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
          '  currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id) ' +
          'SELECT group_invoice.project_id, ' +
            [sanitize.escape(uuid()), cfg.fiscal_year_id, cfg.period_id, trans_id, new Date(), sanitize.escape(cfg.descript)].join(', ') + ', ' +
          'debitor_group.account_id, 0, group_invoice_item.cost, ' +
          '0, group_invoice_item.cost, enterprise.currency_id,  ' +
          'group_invoice.debitor_uuid, \'D\', group_invoice_item.invoice_uuid, ' +
          [ cfg.originId, userId].join(', ') + ' ' +
          'FROM group_invoice JOIN group_invoice_item JOIN debitor JOIN debitor_group JOIN sale JOIN project JOIN enterprise ON ' +
          '  group_invoice.uuid = group_invoice_item.payment_uuid AND ' +
          '  group_invoice.debitor_uuid = debitor.uuid  AND ' +
          '  debitor.group_uuid = debitor_group.uuid AND ' +
          '  group_invoice_item.invoice_uuid = sale.uuid AND ' +
          '  group_invoice.project_id = project.id AND ' +
          '  project.enterprise_id = enterprise.id ' +
          'WHERE group_invoice_item.uuid = ' + sanitize.escape(row.gid);
        return q.all([db.exec(debitSql), db.exec(credit_sql)]);
      });
    });
  })
  .then(function (res) {
    cb(null, res);
  })
  .catch(function (err) {
    cb(err);
  })
  .done();
}
