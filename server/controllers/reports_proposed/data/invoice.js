var db      = require('./../../../lib/db');

var q       = require('q');
var numeral = require('numeral');

var querry = { 
  
  sale : 'SELECT * FROM sale_item LEFT JOIN sale ON sale_item.sale_uuid = sale.uuid LEFT JOIN inventory ON sale_item.inventory_uuid = inventory.uuid LEFT JOIN project ON sale.project_id = project.id WHERE sale.uuid = ? ORDER BY inventory.code',

  enterprise : 'SELECT * FROM enterprise WHERE id = ?',

  recipient : 'SELECT * FROM debitor JOIN patient ON debitor.uuid = patient.debitor_uuid WHERE debitor.uuid = ?'

};

exports.buildContext = function () { 
  var deferred = q.defer();
  var reportData = {};

  // TODO This should be provided by the session (req)
  var enterpriseId = 200;
  
  // TODO This should be provided in the request
  var saleId = '1e012f69-c615-4df8-a85c-878099b857c1';

  // Query for sale information 
  db.exec(querry.sale, [saleId])
    .then(function (result) { 
      reportData.invoice = {items : result};
      reportData.invoice.totalCost = sumCosts(result);
      formatCurrency(reportData.invoice.items);

      console.log(result);
      
      // Query for enterprise information 
      return db.exec(querry.enterprise, [enterpriseId]);
    })
    .then(function (result) { 
      var initialLineItem = reportData.invoice.items[0];
      reportData.enterprise = result[0];
      
      reportData.invoice.reference = initialLineItem.reference; 
      reportData.invoice.id = initialLineItem.abbr.concat(initialLineItem.reference);
      reportData.invoice.date = initialLineItem.invoice_date;

      // Query for recipient information 
      return db.exec(querry.recipient, [initialLineItem.debitor_uuid]);
    })
    .then(function (result) { 
      reportData.recipient = result[0];
      
      deferred.resolve(reportData); 
    })
    .catch(function (err) { 
      deferred.reject(err);
    });
  
  return deferred.promise;
}

function sumCosts(lineItems) { 
  return lineItems.reduce(function (a, b) { return a + b.credit - b.debit; }, 0); 
}

function formatCurrency(lineItems) { 
  lineItems.forEach(function (lineItem) { 
    lineItem.formattedPrice = numeral(lineItem.transaction_price).format('$0,0.00');
    lineItem.formattedTotal = numeral(lineItem.credit - lineItem.debit).format('$0,0.00');
  });
}

