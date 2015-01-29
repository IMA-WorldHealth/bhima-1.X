var csv = require('csv');

module.exports.exportCSV = function (req, res, next) {
  var filename = req.params.filename;  // filename MUST end in .csv

  csv.stringify(req.body, function(err, csvstr) {

    if (err) { 
      res.status(400).send('BAD CSV SYNTAX' + err);
    }

    // ??? csvstr = csvstr.replace(/"/g, '&quot;').replace(/\n/g, '<br/>');

    // Good data, send it to the user (as json)
    res.end(csvstr, 'UTF-8');
    });

};
