var db = require('../lib/db');


// GET /purchaseorders
exports.getPurchaseOrders = function (req, res, next) {
  'use strict';

  var sql,
      status = req.query.status;

  // query base
  sql  = 'SELECT COUNT(uuid) AS count FROM purchase WHERE is_donation = 0';
  sql += ' AND (is_integration = 0 OR is_integration IS NULL)';

  switch (status) {

    // the purchase order is pending payment
    case 'pending':
      sql += ' AND paid = 0 AND confirmed = 0;';
      break;

    // the purchase order has been paid, but items have not been
    // shipped
    case 'paid':
      sql += ' AND paid = 1;';
      break;

    // the purchased items have been shipped, but have not
    // arrived in the warehouse yet
    case 'shipped':
      sql += ' AND closed = 0 AND confirmed = 1;';
      break;

    // the purchase order has been fulfilled with stock in the
    // warehouse.
    case 'delivered':
      sql += ' AND closed = 1 AND confirmed = 1;';
      break;

    default:
      sql += ';';
      break;
  }

  db.exec(sql)
  .then(function (rows) {
    res.status(200).send(rows);
  })
  .catch(next)
  .done();
};
