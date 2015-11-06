
var db = require('../../lib/db');

exports.getInventoryLotsById = getInventoryLotsById;

/**
* Find all lots with stock remaining (postive quantiity) for a given inventory
* item.
*
* @function getInvetoryLotsById
* @returns {Promise} The database query
*/
function getInventoryLotsById(uuid) {
  'use strict';

  var sql;

  sql =
    'SELECT s.lot_number, (s.quanity - c.quantity) AS quantity ' +
    'FROM stock AS s JOIN consumption AS c ON ' +
      's.tracking_number = c.tracking_number ' +
    'WHERE s.uuid = ? AND quantity > 0;';

  return db.exec(sql, [uuid]);
}
