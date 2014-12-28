var path        = require('path');
var fs          = require('fs');
var q           = require('q');

var dots        = require('dot').process({path : path.join(__dirname, 'templates')});
var wkhtmltopdf = require('wkhtmltopdf');
var numeral     = require('numeral');

var uuid        = require('./../../lib/guid');
var db          = require('./../../lib/db');

var config      = require('./config');

var writePath = path.join(__dirname, 'out/');

// HTTP Controllers 

// Serve a generated PDF - allowing cleanup of files following
exports.serve = function (req, res, next) {
  var target = req.params.target;
  var options = {root : writePath};
  
  console.log('serving a file');

  res.sendFile(target.concat('.pdf'), options, function (err) { 
    if (err) { 
      console.log(err);
      res.status(err.status).end();
    } else { 
      console.log('Sent :', target);

      // Delete file now
      fs.unlink(path.join(__dirname, 'out/').concat(target, '.pdf'), function (err) { 
        if (err) throw err;
        console.log('Removed and cleaned up report');
      });
    }
  });
};

exports.build = function (req, res, next) {  
  

  collectInvoiceData()
  .then(compileReport)
  .catch(function (err) { 
    console.log('top level', err);
  });

     
  function compileReport(reportData) { 
    var compiledReport = dots.invoice(reportData);
    
    var hash = uuid();
    var configuration = buildConfiguration(hash, req.params.size); 
     
    var pdf = wkhtmltopdf(compiledReport, configuration, function (code, signal) { 
      res.send('<a target="_blank" href="/report/serve/' + hash + '">Generated PDF</a');
    });
  }
};

function collectInvoiceData() { 
  var deferred = q.defer();
  var reportData = {};
  
  console.log('[collectInvoiceData]');

  // TODO This should be provided by the session (req)
  var enterpriseId = 200;
  
  // TODO This should be provided in the request
  var saleId = '1e012f69-c615-4df8-a85c-878099b857c1';

  reportData.path = __dirname;

  // Invoice receipt to test break point
  var saleQuery = 'SELECT * FROM sale_item LEFT JOIN sale ON sale_item.sale_uuid = sale.uuid LEFT JOIN inventory ON sale_item.inventory_uuid = inventory.uuid LEFT JOIN project ON sale.project_id = project.id WHERE sale.uuid = ? ORDER BY inventory.code';
  
  var enterpriseQuery = 'SELECT * FROM enterprise WHERE id = ?';

  var recipientQuery = 'SELECT * FROM debitor JOIN patient ON debitor.uuid = patient.debitor_uuid WHERE debitor.uuid = ?'; 

  // Query for sale information 
  db.exec(saleQuery, [saleId])
    .then(function (result) { 
      reportData.invoice = {items : result};
      reportData.invoice.totalCost = sumCosts(result);
      formatCurrency(reportData.invoice.items);

      console.log(result);
      
      // Query for enterprise information 
      return db.exec(enterpriseQuery, [enterpriseId]);
    })
    .then(function (result) { 
      var initialLineItem = reportData.invoice.items[0];
      reportData.enterprise = result[0];
      
      reportData.invoice.reference = initialLineItem.reference; 
      reportData.invoice.id = initialLineItem.abbr.concat(initialLineItem.reference);
      reportData.invoice.date = initialLineItem.invoice_date;

      // Query for recipient information 
      return db.exec(recipientQuery, [initialLineItem.debitor_uuid]);
    })
    .then(function (result) { 
      reportData.recipient = result[0];
      
      deferred.resolve(reportData); 
    })
    .catch(function (err) { 
      deferred.reject(err);
    });
  
  function sumCosts(lineItems) { 
    return lineItems.reduce(function (a, b) { return a + b.credit - b.debit; }, 0); 
  }

  function formatCurrency(lineItems) { 
    lineItems.forEach(function (lineItem) { 
      lineItem.formattedPrice = numeral(lineItem.transaction_price).format('$0,0.00');
      lineItem.formattedTotal = numeral(lineItem.credit - lineItem.debit).format('$0,0.00');
    });
  }

  return deferred.promise;
}

// Return configuration object for wkhtmltopdf process
function buildConfiguration(hash, size) { 
  var context = config[size] || config.standard;
  var hash = hash || uuid();
    
  context.output = writePath.concat(hash, '.pdf');
  return context;
}

function initialise() { 
  
  // Ensure write folder exists - wkhtmltopdf will silently fail without this
  
}
