var os = require('os');

module.exports = function HtmlWriter(io, fields) {
  'use strict';

  this.writeHeader = function writeHeader() {
    // document head
    io.write('<html><head>' + os.EOL);
    io.write('<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css">' + os.EOL);

    // styling
    io.write('<style>');
    io.write('td {padding:5px;} .rows td:nth-child(3){font-style:italic;} .rows td:nth-child(5){text-transform:uppercase;} .rows td:first-child{font-weight:bold;}');
    io.write('</style>');

    // document body
    io.write('</head><body>' + os.EOL);
    io.write('<table><thead>' + os.EOL);
    io.write('<tr><th class="columns">' + fields.join('</th><th>') + '</th></tr>' + os.EOL);
    io.write('</thead><tbody>' + os.EOL);
  };

  this.writeContent = function writeContent() {
    var data = Array.prototype.slice.call(arguments)
      .join('</td><td>');
    io.write('<tr class="rows"><td>' + data + '</td></tr>' + os.EOL);
  };

  this.writeFooter = function writeFooter() {
    io.write('</tbody></table></body></html>' + os.EOL);
  };
};
