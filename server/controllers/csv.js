var csv = require('csv');

module.exports.exportCSV = function (req, res, next) {
  var filename = req.params.filename;
  var data = req.body;

  csv.stringify(data, function(err, csvstr) {

    if (err) { 
      res.status(400).send('BAD CSV SYNTAX');
      }

    // Good data, send it to the user
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.writeHead(200, { 'Content-Type': 'text/csv' });
    res.write(csvstr);
    res.end();
    });

};
