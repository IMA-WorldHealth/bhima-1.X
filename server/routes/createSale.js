var q = require('q');

module.exports = function(db, parser, journal, uuid) {
  'use strict';

  //TODO Rollback logic can be implemented by sharing a transaction instance
  //(db.requestTransactionConnection) across multiple modules: generic top level
  //rollback.
  function execute(saleData, userId, callback) {
    var saleRecord = saleData.sale;
    var saleItems = saleData.saleItems;

    if(!(saleRecord && saleItems)) {
      return callback(null, new Error('[createSale] Required data is invalid'));
    }
    saleRecord.uuid = uuid();
    saleRecord.reference = 1; // FIXME required reference hack

    submitSaleRecords(saleRecord, saleItems, userId)
    .then(function () {
      return submitSaleJournal(saleRecord.uuid, saleData.caution, userId);
    })
    .then(function () {
      callback(null, saleRecord.uuid);
    })
    .catch(function (error) {
      callback(error, null);
    });
  }

  /*
   // FIXME: PATCH AT PAX
  function submitSaleRecords(saleRecord, saleItems, userId) {
    var querries = [
      generateSaleRecord(saleRecord, userId),
      generateSaleItems(saleRecord.uuid, saleItems)
    ];

    return db.executeAsTransaction(querries); 
  }
  */

  function submitSaleRecords(saleRecord, saleItems, userId) {
    console.log('[SUBMITSALE]', saleRecord, saleItems, userId);
    
    return db.exec(generateSaleRecord(saleRecord))
    .then(function (res) {
      console.log('[ReS]', res);
      return db.exec(generateSaleItems(saleRecord.uuid, saleItems));
    });
  }

  function submitSaleJournal(saleRecordId, caution, userId) {
    var deferred = q.defer();

    journal.request('sale', saleRecordId, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    }, caution);
    return deferred.promise;
  }

  function generateSaleRecord(saleRecord, userId) {
    saleRecord.seller_id = userId;
    return parser.insert('sale', saleRecord);
  }

  function generateSaleItems(saleRecordId, saleItems) {
    saleItems.forEach(function(saleItem) {
      saleItem.uuid = uuid();
      saleItem.sale_uuid = saleRecordId;
    });
    return parser.insert('sale_item', saleItems);
  }
  return { execute : execute };
};
