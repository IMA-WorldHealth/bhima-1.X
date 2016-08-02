// reports_proposed/data/stock_file.js
// Collects and aggregates data for the enterprise stock file

var q       = require('q');
var db      = require('../../../lib/db');
var util      = require('../../../lib/util');
var numeral = require('numeral');
var formatDollar = '$0,0.00';

exports.compile = function (options){
  'use strict';

  var i18nStockFile = require('../lang/fr.json').STOCK_FILE;
  var StockFileReportDate = new Date();
  var context = {}, deferred = q.defer();

  context.options = options;
  context.i18nStockFile = i18nStockFile;
  context.options.dateFromView = util.toMysqlDate(context.options.dateFrom);
  context.options.dateToView = util.toMysqlDate(context.options.dateTo);

  var sql_depot = 
    'SELECT * FROM depot WHERE uuid=?';

  var sql_entry = 
    'SELECT DATE_FORMAT(movement.date, "%m-%d-%Y") AS date , SUM(movement.quantity) AS quantity FROM movement JOIN stock ' + 
    'ON stock.tracking_number = movement.tracking_number ' +
    'WHERE movement.depot_entry=? and stock.inventory_uuid=? ' +
    'AND movement.date >=? AND movement.date <=? GROUP BY movement.date';

  var sql_out = 
    'SELECT DATE_FORMAT(t.date, "%m-%d-%Y") AS date, SUM(quantity) AS quantity FROM ' +
        '(SELECT consumption.quantity, consumption.date FROM ' +
        'consumption JOIN stock ON consumption.tracking_number = stock.tracking_number ' +
        'JOIN inventory ON inventory.uuid = stock.inventory_uuid ' +
        'WHERE consumption.canceled = 0 AND depot_uuid = ? AND inventory.uuid = ? ' +
        'AND consumption.date >=? AND consumption.date <=? ' +
        'UNION ALL ' +
        'SELECT movement.quantity, movement.date FROM movement JOIN stock ' +
        'ON movement.tracking_number = stock.tracking_number JOIN inventory ' +
        'ON inventory.uuid = stock.inventory_uuid WHERE movement.depot_exit= ? ' +
        'AND inventory.uuid= ? AND movement.date >=? AND movement.date <=?) ' +
        'AS t GROUP BY date;';

  function lineUp(){
    var data = [];

    context.entries.forEach(function (entry){
      data.push({ date : entry.date, entry : entry.quantity, out : lookup(entry.date)});
    });

    var unprocessedList = context.outs.filter(function (out){
      return !out.processed;
    });

    unprocessedList.forEach(function (out){
      data.push({ date : out.date, entry : 0, out : out.quantity});
    });

    data.sort(function(x, y){
      return new Date(x.date).setHours(0, 0, 0, 0) - new Date(y.date).setHours(0, 0, 0, 0);
    });

    context.total = data.reduce(function (x, y){
      x.totalEntry += y.entry;
      x.totalOut += y.out;

      return x;
    }, {totalEntry : 0, totalOut : 0});

    return q.when(data);
  }

  function lookup (date){
    var value = 0;
    var dateValue = new Date(date).setHours(0, 0, 0, 0);

    if(context.outs.length === 0) { return value; }

    for(var i= 0; i < context.outs.length; i++){

      if(dateValue === new Date(context.outs[i].date).setHours(0, 0, 0, 0)){
        value = context.outs[i].quantity;
        context.outs[i].processed = true;
        break;
      }
    }

    return value;
  }
  
  db.exec(sql_depot, [options.depotId])
  .then(function (depot){

    context.depot = depot[0];
    return db.exec(sql_entry, [options.depotId, options.inventory.uuid, new Date(options.dateFrom), new Date(options.dateTo)]);
  })
  .then(function (entries){
    context.entries = entries;
    return db.exec(sql_out, [
        options.depotId, options.inventory.uuid,
        new Date(options.dateFrom), new Date(options.dateTo),
        options.depotId, options.inventory.uuid,
        new Date(options.dateFrom), new Date(options.dateTo)
        ]);     
  })  
  .then(function (outs){
    context.outs = outs;
    return lineUp();    
  })
  .then(function (data){
    context.data = data;
    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();

  return deferred.promise;
}