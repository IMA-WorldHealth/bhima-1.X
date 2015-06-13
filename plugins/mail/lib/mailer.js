/**
 * mailer.js
 *
 * Responsible for delivery of a rendered HTML email to a
 * sender.
 */

var path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),
    q = require('q');

// promisify the exec command
function exec(command) {
  'use strict';

  var deferred = q.defer();

  cp.exec(command, function (error, result) {
    if (error) { return deferred.reject(error); }
    deferred.resolve(result);
  });

  return deferred.promise;
}


function mailer(contact, message, date) {
  'use strict';

  var timestamp = new Date(),
      command, reference;

  if (!date) {
    date = timestamp;
  }

  // compile a reference to the email
  reference = path.join(__dirname, '../queue/', contact.address + ' ' + timestamp.toLocaleTimeString());

  // first, write the email to the queue
  fs.writeFileSync(reference, message, 'utf8');

  // build mail command
  command = 'mail -a \'Content-type: text/html;\' -s \'' + date.toLocaleDateString() + '\' ' + contact.address +
    ' < ' + reference;

  // send the email
  exec(command)
  .then(function () {

    // on successful completion, remove the file
    fs.unlinkSync(reference);
  })
  .catch(function (error) {
    throw error;
  });
}

module.exports = mailer;
