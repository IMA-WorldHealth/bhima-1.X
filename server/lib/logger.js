// scripts/lib/database/logger.js
/* jshint unused : false */

// Module: Logger
// This module is responsible for logging all requests to
// the express server, plus requests to external (asynchronous)
// modules, such as the database connector.
//
// Logs look like:
// --------------------------------------------------------------------------
// | source | ip | uuid | timestamp | type |  description | status | userID |
// --------------------------------------------------------------------------

var fs = require('fs'),
    os = require('os');

/* Writers */
function HtmlWriter(io, fields) {
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
}

function CsvWriter(io, fields) {
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
}

function TabWriter(io, fields) {
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
}

function MarkdownWriter(io, fields) {
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
}

function getTime() {
  return new Date().toLocaleTimeString();
}

module.exports = function Logger (cfg, uuid) {
  'use strict';
  var types, headers, io, writer;

  if (!cfg) {
    throw new Error('No configuration file found!');
  }

  types = {
    'csv'      : CsvWriter,
    'html'     : HtmlWriter,
    'markdown' : MarkdownWriter,
    'tsv'      : TabWriter,
    'tab'      : TabWriter,
  };

  headers = [
    'SOURCE',
    'IP',
    'UUID',
    'TIMESTAMP',
    'METHOD',
    'DESCRIPTION',
    'TYPE',
    'USER'
  ];

  io = fs.createWriteStream(cfg.file + '.' + cfg.type);
  writer = new types[cfg.type](io, headers);
  writer.writeHeader();

  function request() {
    var source = 'HTTP';
    return function (req, res, next) {
      req.uuid = uuid();
      var userId = req.session ? req.session.user_id : null;
      writer.writeContent(source, req.ip, req.uuid, getTime(), req.method, decodeURI(req.url), null, userId);
      next();
    };
  }

  function external(source) {
    if (!source) {
      throw new Error('Must specify an external module in log.');
    }
    return function (uuid, desc, user_id) {
      writer.writeContent(source, null, uuid, getTime(), null, desc, null, user_id);
    };
  }

  function error() {
    var source = 'ERROR';
    return function (err, req, res, next) {
      var type = err.type || 404;
      var userId = req.session ? req.session.user_id : null;
      writer.writeContent(source, req.ip, req.uuid, getTime(), req.method, err.message, type, userId);
      next(err);
    };
  }

  function exit() {
    console.log('Cleaning up logger files');
  }

  return {
    request  : request,
    external : external,
    error    : error
  };
};
