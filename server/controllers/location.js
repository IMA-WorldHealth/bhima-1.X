// server/routes/location.js

module.exports = function (db, router) {
  'use strict';
  /* The Location API
  *
  * routes:
  *   /location/villages
  *   /location/sectors
  *   /location/provinces
  *   /location/village/:uuid
  *   /location/sector/:uuid
  *   /location/province/:uuid
  * 
  * Each endpoint returns a table with all information available.
  * Endpoints taking UUIDs return only the records matching the UUID
  */

  router.get('/villages', function (req, res, next) {
    var sql =
      'SELECT village.uuid, village.name, sector.name as sector_name, ' +
        'province.name as province_name, country.country_en as country_name ' +
      'FROM village JOIN sector JOIN province JOIN country ON ' +
        'village.sector_uuid = sector.uuid AND ' +
        'sector.province_uuid = province.uuid AND ' +
        'province.country_uuid = country.uuid;';

    db.exec(sql)
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();
  });

  router.get('/village/:uuid', function (req, res, next) {
    var sql =
      'SELECT village.uuid, village.name, sector.name as sector_name, ' +
        'province.name as province_name, country.country_en as country_name ' +
      'FROM village JOIN sector JOIN province JOIN country ON ' +
        'village.sector_uuid = sector.uuid AND ' +
        'sector.province_uuid = province.uuid AND ' +
        'province.country_uuid = country.uuid ' +
      'WHERE village.uuid = ?;';
    
    db.exec(sql, [req.params.uuid])
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();

  });

  router.get('/sectors', function (req, res, next) {
    var sql =
      'SELECT sector.uuid, sector.name, ' +
        'province.name as province_name, country.country_en as country_name ' +
      'FROM sector JOIN province JOIN country ON ' +
        'sector.province_uuid = province.uuid AND ' +
        'province.country_uuid = country.uuid;';

    db.exec(sql)
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();
  });

  router.get('/sector/:uuid', function (req, res, next) {
    var sql =
      'SELECT sector.uuid, sector.name, ' +
        'province.name as province_name, country.country_en as country_name ' +
      'FROM sector JOIN province JOIN country ON ' +
        'sector.province_uuid = province.uuid AND ' +
        'province.country_uuid = country.uuid ' +
      'WHERE sector.uuid = ?;';

    db.exec(sql, [req.params.uuid])
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();
  });

  router.get('/provinces', function (req, res, next) {
    var sql =
      'SELECT province.uuid, province.name, country.country_en as country_name ' +
      'FROM province JOIN country ON ' +
        'province.country_uuid = country.uuid;';

    db.exec(sql)
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();
  });

  router.get('/province/:uuid', function (req, res, next) {
    var sql =
      'SELECT province.uuid, province.name, country.country_en as country_name ' +
      'FROM province JOIN country ON ' +
        'province.country_uuid = country.uuid ' +
      'WHERE province.uuid = ?;';

    db.exec(sql, [req.params.uuid])
    .then(function (data) {
      res.send(data);
    })
    .catch(next)
    .done();
  });

  return router;
};
