// patient controller

var db = require('../lib/db'),
    uuid = require('../lib/uuid');

// GET /patient/search/:uuid
// Performs a get on the patient uuid
exports.search = function (req, res, next) {
  'use strict';

  var sql, uuid = req.params.uuid;

  // compose the sql query
  sql =
    'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name ' +
      'p.sex, p.dob, p.origin_location_id, p.reference, proj.abbr, d.text, ' +
      'dg.account_id, dg.price_list_uuid, d.is_convention, d.locked ' +
    'FROM patient as p JOIN project as proj JOIN debitor as d JOIN debitor_group as dg ' +
    'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = project.id' +
    'WHERE p.uuid = ?;';

  db.exec(sql, [uuid])
  .then(res.json)
  .catch(next)
  .done();

};


// GET /patient/fuzzy/:match
// Performs fuzzy searching on patient names
exports.fuzzySearch = function (req, res, next) {

  var sql, match = req.params.match;

  if (!match) { next(new Error('No parameter provided!')); }

  // Do fuzzy searching on the match parameter
  sql =
    'SELECT p.uuid, p.project_id, p.debitor_uuid, p.first_name, p.last_name ' +
      'p.sex, p.dob, p.origin_location_id, p.reference, proj.abbr, d.text, ' +
      'dg.account_id, dg.price_list_uuid, d.is_convention, d.locked ' +
    'FROM patient as p JOIN project as proj JOIN debitor as d JOIN debitor_group as dg ' +
    'ON p.debitor_uuid = d.uuid AND d.group_uuid = dg.uuid AND p.project_id = project.id' +
    'WHERE SOUNDEX(p.first_name) = SOUNDEX(?) OR ' +
      'SOUNDEX(p.last_name) = SOUNDEX(?);';

  db.exec(sql, [match, match])
  .then(res.json)
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

  db.exec(sql, [uuid(), patientId, new Date(), req.session.user_id])
  .then(function () {
    res.send();
  })
  .catch(next)
  .done();
};

