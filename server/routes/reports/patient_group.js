// Patient Group + Price List combined report

var q = require('q'),
    qs = require('querystring');

module.exports = function (db) {
  'use strict';
  
  function fetchMembers(uuid) {
    // fetch the number of members in the current patient group.
    var sql =
      'SELECT COUNT(*) AS members FROM assignation_patient ' +
      'WHERE assignation_patient.patient_group_uuid = ?';

    return db.exec(sql, [uuid]);
  }

  function fetchPatientGroupAndPriceList(groupUuid) {
    // load the selected patient group
    var sql, result, data;
    sql =
      'SELECT pg.uuid, pg.created, pg.price_list_uuid, pg.name, pg.note, pl.title, ' +
        'pl.description, pli.is_discount, pli.description AS itemDescription, ' + 
        'pli.value, pli.is_global ' +
      'FROM patient_group AS pg JOIN price_list AS pl JOIN price_list_item AS pli ' +
        'ON pg.price_list_uuid = pl.uuid AND ' + 
        'pli.price_list_uuid = pl.uuid ' +
      'WHERE pg.uuid = ?';

    return db.exec(sql, [groupUuid])
    .then(function (rows) {
      result = rows[0];  // first row
     
      // format the data for easy client-side consumption
      data = {};

      data.group = {
        uuid        : result.uuid,
        description : result.note,
        name        : result.name,
        created     : result.created
      };

      data.pricelist = {
        uuid        : result.price_list_uuid,
        title       : result.title,
        description : result.description
      };

      // item details
      data.priceListDetails = rows.map(function (row)  {
        return {
          description : row.itemDescription,
          isDiscount  : row.is_discount,
          isGlobal    : row.is_global,
          value       : row.value
        };
      });

      return q(data);
    });
  }

  function loadPriceListItems(listUuid) {
    // load the exact items with their associated prices
    var sql, data;

    sql =
      'SELECT pli.uuid, pli.description, pli.is_discount, pli.is_global, ' +
        'pli.value, i.code, i.text, i.price, ig.name ' +
      'FROM price_list_item AS pli JOIN inventory AS i JOIN inventory_group AS ig ' +
        'ON pli.inventory_uuid = i.uuid AND ig.uuid = i.group_uuid ' +
      'WHERE pli.price_list_uuid = ?';

    return db.exec(sql, [listUuid])
    .then(function (rows) {
      data = {};

    });
  }

  function loadPriceForItem() {

  }

  return function router(params) {
    params = qs.parse(params);
    // routes the request
    
    var uuid = params.uuid;
    var body = {};
  
    return fetchPatientGroupAndPriceList(uuid)
    .then(function (data) {
      body = data;
      return fetchMembers(uuid);
    })
    .then(function (data) {
      body.group.members = data.pop().members;
      return q(body);
    });
  };
};
