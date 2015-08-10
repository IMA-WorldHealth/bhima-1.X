/* archiver.js
 *
 * Archives old emails by report type and date.
 */

var fs = require('fs'),
    path = require('path'),
    gzip = require('zlib').gzip;

function serializeDate(date) {
  return date.toISOString().split('T')[0];
}

// ensures a directory exists
// returns the path to it.
function ensure(target) {
  'use strict';
  var stats;

  try {
    stats = fs.lstatSync(target);

    if (!stats.isDirectory()) {
      fs.mkdirSync(target);
    }
  } catch (e) {
    fs.mkdirSync(target);
  }

  return target;
}


// must pass in date object in case email is a resend of an
// old email
function archiver(name, template, date) {
  'use strict';

  var target, stats, fname, buffer;

  // make the target path
  target = path.join(__dirname, '../archive/', serializeDate(date) + '/');

  // ensure the target directory exists
  ensure(target);

  // zip and write file
  fname = path.join(target, name + '.html.gz');

  gzip(template, function (err, gz) {
    if (err) {
      console.error('[Archiver]', 'Something terrible happened');
      return;
    }
    fs.writeFileSync(fname, gz);
  });

  return;
}


module.exports = archiver;
