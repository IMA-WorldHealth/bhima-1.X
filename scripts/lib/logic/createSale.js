'use strict'
var q = require('q');

module.exports = (function(db, parser, journal) {

  function execute(saleData, userId, callback) {
    var saleRecord, saleItems, saleRecordId;
    var processedSale = false, processedSaleItems = false;

    saleRecord = saleData.sale;
    saleItems = saleData.saleItems;

    if(!(saleRecord && saleItems)) return callback(null, new Error("[createSale] Required data is invalid"));

    writeSaleRecord(saleRecord, userId)

    //writeSaleItems()
    .then(function(saleResult) {
      saleRecordId = saleResult.insertId;
      processedSale = true;
      return writeSaleItems(saleRecordId, saleItems);
    })

    //submitSaleJournal()
    .then(function(saleItemResult) {
      processedSaleItems = true;
      return submitSaleJournal(saleRecordId, saleData.caution, userId);
    })

    //returnCallback
    .then(function(saleSubmitResult) {
      callback(null, saleRecordId);

    }, function(error) {

      //send source error to client
      callback(error, null);

      //TODO Possible source of uncaught exceptions floating around unmanaged
      //TODO Very messy rollback code - console log structure can be replaced with actual logging
      //(client shouldn't be concerned with errors here)
      if(processedSaleItems) {
        console.log("[createSale] error occured, rolling back sale items");
        rollbackSaleItems(saleRecordId).then(function(result) {
          console.log("[createSale] rollback success, rollling back sale");
          rollbackSale(saleRecordId).then(function(result) {
            console.log("[createSale] rollback success, all transactions deleted");
          });
        });
      } else {
        if(processedSale) {
          rollbackSale(saleRecordId).then(function(result) { console.log('[createSale] rollback success'); });
        }
      }
    });
  }

  function writeSaleRecord(saleRecord, userId) {
    var insertSQL = parser.insert('sale', saleRecord), deferred = q.defer();
    saleRecord.seller_id =  userId;

    db.execute(insertSQL, function (error, result) {
      if(error) return deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  function writeSaleItems(saleRecordId, saleItems) {
    var deferred = q.defer(), insertItemsSQL;

    saleItems.forEach(function(saleItem) {
      saleItem.sale_id = saleRecordId;
    });
    insertItemsSQL = parser.insert('sale_item', saleItems);

    db.execute(insertItemsSQL, function (error, result) {
      if(error) return deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  function submitSaleJournal(saleRecordId, caution, userId) {
    var deferred = q.defer();

    journal.request('sale', saleRecordId, userId, function (error, result) {
      if(error) deferred.reject(error);
      deferred.resolve(result);
    }, caution);
    return deferred.promise;
  }

  function rollbackSale(saleRecordId) {
    var deleteSaleSQL = parser.delete('sale', 'id', saleRecordId);
    var deferred = q.defer();

    db.execute(deleteSaleSQL, function(error, result) {
      if(error) deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  function rollbackSaleItems(saleRecordId) {
    var deleteSaleItemsSQL = parser.delete('sale_item', 'sale_id', saleRecordId);
    var deferred = q.defer();

    db.execute(deleteSaleItemsSQL, function(error, result) {
      if(error) deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  return { execute : execute };
});
