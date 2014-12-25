
var path = require('path');
var dots        = require('dot').process(
        {path : path.join(__dirname, 'templates')});
var wkhtmltopdf = require('wkhtmltopdf');
var config = require('./config');
var q = require('q');
var fs = require('fs');

// TODO Convert to node module or specify relative path
var uuid = require('./../../lib/guid');

var writePath = path.join(__dirname, 'out/');

console.log('reports write path : ', writePath);

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

// HTTP Controller 
exports.build = function (req, res, next) {  
  
  var reportData = { 
      rows : new Array(100).toString().split(',').map(function (value, index) { return index; }),
      path : __dirname
  };

  var compiledReport = dots.invoice(reportData);
  
  var hash = uuid();
  var context = buildContext(hash); 
   
  // TODO Note this silently fails to write if an 'out' folder does not exist
  var pdf = wkhtmltopdf(compiledReport, context, function (code, signal) { 
    res.send('<a href="/proof/of/concept/report/serve/' + hash + '">Generated PDF</a');
  });
};

function buildContext(hash, size) { 
    var context = config[size] || config.standard;
    var hash = hash || uuid();
    
    context.output = writePath.concat(hash, '.pdf');
    //context.path = relativePath;
    
    console.log('returning context', context);
    return context;
}
