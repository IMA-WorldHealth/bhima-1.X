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
  // console.log('list : ', list, 'contact : ', contact, 'message : ', message, 'date :', date);

  console.log('[MailPlugin]', 'Sending a message to', contact.address.toLowerCase());

  var timestamp = new Date(),
      command, reference;

  if (!date) {
    date = timestamp;
  }

  //testing queue directory existence


  reference = path.join(__dirname, '../queue/');

  fs.exists(reference, function (exist){
    if(!exist){
      fs.mkdirSync(reference);
    }


    // compile a reference to the email
    reference += list + '-' + contact.address + '-' + timestamp.toLocaleTimeString(); 

    // first, write the email to the queue
    fs.writeFileSync(reference, message, 'utf8');

    // build mail command
    command = 'mail -a \'Content-type: text/html;\' -s \'' + date.toLocaleDateString() + '\' ' + contact.address +
      ' < ' + reference;

    // send the email
    return exec(command)
    .then(function () {
      console.log('[MailPlugin] Mail sent! Removing file...');

      // on successful completion, remove the file
      fs.unlinkSync(reference);

      console.log('[MailPlugin] ... done.');
    })
    .catch(function (err){
      console.log('error : ', err);
    });
  });
}

module.exports = mailer;
