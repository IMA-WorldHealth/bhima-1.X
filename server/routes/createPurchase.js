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
  
  var mod = {};

  mod.run = function run(userId, data) {
    // Writes data to the primary_cash table
    // then the primary_cash_items table and
    // finally the posting_journal
    var primaryCashId = uuid();

    return _writeCash(primaryCashId, userId, data)
      .then(function () {
        return _writeCashItems(primaryCashId, userId, data);
      })
      .then(function () {
        return postToJournal(primaryCashId, userId);
      })
      .then(function () {
        return q(primaryCashId);
      });
  };

  function values(obj) {
    // get an array of an object's values
    // cannot wait for es6's Object.values(o);
    return Object.keys(obj).map(function (k) { return obj[k]; });
  }

  function _writeCash(primaryCashId, userId, data) {
    // write items to the primary_cash table
    var sql, params;
    sql =
      'INSERT INTO primary_cash ' +
        '(project_id, type, date, deb_cred_uuid, deb_cred_type, currency_id, ' +
        'cash_box_id, account_id, cost, description, origin_id, uuid, user_id) ' +
      'VALUES ' +
        '(?,?,?,?,?,?,?,?,?,?,?,?,?);';

    params = Object.keys(data).map(function (k) { return data[k]; });
    params.push(primaryCashId);
    params.push(userId);

    return db.exec(sql, params);
  }

  function _writeCashItems(primaryCashId, data) {
    var sql, queries, params;
    sql =
      'INSERT INTO `primary_cash_item` ' +
        '(inv_po_id, debit, credit, uuid, primary_cash_uuid) ' +
      'VALUES ' +
        '(?, ?, ?, ?, ?)';

    queries = data.map(function (item) {
      params = values(item);
      params.push(uuid());
      params.push(primaryCashId);
      return db.exec(sql, params);
    });

    return queries;
  }

  mod.execute = function execute(data, user, callback) {
    var primaryCashId = uuid();

    console.log('[DEBUG]', data);
    console.log('[DEBUG]', user);

    writeCash(primaryCashId, user, data.details)
    .then(writeCashItems(primaryCashId, data.transaction))
    .then(postToJournal(primaryCashId, user))
    .then(function (res) {
      console.log('[DEBUG]', res);
      res.primaryCashId = primaryCashId;
      callback(null, res);
    })
    .catch(callback);
  };

  function writeCash(uuid, user, details) {
    var insertSQL;

    details.uuid = uuid;
    details.user_id = user;

    insertSQL = parser.insert('primary_cash', details);

    return db.exec(insertSQL);
  }


  function writeCashItems(primaryCashId, transactions) {
    var insertSQL;
    var requests_item = [];

    transactions.forEach(function (transaction) {
      transaction.uuid = uuid();
      transaction.primaryCashId = primaryCashId;
      requests_item.push(parser.insert('primary_cash_item', transaction));
    });

    return requests_item.map(function (item) {
      return db.exec(item);
    });
  }

  function postToJournal(primaryCashId, userId) {
    var deferred = q.defer();
    journal.request('indirect_purchase', primaryCashId, userId, function (error, result) {
      if (error) {
        return deferred.reject(error);
      }
      return deferred.resolve(result);
    });
    return deferred.promise;
  }

  return mod;
};
