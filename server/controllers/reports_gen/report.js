var dot         = require('dot');
var wkhtmltopdf = require('wkhtmltopdf');

// HTTP Controller 
exports.build = function (req, res, next) {  
  
  var reportTemplate = 
    "<head><style>table { font-size : 0.5; }</style></head>" +
    "<body>" + 
    "<table style='width : 100%;'> " + 
    "<thead><tr><th style='border : 1px solid black'>Number</th><th style='border : 1px solid black'>Letter</th></tr></thead>" + 
    "<tbody> " + 
    "{{ for (var row in it.rows) { }} " + 
    "<tr><td style='border : 1px black solid'>{{=row}}</td><td style='border : 1px solid black'>a</td></tr> " + 
    "{{ } }}" + 
    "</tbody></body>";
    
  
  var example = '<h1>Test</h1><p>Hello world</p>';

  var reportData = { rows : new Array(100).toString().split(',').map(function (value, index) { return index; }) };

  var reportMethod = dot.template(reportTemplate);
  
  var compiledReport = reportMethod(reportData);
  
  var pdf = wkhtmltopdf(compiledReport, {
      'output' : 'client/dest/pdf/out.pdf', 
      'page-size' : 'A5', 
      'orientation' : 'Landscape',
      'margin-left' : '0mm',
      'margin-right' : '0mm', 
      'margin-top' : '2mm', 
      'margin-bottom' : '2mm'
  }, function (code, signal) { 
    console.log('got', code, signal);
    res.send('<a href="/pdf/out.pdf">Generated PDF</a>');
  });
};

