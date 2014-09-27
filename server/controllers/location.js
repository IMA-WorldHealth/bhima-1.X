// scripts/lib/logic/location.js

var q = require('q');

module.exports = function (db) {

  function location (villageId) {
    var fragment, sql;
    fragment = villageId ? ' AND `village`.`uuid`=\'' + villageId + '\'' : '';
    sql =
      'SELECT `village`.`uuid` as `uuid`,  `village`.`name` as `village`, ' +
        '`sector`.`name` as `sector`, `province`.`name` as `province`, ' +
        '`country`.`country_en` as `country` ' +
      'FROM `village`, `sector`, `province`, `country` ' +
      'WHERE village.sector_uuid = sector.uuid AND ' +
        'sector.province_uuid = province.uuid AND ' +
        'province.country_uuid=country.uuid ' + fragment + ';';

    return db.exec(sql);
  }

  function village () {
    var sql =
      'SELECT `village`.`uuid` AS `uuid`, `village`.`name` AS `village`, ' +
      '`sector`.`uuid` AS `sector_uuid`, `sector`.`name` as `sector` ' +
      'FROM `village`, `sector` ' +
      'WHERE village.`sector_uuid` = sector.uuid';
    return db.exec(sql);
  }

  function sector () {
    var sql =
      'SELECT `sector`.`uuid` as `uuid`, `sector`.`name` AS `sector`, `province`.`uuid` '+
      'AS `province_uuid`, `province`.`name` as `province` FROM `sector`, `province` '+
      'WHERE `sector`.`province_uuid` = `province`.`uuid`';
    return db.exec(sql);
  }

  function province () {
    var sql =
      'SELECT `province`.`uuid` as `uuid`,  `province`.`name` as `province`, `country`.`uuid` '+
      'AS `country_uuid`, `country`.`country_en` as `country_en`, `country`.`country_fr` as `country_fr` FROM `province`, `country` '+
      'WHERE `province`.`country_uuid` = `country`.`uuid`';
    return db.exec(sql);
  }

  var map = {
    'overview' : location,
    'village' : village,
    'sector' : sector,
    'province' : province
  };

  return function router (type, id) {
    return q(map[type])
    .then(function (bool) {
      if (!bool) { throw new Error('No route specified'); }
      return map[type](id);
    });
  };

};
