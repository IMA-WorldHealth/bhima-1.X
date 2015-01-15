// Utility for generating fake patients in the database.
// USAGE: node patient.js

// TODO
//   Each patient really needs to have one or multiple visits
//   associated with them.  This can either be done from this
//   utility or by a separate visit.js utility.

var q = require('q');
var fs = require('fs');
var uuid = require('./uuid'); // uuid generator
var nameGen = require('random-name'); // name generator
var util = require('./util');

// initialise the database connector
var db = require('../../server/lib/db');
db.initialise();

// Load sample data
var professions = require('./data/professions');
var companies = require('./data/companies');
var groupUuids = require('./data/groups');
var emails = require('./data/emails');
var religions = require('./data/religions');
var maritalStatus = require('./data/marital');

// CONSTANTS AND TEMPLATES

var templates = {
  debtor : 'INSERT INTO debitor (uuid, group_uuid, text) VALUES (?, ?, ?);\n',
  patient : 'INSERT INTO patient (' +
      'uuid, project_id, reference, debitor_uuid, creditor_uuid, first_name, last_name, dob, father_name, mother_name, profession, employer, spouse, ' +
      'spouse_profession, spouse_employer, sex, religion, marital_status, phone, email, addr_1 , addr_2, renewal, origin_location_id, current_location_id, ' +
      'registration_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);\n'
};


var ENTERPRISE = 200; // Enterprise ID used throughout.
var N = 1000;         // number of patients to generate
var IDX = 1300;       // The namespace id to start at (e.g. HBB1300)

// metadata container
var meta = {};

// constraints for date generation
var beginDate = new Date(1900, 0, 1), // Jan 1, 1900
    endDate = new Date(2014, 11, 1);  // Dec 1, 2014

// Generating Functions

// generate the namespaced reference (e.g. 'HBB1');
function generateReference(project) {
  return project.abbr + String(IDX++);
}

// generate an email address
function generateEmail(fname) {
  return fname + '@' + util.randomSample(emails);
}

// generate a full name
function generateFullName() {
  return nameGen.first() + ' ' + nameGen.last();
}

// generate a phone number
function generatePhone() {
  return 'xxxxxxxxxx'.replace(/x/g, function () { return util.randomInt(0, 10); });
}

// Utility functions

// Query the database to collect meta data for use
// in associating patients to enterprises, projects,
// etc.
function collectMetaData() {
  var projects =
    'SELECT id, abbr, name FROM project WHERE enterprise_id = ?';

  var villages =
    'SELECT uuid FROM village';

  return q.all([
    db.exec(projects, [ENTERPRISE]),
    db.exec(villages)
  ])
  .spread(function (projectIds, villageIds) {
    meta.projects = projectIds;
    meta.villages = villageIds;
    return q.when(meta);
  });
}


// generate a patient
function patient(debtorUuid, fname, lname) {

  var dob = util.randomDate(beginDate, endDate),
      regDate = new Date(Number(dob) + (Math.random() * 10000000000));

  var project = util.randomSample(meta.projects);

  return {
    uuid               : uuid(),
    project_id         : project.id,
    reference          : generateReference(project),
    debitor_uuid       : debtorUuid,
    creditor_uuid      : 'NULL',
    first_name         : fname,
    last_name          : lname,
    dob                : util.sqlDate(dob),
    father_name        : nameGen.first() + ' ' + lname,
    mother_name        : generateFullName(),
    profession         : util.randomSample(professions),
    employer           : util.randomSample(companies),
    spouse             : generateFullName(),
    spouse_profession  : util.randomSample(professions),
    spouse_employer    : util.randomSample(companies),
    sex                : util.chance() ? 'M' : 'F',
    religion           : util.randomSample(religions),
    marital_status     : util.randomSample(maritalStatus),
    phone              : generatePhone(),
    email              : generateEmail(fname),
    addr_1             : '',
    addr_2             : '',
    renewal            : 0,
    origin_locaton_id  : util.randomSample(meta.villages).uuid,
    current_locaton_id : util.randomSample(meta.villages).uuid,
    registration_date  : util.sqlDate(regDate)
  };
}

// gets the values from an object
function getObjectValues(object) {
  return Object.keys(object).map(function (k) { return object[k]; });
}

// template an array of values into a string
function template(string, array) {
  var i = 0;
  return string.replace(/\?/g, function (v, idx) {
    var str = array[i++];
    return str === 'NULL' ? str : '"' + str + '"';
  });
}

// generate a debtor
function debtor(fname, lname) {

  var person = {
    uuid : uuid(),
    group_uuid : util.randomSample(groupUuids),
    text : fname + ' ' + lname
  };
  
  return person;
}

// run it!
function generatePatients() {
  console.log('Generating', N, 'patients...');
  var contents = '';

  collectMetaData()
  .then(function () {
    var i = N;
    while (i > 0) {
      var fname = nameGen.first(),
          lname = nameGen.last();

      var d = debtor(fname, lname),
          p = patient(d.uuid, fname, lname);

      contents += template(templates.debtor, getObjectValues(d));
      contents += template(templates.patient, getObjectValues(p));
      i--;
    }

    console.log('Created', N, 'patients');

    fs.writeFileSync('patient.sql', contents);

    console.log('Wrote patient.sql');
    return;
  })
  .catch(function (error) {
    throw error;
  })
  .finally();
}

generatePatients();
