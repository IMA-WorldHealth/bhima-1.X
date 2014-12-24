var dot         = require('dot');
var wkhtmltopdf = require('wkhtmltopdf');

// HTTP Controller 
exports.build = function (req, res, next) {  
  
  var reportTemplate = 
    "<table style='width : 100%;'> " + 
    "<thead><tr><th style='border : 1px solid black'>Number</th><th style='border : 1px solid black'>Letter</th></tr></thead>" + 
    "<tbody> " + 
    "{{ for (var row in it.rows) { }} " + 
    "<tr><td style='border : 1px black solid'>{{=row}}</td><td style='border : 1px solid black'>a</td></tr> " + 
    "{{ } }}" + 
    "</tbody>";
  
  var reportData = { rows : new Array(100).toString().split(',').map(function (value, index) { return index; }) };

  var reportMethod = dot.template(reportTemplate);
  
  var compiledReport = reportMethod(reportData);
  
  var pdf = wkhtmltopdf(compiledReport).pipe(res);
  console.log('got pdf', pdf);
  res.send(compiledReport);
  
};
