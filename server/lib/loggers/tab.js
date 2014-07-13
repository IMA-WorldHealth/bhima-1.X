var os = require('os');

module.exports = function TabWriter(io, fields) {
  'use strict';

  this.writeHeader = function writeHeader() {
    io.write(fields.join('\t'));
  };

  this.writeContent = function writeContent() {
    var data = Array.prototype.slice.call(arguments)
      .join('\t')
      .concat(os.EOL);
    io.write(data);
  };

  this.writeFooter = function writeFooter() {};
};
