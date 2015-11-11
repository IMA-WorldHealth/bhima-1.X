/**
 * @description 
 *
 * @returns
 *
 * @todo
 */
var db = require('../../lib/db'),
    guid = require('../../lib/guid');

exports.create = create;
exports.details = details;
exports.list = list;
exports.search = search;

/*
 * HTTP Controllers
 */
function create(req, res, next) { 
  var writeDebtorQuery, writePatientQuery;
  var invalidParameters;
  var patientText;

  var patientData = req.body;

  // Verify that anything passed to the body is correct
  console.log('got uuid', patientData.uuid);
  console.log('got debtor uuid', patientData.debtorUuid);
  
  // FIXME This will fail with 0 (an invalid UUID)
  invalidParameters = !patientData.uuid || !patientData.debtorUuid;
  
    if (invalidParameters) { 
    
    // FIXME This should be handled by middleware
    res.status(400).json({
      code : 'ERROR.ERR_MISSING_INFO',
      reason : 'Both a valid patient uuid and patient debtor uuid must be defined to write a patient record'
    });
    return;
  }
  

  writeDebtorQuery = 'INSERT INTO debitor (uuid, group_uuid, text) VALUES ' +
    '(?, ?, ?)';

  writePatientQuery = 'INSERT INTO patient SET ?';
    
  db.exec(writeDebtorQuery, [patientData.debtorUuid, patientData.debtorGroupUuid, generatePatientText(patientData)])
    .then(function (result) { 
      console.log('debtor written');

      return db.exec(writePatientQuery, [patientData]);
    })
    .then(function (result) { 
      
      console.log('patient written');
      res.status(200).json(patientData);
    })
    .catch(next)
    .done();
    
  return;

  // Construct method/query to write debtor (transaction)
  
  // Construct method/query to write patient (transaction)

  // On failure rollback 

  // On success return id
}

function generatePatientText(patient) { 
  var textLineDefault = 'Patient/';
  return textLineDefault.concat(patient.last_name, '/', patient.middle_name);
}

function details(req, res, next) { 
  var patientDetailQuery;
  var uuid = req.params.uuid;
  
  patientDetailQuery =
    'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name, p.middle_name, ' +
      'p.sex, p.dob, p.origin_location_id, p.reference, proj.abbr, d.text, ' +
      'dg.account_id, dg.price_list_uuid, dg.is_convention, dg.locked ' +
    'FROM patient AS p JOIN project AS proj JOIN debitor AS d JOIN debitor_group AS dg ' +
    'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = proj.id ' +
    'WHERE p.uuid = ?';

  db.exec(patientDetailQuery, [uuid])
    .then(function(result) { 
      var patientDetail;

      if (isEmpty(result)) { 
        res.status(404).send();
      } else { 

        // UUID has matched patient - extract result and send to client
        patientDetail = result[0];
        res.status(200).json(patientDetail);
      }
    })
    .catch(next)
    .done();
}

function list(req, res, next) { 
  var listPatientsQuery; 
  
  listPatientsQuery =
    'SELECT p.uuid, CONCAT(pr.abbr, p.reference) AS patientRef, p.first_name, ' +
      'p.middle_name, p.last_name ' +
    'FROM patient AS p JOIN project AS pr ON p.project_id = pr.id';

  db.exec(listPatientsQuery)
  .then(function (result) {
    var patients = result;

    res.status(200).json(result);
  })
  .catch(next)
  .done();
}

function search(req, res, next) { 
  next();
}



/* Legacy Methods - these will be removed or refactored */

// assure the array is empty
function empty(array) {
  return array.length === 0;
}

// GET /patients
// Returns a list of all patients, stuffing the patient reference into a
// patientRef properly for human readability.
function getPatients(req, res, next) {
  var sql;

  sql =
    'SELECT p.uuid, CONCAT(pr.abbr, p.reference) AS patientRef, p.first_name, ' +
      'p.middle_name, p.last_name ' +
    'FROM patient AS p JOIN project AS pr ON p.project_id = pr.id';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

// GET /patient/:uuid
// Get a patient by uuid
exports.searchUuid = function (req, res, next) {
  'use strict';

  var sql, uuid = req.params.uuid;

  // compose the sql query
  sql =
    'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name, p.middle_name, ' +
      'p.sex, p.dob, p.origin_location_id, p.reference, proj.abbr, d.text, ' +
      'dg.account_id, dg.price_list_uuid, dg.is_convention, dg.locked ' +
    'FROM patient AS p JOIN project AS proj JOIN debitor AS d JOIN debitor_group AS dg ' +
    'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = proj.id ' +
    'WHERE p.uuid = ?;';

  db.exec(sql, [uuid])
  .then(function (rows) {

    // if the database cannot find the record
    // return a 404 'resource not found'
    if (empty(rows)) {
      res.status(404).send();
    } else {
      res.status(200).json(rows[0]);
    }
  })
  .catch(next)
  .done();
};

// GET /patient/search/reference/:reference
// Performs a search on the patient reference (e.g. HBB123)
exports.searchReference = function (req, res, next) {
  'use strict';

  var sql, reference = req.params.reference;

  // use MYSQL to look up the reference
  // TODO This could probably be optimized
  sql =
    'SELECT q.uuid, q.project_id, q.debitor_uuid, q.first_name, q.last_name, q.middle_name, ' +
      'q.sex, q.dob, q.origin_location_id, q.reference, q.text, ' +
      'q.account_id, q.price_list_uuid, q.is_convention, q.locked ' +
    'FROM (' +
      'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name, p.middle_name, ' +
      'p.sex, p.dob, CONCAT(proj.abbr, p.reference) AS reference, p.origin_location_id, d.text, ' +
      'dg.account_id, dg.price_list_uuid, dg.is_convention, dg.locked ' +
      'FROM patient AS p JOIN project AS proj JOIN debitor AS d JOIN debitor_group AS dg ' +
        'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = proj.id' +
    ') AS q ' +
    'WHERE q.reference = ?;';

  db.exec(sql, [reference])
  .then(function (rows) {

    if (empty(rows)) {
      res.status(404).send();
    } else {
      res.status(200).json(rows[0]);
    }

  })
  .catch(next)
  .done();

};

// GET /patient/search/fuzzy/:match
// Performs fuzzy searching on patient names
exports.searchFuzzy = function (req, res, next) {
  'use strict';

  var sql, match = req.params.match;

  if (!match) { next(new Error('No parameter provided!')); }

  // search on the match parameter
  sql =
    'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name,  p.middle_name, ' +
      'p.sex, p.dob, p.origin_location_id, p.reference, proj.abbr, d.text, ' +
      'dg.account_id, dg.price_list_uuid, dg.is_convention, dg.locked ' +
    'FROM patient AS p JOIN project AS proj JOIN debitor AS d JOIN debitor_group AS dg ' +
    'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = proj.id ' +
    'WHERE ' +
      'LEFT(LOWER(CONCAT(p.last_name, \' \', p.middle_name, \' \', p.first_name )), CHAR_LENGTH(?)) = ? OR ' +
      'LEFT(LOWER(CONCAT(p.last_name, \' \', p.first_name, \' \', p.middle_name)), CHAR_LENGTH(?)) = ? OR ' +
      'LEFT(LOWER(CONCAT(p.first_name, \' \', p.middle_name, \' \', p.last_name)), CHAR_LENGTH(?)) = ? OR ' +
      'LEFT(LOWER(CONCAT(p.first_name, \' \', p.last_name, \' \', p.middle_name)), CHAR_LENGTH(?)) = ? OR ' +
      'LEFT(LOWER(CONCAT(p.middle_name, \' \', p.last_name, \' \', p.first_name)), CHAR_LENGTH(?)) = ? OR ' +
      'LEFT(LOWER(CONCAT(p.middle_name, \' \', p.first_name, \' \', p.last_name)), CHAR_LENGTH(?)) = ? ' +
    'LIMIT 10;';

  // man. That's a lot of matches
  db.exec(sql, [match, match, match, match, match, match, match, match, match, match, match, match])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};


// POST /patient/visit/start
exports.startVisit = function (req, res, next) {
  'use strict';

  var sql, patientId = req.params.patientId;

  sql =
    'INSERT INTO patient_visit (uuid, patient_uuid, entry_date, registered_by) VALUES ' +
    '(?, ?, ?, ?);';

  db.exec(sql, [guid(), patientId, new Date(), req.session.user.id])
  .then(function () {
    res.status(200).send();
  })
  .catch(next)
  .done();
};

// FIXME Legacy patient visit feature needs designing or removing
exports.logVisit = function (req, res, next) {
  var sql, id = req.params.patientId;
  sql =
    'INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES (?, ?, ?);';

  db.exec(sql, [guid(), id, req.session.user.id])
  .then(function () {
    res.send();
  })
  .catch(next)
  .done();

};

function isEmpty(array) { 
  return array.length === 0;
}
