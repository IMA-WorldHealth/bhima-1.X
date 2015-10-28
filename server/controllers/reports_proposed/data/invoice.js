var db      = require('./../../../lib/db');
var q       = require('q');
var numeral = require('numeral');

var query = {
  sale : 'SELECT * FROM sale_item LEFT JOIN sale ON sale_item.sale_uuid = sale.uuid LEFT JOIN inventory ON sale_item.inventory_uuid = inventory.uuid LEFT JOIN project ON sale.project_id = project.id WHERE sale.uuid = ? ORDER BY inventory.code',
  enterprise : 'SELECT * FROM project JOIN enterprise on project.enterprise_id = enterprise.id WHERE project.id = ?',
  recipient : 'SELECT * FROM debitor JOIN patient ON debitor.uuid = patient.debitor_uuid WHERE debitor.uuid = ?'
};

var formatDollar = '$0,0.00',
    formatFranc = '0.0,00';

// compiles the patient receipt
exports.compile = function (options) {
  var context = {};
  var saleId = options.sale;

  context.i18n = (options.language == 'fr') ?
      require('../lang/fr.json').INVOICE :
      require('../lang/en.json').INVOICE;

  var currencyFmt = (options.currency === 'dollars') ?
      formatDollar : formatFranc;

  // Ensure mandatory options are set
  if (!saleId) {
    return q.reject('Document requires valid sale reference');
  }

  // TODO -- respect language options
  return db.exec(query.sale, [saleId])
  .then(function (rows) {
    var projectId;
    var invalidSaleRequest = rows.length === 0;

    if (invalidSaleRequest) {
      throw 'Invalid sale reference provided';
    }

    context.invoice = { items : rows };
    context.invoice.totalCost = numeral(sumCosts(rows)).format(currencyFmt);

    // TODO -- this should accept either FC or USD formatted currencies
    formatCurrency(context.invoice.items, currencyFmt);
    projectId = context.invoice.items[0].project_id;

    // Query for enterprise information
    return db.exec(query.enterprise, [projectId]);
  })
  .then(function (result) {
    var initialLineItem = context.invoice.items[0];
    context.enterprise = result[0];

    context.invoice.reference = initialLineItem.reference;
    context.invoice.id = initialLineItem.abbr.concat(initialLineItem.reference);
    context.invoice.date = initialLineItem.invoice_date.toDateString();

    // Query for recipient information
    return db.exec(query.recipient, [initialLineItem.debitor_uuid]);
  })
  .then(function (result) {
    context.recipient = result[0];
    return context;
  });
};

function sumCosts(lineItems) {
  return lineItems.reduce(function (a, b) { return a + b.credit - b.debit; }, 0);
}

// TODO -- this should format either FC or USD
function formatCurrency(lineItems, fmt) {
  lineItems.forEach(function (lineItem) {
    lineItem.formattedPrice = numeral(lineItem.transaction_price).format(fmt);
    lineItem.formattedTotal = numeral(lineItem.credit - lineItem.debit).format(fmt);
  });
}

