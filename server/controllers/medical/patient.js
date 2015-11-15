/**
 * @description 
 *
 * @returns
 *
 * @todo
 */
var db = require('../../lib/db'),
    uuid = require('../../lib/guid');

exports.create = create;
exports.details = details;
exports.list = list;
exports.search = search;

exports.verifyHospitalNumber = verifyHospitalNumber;

/*
 * HTTP Controllers
 */

// TODO Method handles too many operations
function create(req, res, next) { 
  var writeDebtorQuery, writePatientQuery;
  var invalidParameters;
  var patientText;

  var createRequestData = req.body;
  
  var medical = createRequestData.medical;
  var finance = createRequestData.finance;

  // Debtor group required for financial modelling
  invalidParameters = !finance || !medical;
  
    if (invalidParameters) { 
    
    // FIXME This should be handled by middleware
    res.status(400).json({
      code : 'ERROR.ERR_MISSING_INFO',
      reason : 'Both `financial` and `medical` information must be provided to register a patient'
    });
    return;
  }

  // Optionally allow client to specify UUID
  finance.uuid = finance.uuid || uuid();
  medical.uuid = medical.uuid || uuid();
  medical.debitor_uuid = finance.uuid;

  writeDebtorQuery = 'INSERT INTO debitor (uuid, group_uuid, text) VALUES ' +
    '(?, ?, ?)';

  writePatientQuery = 'INSERT INTO patient SET ?';
    
  var transaction = db.transaction();

  transaction
    .addQuery(writeDebtorQuery, [finance.uuid, finance.debtor_group_uuid, generatePatientText(medical)])
    .addQuery(writePatientQuery, [medical]);
  
  transaction.execute()
    .then(function (results) { 
      var createConfirmation = {};

      // All querys returned OK
      // Attach patient UUID to be used for confirmation etc. 
      createConfirmation.uuid = medical.uuid;
      createConfirmation.results = results;

      res.status(201).json(createConfirmation);
      return;
    })
    .catch(next)
    .done();
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
        return;
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

/**
 * @description Return a status object indicating if the hospital number has laready been registered 
 * with an existing patient 
 *
 * Returns status object 
 * { 
 *  registered : Boolean - Specifies if the id passed has already been registered or not
 *  details : Object (optional) - Includes the details of the registered hospital number
 *  }
 */
function verifyHospitalNumber(req, res, next) { 
  var verifyQuery;
  var hospitalNumber = req.params.id;

  verifyQuery = 
    'SELECT uuid, hospital_no FROM patient ' + 
      'WHERE hospital_no = ?';

  db.exec(verifyQuery, [hospitalNumber])
    .then(function (result) { 
      var hospitalIdStatus = {};

      if (isEmpty(result)) { 

        hospitalIdStatus.registered = false;
      } else { 

        hospitalIdStatus.registered = true;
        hospitalIdStatus.details = result[0];
      }

      res.status(200).json(hospitalIdStatus);
    })
    .catch(next)
    .done();
}

/**
 * Legacy Methods
 * TODO Remove or refactor methods to fit new API standards 
 */

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

    if (isEmpty(rows)) {
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

exports.visit = function (req, res, next) { 
  var visitData = req.body;
  
  logVisit(visitData, req.session.user.id)
    .then(function (result) { 

      // Assign patient ID as confirmation 
      result.uuid = visitData.uuid;

      res.status(200).send(result);
    })
    .catch(next)
    .done();
}

function logVisit(patientData, userId) {
  var sql;
  var visitId = uuid();
  
  sql =
    'INSERT INTO `patient_visit` (`uuid`, `patient_uuid`, `registered_by`) VALUES (?, ?, ?)';
  
  return db.exec(sql, [visitId, patientData.uuid, userId]);
};

function isEmpty(array) { 
  return array.length === 0;
}
