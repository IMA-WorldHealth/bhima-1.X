var db = require('../lib/db');

exports.getConsumption = function (req, res, next) {
  'use strict';

  var sql, limit = req.query.limit ? Number(req.query.limit) : 10;

  sql =
    'SELECT topcons.text, SUM(topcons.quantity) AS quantity, topcons.uuid, topcons.inventory_uuid ' +
    'FROM ( ' +
      'SELECT inventory.text, SUM(consumption.quantity) AS quantity, inventory.uuid, stock.inventory_uuid ' +
      'FROM consumption ' +
      'JOIN stock ON stock.tracking_number = consumption.tracking_number ' +
      'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      'WHERE consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) ' +
      'GROUP BY stock.inventory_uuid ' +
    'UNION ' +
      'SELECT inventory.text, (SUM(consumption_reversing.quantity) * (-1)) AS quantity, inventory.uuid, stock.inventory_uuid ' +
      'FROM consumption_reversing ' +
      'JOIN stock ON stock.tracking_number = consumption_reversing.tracking_number ' +
      'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      'GROUP BY stock.inventory_uuid ' +
    ') AS topcons ' +
    'GROUP BY topcons.inventory_uuid ' +
    'ORDER BY topcons.quantity DESC, topcons.text ASC ' +
    'LIMIT ?;';

  db.exec(sql, [limit])
  .then(function (result) {
    res.send(result);
  })
  .catch(next)
  .done();
};

exports.listConsumptionDrugs = function (req, res, next) {
  'use strict';

  var sql, from = req.query.dateFrom,
      to = req.query.dateTo;

  sql =
    'SELECT dailycons.uuid,  SUM(dailycons.quantity) AS quantity, dailycons.date, dailycons.code, dailycons.text ' +
    'FROM ( ' +
      'SELECT inventory.uuid,  SUM(consumption.quantity) AS quantity, consumption.date, inventory.code, inventory.text ' +
      'FROM consumption ' +
      'JOIN stock ON stock.tracking_number = consumption.tracking_number ' +
      'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      'WHERE consumption.uuid NOT IN (SELECT consumption_loss.consumption_uuid FROM consumption_loss) ' +
        'AND (consumption.date >= DATE(?) AND consumption.date <= DATE(?)) ' +
      'GROUP BY inventory.uuid ' +
    'UNION ' +
      'SELECT inventory.uuid, ((SUM(consumption_reversing.quantity)) * (-1)) AS quantity, consumption_reversing.date, inventory.code, inventory.text ' +
      'FROM consumption_reversing ' +
      'JOIN stock ON stock.tracking_number = consumption_reversing.tracking_number ' +
      'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      'WHERE consumption_reversing.consumption_uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) ' +
        'AND ((consumption_reversing.date >= DATE(?)) AND (consumption_reversing.date <= DATE(?))) ' +
      'GROUP BY inventory.uuid) AS dailycons ' +
    'GROUP BY dailycons.uuid ORDER BY dailycons.text ASC;';

  db.exec(sql, [from, to, from, to])
  .then(function (result) {
    res.send(result);
  })
  .catch(next)
  .done();
};

exports.listItemByConsumption = function (req, res, next) {
  'use strict';

  var sql, code = req.query.code,
      from = req.query.dateFrom,
      to = req.query.dateTo ;

  sql =
    'SELECT itemconsumpt.uuid,  SUM(itemconsumpt.quantity) AS quantity, itemconsumpt.date, itemconsumpt.code, itemconsumpt.text ' +
    'FROM ( ' +
      'SELECT consumption.uuid,  SUM(consumption.quantity) AS quantity, consumption.date, inventory.code, inventory.text ' +
      'FROM consumption ' +
      'JOIN stock ON stock.tracking_number = consumption.tracking_number ' +
      'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      'WHERE consumption.uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) ' +
      'AND inventory.code =? AND ((consumption.date >= DATE(?)) ' +
      'AND (consumption.date <= DATE(?))) ' +
      'GROUP BY consumption.date ' +
    'UNION ' +
      'SELECT consumption_reversing.uuid, ((SUM(consumption_reversing.quantity)) * (-1)) AS quantity, consumption_reversing.date, inventory.code, inventory.text ' +
      ' FROM consumption_reversing ' +
      ' JOIN stock ON stock.tracking_number = consumption_reversing.tracking_number ' +
      ' JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
      ' WHERE consumption_reversing.consumption_uuid NOT IN ( SELECT consumption_loss.consumption_uuid FROM consumption_loss ) ' +
      ' AND inventory.code = ? AND ((consumption_reversing.date >= ?) ' +
      ' AND (consumption_reversing.date <= ?))' +
      ' GROUP BY consumption_reversing.date ) AS itemconsumpt GROUP BY itemconsumpt.date ;';

  db.exec(sql, [code, from, to, code, from, to])
  .then(function (rows) {
    res.send(rows);
  })
  .catch(next)
  .done();
};

/*
* GET /donations?limit=10
*
* Returns a list of the top donors by quantity
*/
exports.getRecentDonations = function (req, res, next) {
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
};

/*
* GET /stockalerts
*/
exports.getStockAlerts = function (req, res, next) {
  'use strict';

  var sql, data = {
    outtage : [],
    minimum : [],
    excess  : [],
    optimum : []
  };

  sql =
    'SELECT i.uuid, i.stock_min AS min, i.stock_max AS max, IFNULL(SUM(s.quantity), 0) AS quantity ' +
    'FROM inventory AS i LEFT OUTER JOIN stock AS s ' +
      'ON i.uuid = s.inventory_uuid ' +
    'GROUP BY i.uuid;';

  db.exec(sql)
  .then(function (rows) {

    // NOTE -- this is potentially an expensive blocking operation.  If too expensive,
    // chunk it into smaller peices.
    rows.forEach(function (item) {

      // Stock Outtage
      if (item.quantity === 0) { data.outtage.push(item.uuid); }

      // Under minimum preset value (but not out)
      if (item.quantity <= item.min && item.quantity !== 0) { data.minimum.push(item.uuid); }

      // Excess stock
      if (item.quantity > item.max) { data.excess.push(item.uuid); }

      // Optimum stock level --- TODO is this really necessary?
      if (item.quantity ===  item.max) { data.optimum.push(item.uuid); }
    });

    res.status(200).json(data);
  })
  .catch(next)
  .done();
};
