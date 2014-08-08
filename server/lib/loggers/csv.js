var os = require('os');

module.exports = function CsvWriter(io, fields) {
  'use strict';

  this.writeHeader = function writeHeader() {
    io.write(fields.join(','));
  };

  this.writeContent = function writeContent() {
    var data = Array.prototype.slice.call(arguments)
      .join(',')
      .concat(os.EOL);
    io.write(data);
  };

  this.writeFooter = function writeFooter() {};
};
