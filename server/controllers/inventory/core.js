/*
* Inventory Core Functions
*
* This file contains utility functions for common operations.
*
*/

var db = require('../../lib/db');

exports.getItemsMetadata = getItemsMetadata;
exports.getItemsMetadataById = getItemsMetadataById;
exports.hasBoth = hasBoth;

/**
* This function finds inventory metadata for all recorded inventory items.  The
* result is a JSON with inventory stock, type, and unit information.
*
* @function getItemsMetadata
* @return {Promise} Returns a database query promise
*/
function getItemsMetadata() {
  'use strict';

  var sql =
    'SELECT i.uuid, i.code, i.text AS label, i.price, iu.text AS unit, ' +
      'it.text AS type, ig.name AS groupName, i.consumable ' +
    'FROM inventory AS i JOIN inventory_type AS it ' +
      'JOIN inventory_unit AS iu JOIN inventory_group AS ig ON ' +
      'i.type_id = it.id AND i.group_uuid = ig.uuid AND ' +
      'i.unit_id = iu.id;';

  return db.exec(sql);
}

/**
* This function finds inventory metadata for a particular inventory item.  The
* result is a JSON with inventory stock, type, and unit information.
*
* @function getItemMetadata
* @param {String} uuid The inventory item identifier
* @return {Promise} Returns a database query promise
*/
function getItemsMetadataById(uuid) {
  'use strict';

  var sql =
    'SELECT i.uuid, i.code, i.text AS label, i.price, iu.text AS unit, ' +
      'it.text AS type, ig.name AS groupName, i.consumable ' +
    'FROM inventory AS i JOIN inventory_type AS it ' +
      'JOIN inventory_unit AS iu JOIN inventory_group AS ig ON ' +
      'i.type_id = it.id AND i.group_uuid = ig.uuid AND ' +
      'i.unit_id = iu.id ' +
    'WHERE i.uuid = ?;';

  return db.exec(sql, [uuid]);
}

/**
* Coerces values in to truth-y and false-y values.  Returns true if
* the result is equivalent.
*
* @function hasBoth
* @param m any value
* @param n any value
* @return {Boolean} Returns true if m and n are both truthy or both falsey
*/
function hasBoth(m, n) {
  /* jshint -W018 */
  return !m === !n;
}
