// scripts/lib/logic/drug.js

module.exports = function (db) {
  'use strict';

  return function router(code) {
    var sql =
      'SELECT inventory.code, inventory.text, tracking_number, expiration_date, entry_date, lot_number, quantity, ' +
        'inventory_group.code AS group_code, inventory.stock_min, inventory.stock_max ' +
      'FROM inventory JOIN stock JOIN inventory_group ' +
        'ON inventory.uuid = stock.inventory_uuid AND inventory_group.uuid = inventory.group_uuid ' +
      'WHERE inventory.code = ?;';

    return db.exec(sql, [code]);
  };
};
