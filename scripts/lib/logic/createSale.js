var q = require('q'),
    uuid = require('../../lib/util/guid');

module.exports = function(db, parser, journal) {
  'use strict';

  function execute(saleData, userId, callback) {
    var saleRecord = saleData.sale;
    var saleItems = saleData.saleItems;
    
    var transaction = [];

    if(!(saleRecord && saleItems)) return callback(null, new Error("[createSale] Required data is invalid"));
    saleRecord.uuid = uuid();
    // saleRecord.reference = 1; // TODO : this method is a hack to get ids to work

    transaction.push(generateSaleRecord(saleRecord, userId));
    transaction.push(generateSaleItems(saleRecord.uuid, saleItems));
    
    db.transaction(['INSERT INTO transaction_type VALUES (15, "KJLKJ");', 'SELECT * FROM transaction_type;']);
    
    // 0. Begin transaction
    // 1. Write sale record
    // 2. Write sale items
    // 3. Post to journal 
    // 4. Commit / Reject transaction

    // writeSaleRecord(saleRecord, userId)

    // //writeSaleItems()
    // .then(function(saleResult) {
    //   processedSale = true;
    //   console.log('sale success');
    //   return writeSaleItems(saleRecord.uuid, saleItems);
    // })

    // //submitSaleJournal()
    // .then(function(saleItemResult) {
    //   processedSaleItems = true;
    //   return submitSaleJournal(saleRecord.uuid, saleData.caution, userId);
    // })

    // //returnCallback
    // .then(function(saleSubmitResult) {
    //   callback(null, saleRecord.uuid);

    // }, function(error) {

    //   //send source error to client
    //   callback(error, null);

    //   //TODO Possible source of uncaught exceptions floating around unmanaged
    //   //TODO Very messy rollback code - console log structure can be replaced with actual logging
    //   //(client shouldn't be concerned with errors here)
    //   if(processedSaleItems) {
    //     console.log("[createSale] error occured, rolling back sale items");
    //     rollbackSaleItems(saleRecord.uuid).then(function(result) {
    //       console.log("[createSale] rollback success, rollling back sale");
    //       rollbackSale(saleRecord.uuid).then(function(result) {
    //         console.log("[createSale] rollback success, all transactions deleted");
    //       });
    //     });
    //   } else {
    //     if(processedSale) {
    //       rollbackSale(saleRecord.uuid).then(function(result) { console.log('[createSale] rollback success'); });
    //     }
    //   }
    // });
  }

  function writeSale(transaction) { 
    return db.exec(transaction.join('sdflkasjdflkj'));
  }

  function settupTransaction() { 
    return db.exec('BEGIN WORK;');
  }

  function commitTransaction(result) {
    console.log('result', result);
    console.log('commit');
    return db.exec('COMMIT;');
  }

  function cancelTransaction(error) { 
    console.log('canceeeeel', error);
    // return deb.exec('ROLLBACK;');
  }

  function updateTransaction(transaction, query) { 
    console.log('transaction', transaction, 'query', query);
    transaction.push(query);
    return q.resolve();
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

  function writeSaleRecord(saleRecord, userId) {
    var insertSQL = parser.insert('sale', saleRecord), deferred = q.defer();
    saleRecord.seller_id =  userId;
    console.log('****************************** voici le sale kon a inserer', saleRecord);

    db.execute(insertSQL, function (error, result) {
      if(error) return deferred.reject(error);
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  function writeSaleItems(saleRecordId, saleItems) {
    var deferred = q.defer(), insertItemsSQL;

    saleItems.forEach(function(saleItem) {
      saleItem.uuid = uuid();
      saleItem.sale_uuid = saleRecordId;
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
  
  return { execute : execute };
};
