var db      = require('../../../../lib/db');

var q       = require('q');
var numeral = require('numeral');

var querry = { 
  
  sale : 'SELECT * FROM sale_item LEFT JOIN sale ON sale_item.sale_uuid = sale.uuid LEFT JOIN inventory ON sale_item.inventory_uuid = inventory.uuid LEFT JOIN project ON sale.project_id = project.id WHERE sale.uuid = ? ORDER BY inventory.code',

  enterprise : 'SELECT * FROM project JOIN enterprise on project.enterprise_id = enterprise.id WHERE project.id = ?',

  recipient : 'SELECT * FROM debitor JOIN patient ON debitor.uuid = patient.debitor_uuid WHERE debitor.uuid = ?'

};

var formatDollar = '$0,0.00';

exports.compile = function (options) { 
  var deferred = q.defer();
  var reportData = {};
  
  var saleId = options.sale;

  // Ensure mandatory options are set 
  if (!saleId) { 
    return q.reject('Document requires valid sale reference');
  }

  // Query for sale information 
  db.exec(querry.sale, [saleId])
    .then(function (result) { 
      var projectId;
      var invalidSaleRequest = result.length === 0;

      if (invalidSaleRequest) { 
        throw 'invalid sale reference provided';
      }

      reportData.invoice = {items : result};
      reportData.invoice.totalCost = sumCosts(result);
      
      formatCurrency(reportData.invoice.items);
      projectId = reportData.invoice.items[0].project_id;

      // Query for enterprise information 
      return db.exec(querry.enterprise, [projectId]);
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
      console.log('caught son');
      deferred.reject(err);
    });
  
  return deferred.promise;
}

function sumCosts(lineItems) { 
  return lineItems.reduce(function (a, b) { return a + b.credit - b.debit; }, 0); 
}

function formatCurrency(lineItems) { 
  lineItems.forEach(function (lineItem) { 
    lineItem.formattedPrice = numeral(lineItem.transaction_price).format(formatDollar);
    lineItem.formattedTotal = numeral(lineItem.credit - lineItem.debit).format(formatDollar);
  });
}

