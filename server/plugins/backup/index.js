// backup.js
//
// author: Jonathan Niles
// date : January 8, 2015

var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    gzip = require('zlib').createGzip(),
    config = require(__dirname + '/config.json');

exports.run = function () {
  // read targets from config file
  var targets = config.targets;

  console.log('config is', config);

  // create subfolders for specific items
  var filesDir = path.join(config.destination, 'files'),
      dumpDir = path.join(config.destination, 'dump');

  // compress and copy the targets over into the 
  // destination
  fs.mkdir(filesDir, function (err) {

    // compress each file in targets into the destination
    targets.forEach(function (target) {
      compressTo(target, filesDir);
    });
  });

  fs.mkdir(dumpDir, function (err) {

    // spawn the mysqldump process
    var dump = mysqldump(config);

    // create 
    dump.stdin.pipe(gzip).pipe('bhima.sql.gz');
  });

};


// mysqldump -u root -pK3mb3J@m --databases bhima --add-drop-database --single-transaction --skip-comments --complete-insert > test.sql
function mysqldump(cfg) {
  'use strict';
  
  var credentials = cfg.mysqldump.credentials;

  // import configuration
  var user = '-u ' + credentials.user,
      pswd = '-p' + credentials.password,
      db = '--databases ' + credentials.database,
      args = [user, pswd, db].concat(cfg.mysqldump.args);

  // spawn a mysqldump instance
  return spawn('mysqldump', args);
}

// compresses a file to a destination as the
// original file name + '.gz'
function compressTo(input, destFolder) {

  // the file name is the original file name
  // pluse the '.gz' extension
  var fname = path.basename(input) + '.gz',
      out = path.resolve(destFolder, fname);

  // open, compress, and write out the file
  return src(input)
      .pipe(gzip)
      .pipe(dest(out));
}

// create  a readable stream
function src(file) {
  return fs.createReadStream(file);
}

// create a writeable stream
function dest(file) {
  return fs.createWriteStream(file);
}
