var q = require('q');
module.exports = function (db, parser, journal, uuid) {
  'use strict';

  // TODO Server side sale and purchase order are very similar, they should
  // probably be combined

  // TODO employee responsible for purchase, credited money from purchase request
  //      must be able to select them at purchase order

  // TODO create purchase order, expense cash, confirm recieving (work with overflow money)

  // TODO
  //  - Purchase price and sale price
  //  - On purchase order no money is moved
  //  - Move money from cash balance account to asset account (on authorisation of purchase)
  //  - On sale move money from asset account to expense account,
  //    credit sale account

  function execute(data, user, callback) {
    var primary_cash_uuid = uuid();

    writeCash(primary_cash_uuid, user, data.details)
    .then(writeCashItems(primary_cash_uuid, data.transaction))
    .then(postToJournal(primary_cash_uuid, user))
    .then(function (res) {
      res.primary_cash_uuid = primary_cash_uuid
      callback(null, res);
    })
    .catch(function (err) {
      return callback(err, null);
    });
  }

  function writeCash(uuid, user, details) {
    var insertSQL;

    details.uuid = uuid;
    details.user_id = user;

    insertSQL = parser.insert('primary_cash', details);

    return db.exec(insertSQL);
  }

  function writeCashItems(primary_cash_uuid, transactions) {
    var insertSQL;
    var requests_item = [];

    transactions.forEach(function (transaction) {
      transaction.uuid = uuid();
      transaction.primary_cash_uuid = primary_cash_uuid;
      requests_item.push(parser.insert('primary_cash_item', transaction));
    });

    return requests_item.map(function (item) {
      return db.exec(item);
    });
  }

  function postToJournal(primary_cash_uuid, userId) {
    var deferred = q.defer();
    journal.request('indirect_purchase', primary_cash_uuid, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    });
    return deferred.promise;
  }

  return { execute : execute };
};
