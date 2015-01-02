// Utility for generating fake patients in the database.
// USAGE: node patient.js

// NPM imports

// random name generator
var q = require('q');

// uuid generator
var uuid = require('./uuid');

// initialise the database connector
var db = require('../../server/lib/db');
db.initialise();

// Load Required Data
var nameGen = require('random-name');
var professions = require('./professions');
var companies = require('./companies');
var groupUuids = require('./groups');
var emails = require('./emails');
var religions = require('./religions');
var maritalStatus = require('./marital');


// Constants and Constraints

// Enterprise ID used throughout.
var ENTERPRISE = 200;

// Number of Patients to generate
var N = 1000;

// The namespace id to start at (e.g. HBB1300)
var IDX = 1300;

// meta data container
var meta = {
  'projects' : [],
  'villages' : [],
  'debtorGroups' : [],
};

// constraints for data generation
var constraints = {
  dates : {
    begin : new Date(1900, 0, 1), // Jan 1, 1900
    end : new Date(2014, 11, 1)   // Dec 1, 2014
  }
};


// Utility functions

// return a random date within the range
// of beginDate and endDate
function randomDate(beginDate, endDate) {
  var begin = Number(beginDate),
      end = Number(endDate),
      range = Math.abs(begin - end);

  return new Date(Math.random() * range + begin);
}

// Query the database to collect meta data for use
// in associating patients to enterprises, projects,
// etc.
function collectMetaData() {
  var projects =
    'SELECT id, name FROM project WHERE enterprise_id = ?';

  var villages =
    'SELECT uuid FROM village';
  
  var debtorGroups =
    'SELECT uuid FROM debitor_group JOIN account ON debitor_group.account_id = account.id ' +
    'WHERE account.enterprise_id = ?';

  return q.all([
    db.exec(projects, [ENTERPRISE]),
    db.exec(villages),
    db.exec(debtorGroups, [ENTERPRISE])
  ])
  .spread(function (projectIds, groupIds, villageIds) {
    meta.projects = projectIds;
    meta.debtorGroups = groupIds;
    meta.villages = villageIds;
    return q(meta);
  });
}

// return a random integer in the range [a, b).
function randomInt(a, b) {
  return Math.floor(Math.random() * b + a);
}

// return a random value from an array
function randomSample(array) {
  return array[randomInt(0, array.length)];
}

// chance (!) returns true 50% of the time
function chance() {
  return Math.random() > 0.5;
}

// Generating Functions

// generate the namespaced reference (e.g. 'HBB1');
function generateReference() {
  var project = randomSample(meta.projects);
  return project.name + IDX++;
}

// generate an email address
function generateEmail(fname) {
  return fname + '@' + randomSample(emails);
}

// generate a full name
function generateFullName() {
  return nameGen.first() + nameGen.last();
}

// generate a phone number
function generatePhone() {
  return 'xxxxxxxxxx'.replace(/x/g, function () { return randomInt(0, 10); });
}

// generate a patient
function patient(debtorUuid) {
  var fname = nameGen.first();

  var dob = randomDate(constraints.dates.begin, constraints.dates.end),
      regDate = new Date(Number(dob) + (Math.random() * 10000000000));

  return {
    uuid               : uuid(),
    reference          : generateReference(),
    debitor_uuid       : debtorUuid,
    creditor_uuid      : '',
    first_name         : fname,
    last_name          : nameGen.last(),
    dob                : dob,
    father_name        : generateFullName(),
    mother_name        : generateFullName(),
    profession         : randomSample(professions),
    employer           : randomSample(companies),
    spouse             : generateFullName(),
    spouse_profession  : randomSample(professions),
    spouse_employer    : randomSample(companies),
    sex                : chance() ? 'M' : 'F',
    religion           : randomSample(religions),
    marital_status     : '',
    phone              : generatePhone(),
    email              : generateEmail(fname),
    addr_1             : '',
    addr_2             : '',
    renewal            : 0,
    origin_locaton_id  : randomSample(meta.villages),
    current_locaton_id : randomSample(meta.villages),
    registration_date  : regDate
  };
}

// generate a debtor
function debtor() {
  var guid = uuid();
  return {
    uuid : guid,
  };
}

function generatePatients() {
  collectMetaData()
  .then(function (meta) {

  })
  .catch(function (error) {
    throw error;
  })
  .done();
}
