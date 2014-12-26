var path        = require('path');
var fs          = require('fs');
var q           = require('q');

var dots        = require('dot').process({path : path.join(__dirname, 'templates')});
var wkhtmltopdf = require('wkhtmltopdf');

var uuid = require('./../../lib/guid');
var db = require('./../../lib/db');

var config      = require('./config');

var writePath = path.join(__dirname, 'out/');

// HTTP Controllers 

// Serve a generated PDF - allowing cleanup of files following
exports.serve = function (req, res, next) {
  var target = req.params.target;
  var options = { 
    root : writePath
  };

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
 
  // Invoice receipt to test break point
  var saleQuery = "SELECT * FROM sale_item LEFT JOIN sale ON sale_item.sale_uuid = sale.uuid LEFT JOIN inventory ON sale_item.inventory_uuid = inventory.uuid WHERE sale.uuid = '1e012f69-c615-4df8-a85c-878099b857c1'";

  db.exec(saleQuery)
    .then(compileReport)
    .catch(function (err) { 
      console.log('err', err);
    });
  
  function compileReport(result) { 
    
    var reportData = { 
        invoice : result,
        path : __dirname
    };

    console.log(reportData.invoice);

    var compiledReport = dots.invoice(reportData);
    
    var hash = uuid();
    var context = buildConfiguration(hash); 
     
    var pdf = wkhtmltopdf(compiledReport, context, function (code, signal) { 
      res.send('<a href="/proof/of/concept/report/serve/' + hash + '">Generated PDF</a');
    });
  }
};

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
