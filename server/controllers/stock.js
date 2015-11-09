var db = require('../lib/db');

exports.getRecentDonations = getRecentDonations;
exports.getStockEntry = getStockEntry;

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

/**
* GET /stock/entry?depot={}&start={}&end={}
* This function returns all stock entry which is for a given depot between the
* provided dates.
*
* @function getStockEntry
*/
function getStockEntry(req, res, next) {
  'use strict';

  var sql,
      options = req.query;

  sql = 'SELECT s.tracking_number, s.expiration_date, s.entry_date, s.lot_number, s.quantity, ' +
        'i.text, p.uuid, p.confirmed, m.document_id ' +
        'FROM stock s ' +
        'JOIN purchase p ON p.uuid = s.purchase_order_uuid ' +
        'JOIN inventory i ON i.uuid = s.inventory_uuid ' +
        'JOIN movement m ON m.tracking_number = s.tracking_number ' +
        'WHERE DATE(m.date) LIKE DATE(s.entry_date) AND (s.entry_date BETWEEN DATE(?) AND DATE(?)) AND m.depot_exit IS NULL ';

  sql += options.depot !== 'ALL' ? 'AND m.depot_entry = ? ' : '';
  sql += options.confirmed == 1 ? 'AND p.confirmed = 1' : '';
  sql += ';';

  db.exec(sql, [options.start, options.end, options.depot])
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}
