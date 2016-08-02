// reports_proposed/data/bilan.js
// Collects and aggregates data for the enterprise bilan

var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');
var formatDollar = '$0,0.00';

exports.compile = function (options){
  'use strict';

  var context = {}, deferred = q.defer();

  var sql_entry = 
    'SELECT movement.date, SUM(movement.quantity) AS total FROM movement JOIN stock ' + 
    'ON stock.tracking_number = movement.tracking_number ' +
    'WHERE movement.depot_entry=? and stock.inventory_uuid=? ' +
    'AND movement.date >=? AND movement.date <=? GROUP BY movement.date';

  var sql_out = 
    'SELECT * FROM consumption JOIN';
  
  db.exec(sql_entry, [options.depotId, options.inventory.uuid, new Date(options.dateFrom), new Date(options.dateTo)])
    .then(function(entries){

      console.log(entries);

      deferred.resolve(entries);
    })
    .catch(deferred.reject)
    .done();


  console.log(options);
  context.options = options;

  return deferred.promise;
}