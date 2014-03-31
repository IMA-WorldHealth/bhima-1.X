#!/usr/local/bin/node
var q = require('q');
var fs = require('fs');
var childProcess = require('child_process');
var util = require('util');

var template = require('./lib/template.js');

var addressSource = "./conf/address_list.json";
var address = [];

// Move to configuration? 
var defaultLanguage = "en";
var compiledReference = {};

// Should be passed by chron job
var service = "daily";

var reportDate = new Date();

initialise();

function initialise() {
  util.log('[send.js] bhima mail deamon initialised.');
  
  template.read(addressSource)
  // .readConfiguration(configSource)
  .then(parseAddress)
  .then(sendMail);
  
  // TODO Clean up files etc.
}

// function readConfiguration(pathToFile) {}

function parseAddress(fileContent) {
  var content = JSON.parse(fileContent);
  
  util.log('[send.js] parsed address list [' + addressSource + ']');
  address = content;
  return q.resolve(address);
}

function sendMail(details) { 
  var instructions = [], allRecipients = Object.keys(details), recipients = [];
  var languages = [defaultLanguage];
  var distributeStatus = [];

  allRecipients.forEach(function (recipient) {
    var userLanguage = details[recipient].language;
    
    // Validate recipient is subscribed to this service
    var subscribed = details[recipient].subscription.some(function (subscribedService) {
      if(subscribedService === service) return true;
      return false;
    });

    if (!subscribed) return util.log('[send.js] [WARNING] recipient ' + recipient + ' is not to subscribed to this service');
      
    // Add user and language preference
    recipients.push(recipient);
    if (languages.indexOf(userLanguage) < 0) languages.push(userLanguage);
  });
  
  compileReport(languages).then(function (compiledResult) {
    distributeStatus = recipients.map(function (recipient) {
      return distribute(recipient, details[recipient]);
    });
  });
}

function compileReport(languages) {
  var deferred = q.defer();
  var compileStatus = [];
  
  // TODO should check if the file exists before compiling - this should never be the case
  compileStatus = languages.map(function (language) {
    util.log('[send.js] compiling report [' + service + '] [' + language + ']');
    return exec('./mail.js ' + service + ' ' + language);
  });

  q.all(compileStatus).then(function (result) {
  
    // Read in compiled file locations
    languages.forEach(function (language, index) {
      compiledReference[language] = result[index].trim();
    });
    deferred.resolve(result);
  })
  .catch(function(error) {
    util.error(error);
  });

  return deferred.promise;
}

function distribute(recipient, details) {
  
  // Verification
  if (!details.language) details.language = defaultLanguage;
  if (!details.address) throw new Error("Recipient " + recipient + " has no assigned address");
  
  // TODO improve send command, this is just a proof of concept 
  var command = 'mail -a "Content-type: text/html;" -s "' + reportDate.toLocaleDateString() + '" ' + details.address + ' < ' + compiledReference[details.language];
  
  util.log('[send.js] [' + service + '] [' + details.language + '] -> ' + details.address);
  return exec(command);
}

// Utilities 
function exec(command) {
  var deferred = q.defer();
    
  childProcess.exec(command, function (error, result) {
    if (error) return deferred.reject(error);

    deferred.resolve(result);
  });
  return deferred.promise;
}
