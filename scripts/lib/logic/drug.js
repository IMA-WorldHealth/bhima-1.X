// scripts/lib/logic/drug.js

var sanitize = require('../util/sanitize');


module.exports = function (db) {
  'use strict';

  return function router (code) {
    var sql, _code;
 
    _code = sanitize.escape(code);

    sql =
      "SELECT inventory.code, inventory.text, tracking_number, expiration_date, entry_date, lot_number, quantity, " +
        "inventory_group.code AS group_code, inventory.stock_min, inventory.stock_max " +
      "FROM inventory JOIN stock JOIN inventory_group " +
        "ON inventory.uuid = stock.inventory_uuid AND inventory_group.uuid = inventory.group_uuid " +
      "WHERE inventory.code = " + _code + ";";

    return db.exec(sql);
  };
};
