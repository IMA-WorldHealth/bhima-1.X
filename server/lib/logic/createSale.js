var q = require('q'),
    uuid = require('../../lib/util/guid');

module.exports = function(db, parser, journal) {
  'use strict';
  
  //TODO Rollback logic can be implemented by sharing a transaction instance
  //(db.requestTransactionConnection) across multiple modules: generic top level
  //rollback.
  function execute(saleData, userId, callback) {
    var saleRecord = saleData.sale;
    var saleItems = saleData.saleItems;
    
    if(!(saleRecord && saleItems)) return callback(null, new Error("[createSale] Required data is invalid"));
    saleRecord.uuid = uuid();
    saleRecord.reference = 1; // FIXME required reference hack
    
    submitSaleRecords(saleRecord, saleItems, userId)
    .then(function (result) { 
      return submitSaleJournal(saleRecord.uuid, saleData.caution, userId);
    })
    .then(function (result) { 
      callback(null, saleRecord.uuid);   
    })
    .catch(function (error) { 
      callback(error, null);
    });
  }

  function submitSaleRecords(saleRecord, saleItems, userId) { 
    var querries = [
      generateSaleRecord(saleRecord, userId),
      generateSaleItems(saleRecord.uuid, saleItems)
    ];

    return db.executeAsTransaction(querries);
  }

  function submitSaleJournal(saleRecordId, caution, userId) {
    var deferred = q.defer();

    journal.request('sale', saleRecordId, userId, function (error, result) {
      if (error) return deferred.reject(error);
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
