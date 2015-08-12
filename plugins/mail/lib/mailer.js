/**
 * mailer.js
 *
 * Responsible for delivery of a rendered HTML email to a
 * sender. Wraps the linux mail command in in a promise-type
 * framework.
 */

var path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),
    q = require('q');

// promisify the child_process.exec() function
function exec(command) {
  'use strict';

  var dfd = q.defer();

  cp.exec(command, function (error, result) {
    if (error) { return dfd.reject(error); }
    dfd.resolve(result);
  });

  return dfd.promise;
}


// list provides a namespace for the message
function mailer(list, contact, message, date) {
  'use strict';

  console.log('[MailPlugin]', 'Sending a message to', contact.address.toLowerCase());

  var timestamp = new Date(),
      command, reference;

  if (!date) {
    date = timestamp;
  }

  // compile a reference to the email
  reference = path.join(__dirname, '../queue/', list + '-' + contact.address.toLowerCase() + '-' + timestamp.toLocaleTimeString());

  // first, write the email to the queue
  fs.writeFileSync(reference, message, 'utf8');

  // build mail command (returns to slave email address)
  command = 'mail -r moblesshoard@gmail.com -a \'Content-type: text/html;\' -aFrom:moblesshoard@gmail.com -s \'' + date.toLocaleDateString() + '\' ' + contact.address +
    ' < ' + reference;

  // send the email
  return exec(command)
  .then(function () {
    console.log('[MailPlugin] Mail sent! Removing file...');

    // on successful completion, remove the file
    fs.unlinkSync(reference);

    console.log('[MailPlugin] ... done.');
  });
}

module.exports = mailer;
