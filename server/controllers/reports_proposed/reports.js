var path        = require('path');
var fs          = require('fs');
var q           = require('q');

// Import and compile template files
var dots        = require('dot').process({path : path.join(__dirname, 'templates')});

var wkhtmltopdf = require('wkhtmltopdf');
var numeral     = require('numeral');
var uuid        = require('./../../lib/guid');
var config      = require('./config');

// Model compilation controllers 
var invoice     = require('./data/invoice');

// Module configuration 
var writePath = path.join(__dirname, 'out/');

exports.serve = function (req, res, next) {
  var target = req.params.target;
  var options = {root : writePath};
  
  res.sendFile(target.concat('.pdf'), options, function (err) { 
    if (err) { 
      console.log(err);
      res.status(err.status).end();
    } else { 

      // Delete (unlink) served file
      fs.unlink(path.join(__dirname, 'out/').concat(target, '.pdf'), function (err) { 
        if (err) throw err;
      });
    }
  });
};

exports.build = function (req, res, next) {  
  
  //var report = map[request]; report.buildContext()
  invoice.buildContext()
  .then(renderPDF)
  .catch(function (err) { 
    console.log(err);
    res.status(500).end();
  });

     
  function renderPDF(reportData) { 
    var compiledReport;
    var hash = uuid();
    var configuration = buildConfiguration(hash, req.params.size); 
    
    // Ensure templates have path data
    reportData.path = reportData.path || __dirname;
    compiledReport = dots.invoice(reportData);
    
    // TODO Handle exceptions
    var pdf = wkhtmltopdf(compiledReport, configuration, function (code, signal) { 
      res.send('<a target="_blank" href="/report/serve/' + hash + '">Generated PDF</a');
    });
  }
};

// Utility methods
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
