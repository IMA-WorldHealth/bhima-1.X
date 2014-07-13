var os = require('os');

module.exports = function MarkdownWriter(io, fields) {
  'use strict';

  this.writeHeader = function writeHeader() {
    var content = '| ' + fields.join(' | ') + ' |' + os.EOL;
    var decoration = new Array(content.length)
      .join('-')
      .concat(os.EOL);

    io.write(decoration);
    io.write(content);
    io.write(decoration);
  };

  this.writeContent = function writeContent() {
    var data = Array.prototype.slice.call(arguments)
      .join(' | ');
    io.write('| ' + data + ' |' + os.EOL);
  };

  this.writeFooter = function writeFooter() {
    var content = '| ' + fields.join(' | ') + ' |';
    var decoration = new Array(content.length)
      .join('-')
      .concat(os.EOL);
    io.write(decoration);
  };
};
