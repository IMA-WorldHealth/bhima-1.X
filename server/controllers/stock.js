var db = require('../lib/db');

exports.getRecentDonations = getRecentDonations;

/*
* GET /donations?limit=10
*
* Returns a list of the top donors by quantity
*/
function getRecentDonations(req, res, next) {
  'use strict';

  // FIXME - why was this sent as a string?
  var sql, limit = req.query.limit ? Number(req.query.limit) : 10;

  sql =
    'SELECT donations.uuid, donor.name AS donorname, donations.date, COUNT(donation_item.tracking_number) AS items ' +
    'FROM donations JOIN donation_item JOIN donor ON ' +
      'donor.id = donations.donor_id AND ' +
      'donations.uuid = donation_item.donation_uuid ' +
    'GROUP BY donations.uuid ' +
    'ORDER BY items DESC ' +
    'LIMIT ?;';

  db.exec(sql, [limit])
  .then(function (rows) {
    res.status(200).send(rows);
  })
  .catch(next)
  .done();
}
