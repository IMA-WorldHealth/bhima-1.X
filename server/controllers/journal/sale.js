var q = require('q'),
    core = require('./core'),
    uuid = require('../../lib/guid'),
    sanitize = require('../../lib/sanitize'),
    validate = require('../../lib/validate')(),
    util = require('../../lib/util'),
    db = require('../../lib/db');


// TODO
// convert everything to using db.exec()
// parameter parsing.


function getSubsidy(id) {
  var sql =
    'SELECT sale_subsidy.value, debitor_group.account_id, subsidy.text, sale.uuid ' +
    'FROM sale_subsidy, debitor_group, subsidy, sale ' +
    'WHERE sale_subsidy.sale_uuid = sale.uuid AND ' +
      'sale_subsidy.subsidy_uuid = subsidy.uuid AND ' +
      'subsidy.debitor_group_uuid = debitor_group.uuid AND ' +
      'sale_subsidy.sale_uuid = ?;';
  return db.exec(sql, [id]);
}


// TODO Only has project ID passed from sale reference, need to look up enterprise ID
module.exports = function (id, user_id, callback, caution) {
  'use strict';

  var sql, data, reference, cfg = {}, queries = {}, subsidyReferences = [];

  sql =
    'SELECT sale.project_id, project.enterprise_id, sale.uuid, sale.currency_id, ' +
      'sale.debitor_uuid, sale.seller_id, sale.discount, sale.invoice_date, ' +
      'sale.cost, sale.note, sale_item.uuid as item_uuid, sale_item.transaction_price, sale_item.debit, ' +
      'sale_item.credit, sale_item.quantity, inventory.group_uuid, service.profit_center_id ' +
    'FROM sale JOIN sale_item JOIN inventory JOIN project JOIN service ON ' +
      'sale.uuid = sale_item.sale_uuid AND ' +
      'sale.project_id = project.id AND ' +
      'sale_item.inventory_uuid = inventory.uuid AND ' +
      'sale.service_id = service.id ' +
    'WHERE sale.uuid = ? ' +
    'ORDER BY sale_item.credit;';

  db.exec(sql, [id])
  .then(function (results) {

    // if the results are empty, throw an error
    if (results.length === 0) {
      throw new Error('No sale by the id: ' + id);
    }

    data = results;
    reference = results[0];

    // first check - do we have a valid period?
    // Also, implicit in this check is that a valid fiscal year
    // is in place.
    return getSubsidy(id);
  })
  .then(function (results) {
    subsidyReferences = results;
    return core.checks.validPeriod(reference.enterprise_id, reference.invoice_date);
  })
  .then(function () {
    // second check - are the debits (discounts) positive
    // for every transaction item?
    var debitPositive = data.every(function (row) {
      return validate.isPositive(row.debit);
    });

    if (!debitPositive) {
      throw new Error('Negative debit detected for sale id: ' + id);
    }

    // third check - are all the credits (revenue) positive
    // for every transaction item?
    var creditPositive = data.every(function (row) {
      return validate.isPositive(row.credit);
    });

    if (!creditPositive) {
      throw new Error('Negative credit detected for sale id: ' + id);
    }

    // all checks have passed - prepare for writing to the journal.
    return q([core.queries.origin('sale'), core.queries.period(reference.invoice_date)]);
  })
  .spread(function (originId, periodObject) {
    cfg.periodId = periodObject.id;
    cfg.fiscalYearId = periodObject.fiscal_year_id;
    cfg.originId = originId;

    // create a trans_id for the transaction
    // MUST BE THE LAST REQUEST TO prevent race conditions.
    return core.queries.transactionId(reference.project_id);
  })
  .then(function (trans_id) {

    // we can begin copying data from SALE -> JOURNAL

    // First, copy the data from sale into the journal.


    queries.subsidies = [];
    var subsidies_cost = 0;

    subsidyReferences.forEach(function (item) {
      var sql =
      'INSERT INTO posting_journal ' +
        '(project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) ' +
      'SELECT sale.project_id, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
        'sale.invoice_date, sale.note, ' + [sanitize.escape(item.account_id), item.value, 0, item.value, 0].join(', ') + ', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        'sale.currency_id, sale.debitor_uuid, \'D\', sale.uuid, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM sale JOIN debitor JOIN debitor_group ON ' +
        'sale.debitor_uuid=debitor.uuid AND debitor.group_uuid=debitor_group.uuid ' +
      'WHERE sale.uuid=' + sanitize.escape(id) + ';';
      subsidies_cost += item.value;
      queries.subsidies.push(sql);
    });

  if (reference.cost - subsidies_cost > 0){
    queries.sale =
      'INSERT INTO posting_journal ' +
        '(project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, ' +
        'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
        'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) ' +
      'SELECT sale.project_id, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
        'sale.invoice_date, sale.note, debitor_group.account_id, ' + [reference.cost - subsidies_cost, 0, reference.cost - subsidies_cost, 0].join(', ') + ', ' + // last three: credit, debit_equiv, credit_equiv.  Note that debit === debit_equiv since we use enterprise currency.
        'sale.currency_id, sale.debitor_uuid, \'D\', sale.uuid, ' + [cfg.originId, user_id].join(', ') + ' ' +
      'FROM sale JOIN debitor JOIN debitor_group ON ' +
        'sale.debitor_uuid=debitor.uuid AND debitor.group_uuid=debitor_group.uuid ' +
      'WHERE sale.uuid=' + sanitize.escape(id) + ';';
  }


    // Then copy data from SALE_ITEMS -> JOURNAL
    // This query is significantly more complex because sale_item
    // contains both debits and credits.
    queries.items = [];

    data.forEach(function (item) {
      var sql =
        'INSERT INTO posting_journal ' +
          '(project_id, uuid, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, debit, credit, debit_equiv, credit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id, pc_id) ' +
        'SELECT sale.project_id, ' + [sanitize.escape(uuid()), cfg.fiscalYearId, cfg.periodId, trans_id].join(', ') + ', ' +
          'sale.invoice_date, sale.note, inventory_group.sales_account, sale_item.debit, sale_item.credit, ' +
          'sale_item.debit, sale_item.credit, sale.currency_id, null, ' +
          ' null, sale.uuid, ' + [cfg.originId, user_id].join(', ') + ', if (ISNULL(account.pc_id), \'' + item.profit_center_id + '\', account.pc_id) ' +
        'FROM sale JOIN sale_item JOIN inventory JOIN inventory_group JOIN account ON ' +
          'sale_item.sale_uuid=sale.uuid AND sale_item.inventory_uuid=inventory.uuid AND ' +
          'inventory.group_uuid=inventory_group.uuid AND account.id=inventory_group.sales_account ' +
        'WHERE sale_item.uuid = ' + sanitize.escape(item.item_uuid) + ';';
      queries.items.push(sql);
    });

    // now we must set all relevant rows from sale to 'posted'
    queries.sale_posted =
      'UPDATE sale SET sale.posted=1 WHERE sale.uuid = ' + sanitize.escape(id);

    return q.all(queries.items.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    return q.all(queries.subsidies.map(function (sql) {
      return db.exec(sql);
    }));
  })
  .then(function () {
    return queries.sale ? db.exec(queries.sale) : q();
  })
  .then(function () {
    return q([db.exec(queries.sale_posted), core.queries.transactionId(reference.project_id)]);
  })
  .spread(function (rows, transId) {

    if (caution && caution > 0) {

      var descript = '[AVANCE] AJUSTEMENT/' + reference.note;
      var transAmount = caution - reference.cost > 0 ? reference.cost : caution;
      queries.cautionDebiting =
        'INSERT INTO posting_journal '+
          '(uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) '+
          'SELECT ' + ['\'' + uuid() + '\'', reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.invoice_date)), '\''+descript+'\''].join(',') + ', ' +
            'debitor_group.account_id, ' + [0, transAmount, 0, transAmount, reference.currency_id, '\'' + reference.debitor_uuid + '\''].join(',') +
            ', \'D\', null, ' + [cfg.originId, user_id].join(',') + ' ' +
          'FROM debitor_group WHERE debitor_group.uuid= (' +
          'SELECT debitor.group_uuid FROM debitor WHERE debitor.uuid='+ sanitize.escape(reference.debitor_uuid) +');';

      queries.DebitorCrediting =
        'INSERT INTO posting_journal '+
          '(uuid, project_id, fiscal_year_id, period_id, trans_id, trans_date, ' +
          'description, account_id, credit, debit, credit_equiv, debit_equiv, ' +
          'currency_id, deb_cred_uuid, deb_cred_type, inv_po_id, origin_id, user_id ) '+
          'SELECT ' + ['\'' + uuid() + '\'', reference.project_id, cfg.fiscalYearId, cfg.periodId, transId, sanitize.escape(util.toMysqlDate(reference.invoice_date)), '\''+descript+'\''].join(',') + ', ' +
            'debitor_group.account_id, ' + [transAmount, 0, transAmount, 0, reference.currency_id, '\'' + reference.debitor_uuid + '\''].join(',') +
            ', \'D\', ' + [sanitize.escape(reference.uuid), cfg.originId, user_id].join(',') + ' ' +
          'FROM debitor_group WHERE debitor_group.uuid= (' +
          'SELECT debitor.group_uuid FROM debitor WHERE debitor.uuid='+ sanitize.escape(reference.debitor_uuid) +');';

      return q.all([
        db.exec(queries.cautionDebiting),
        db.exec(queries.DebitorCrediting)
      ]);
    }
    return q();
  })
  .then(function (res) {
    callback(null, res);
  })
  .catch(function (err) {
    callback(err);
  })
  .done();
};
