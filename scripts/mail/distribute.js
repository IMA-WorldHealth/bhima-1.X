#!/usr/local/bin/node
var q = require('q');
var fs = require('fs');
var util = require('util');

var template = require('./lib/template.js');

var addressSource = "./conf/address_list.json";
var address = [];

// Move to configuration? 
var defaultLanguage = "en";

initialise();

function initialise() {
  
  util.log('[send.js] bhima mail deamon initialised.');
  
  template.read(addressSource)
  // .readConfiguration(configSource)
  .then(parseAddress)
  .then(sendMail);
}

// function readConfiguration(pathToFile) {}

function parseAddress(fileContent) {
  var content = JSON.parse(fileContent);
  
  util.log('[send.js] parsed address list [' + addressSource + ']');
  address = content;
  return q.resolve(address);
}

function sendMail(addressDetails) { 

  var instructions = [], recipients = Object.keys(addressDetails);
  
  recipients.forEach(function (recipient) {
    console.log('sending to', recipient);
  });
}

function buildReport(recipient, details) {
  
  // Verification
  if (!details.language) details.language = defaultLanguage;
  if (!details.address) throw new Error("Recipient " + recipient + " has no assigned address");
  
   
}



