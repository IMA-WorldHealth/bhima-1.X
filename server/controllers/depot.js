// scripts/lib/logic/depot.js

var q = require('q');

module.exports = function (db, sanitize, Store) {
  'use strict';

  // These routes are to investigate drugs in particular depots (or all).
  // URL root (/inventory/depot/:depotid/) {
  //    /drug/:code           => list of all lots of drug with code code
  //    /lot/:tracking_number => only details of the lot with tracking_number
  //    /lots                 => list of all drugs by lot
  //    /drugs                => lots of all drugs by code
  // }

  function findDrugsInDepot (array, depot) {
    // reduce quantities in an array of entry, exit depots
    // to give a total quantity for each depot for each
    // tracking_number

    // contains { tracking_number, quantity, expiration_date }
    var _depot, store = new Store({ identifier : 'tracking_number' });

    // depot ID is now a UUID
    _depot = depot;
    // _depot = Number(depot);

    array
    .filter(function (transaction) {
      var filterDepot = transaction.depot_entry === _depot || transaction.depot_exit === _depot;
      var filterEmpty = transaction.quantity > 0;

      return filterEmpty && filterDepot;
    })
    .forEach(function (transaction) {
      if (!store.get(transaction.tracking_number)) {
        store.post(transaction);
        // store.post({ tracking_number : transaction.tracking_number, lot_number : transaction.lot_number, stock_description : transaction.stock_description, quantity : transaction.quantity , code : transaction.code, expiration_date : transaction.expiration_date });
      }
      // var item = store.get(transaction.tracking_number);
      // item.quantity += transaction.depot_entry === _depot ? transaction.quantity : -1 * transaction.quantity;
    });

    return store;
  }

  function byLot (depot, id) {
    var sql, _depot, _id;

    _depot = sanitize.escape(depot);
    _id = sanitize.escape(id);

    sql =
      'SELECT stock.tracking_number, stock.lot_number, movement.depot_entry, movement.depot_exit, SUM(movement.quantity) AS quantity, ' +
        'stock.expiration_date, code, inventory.text as stock_description ' +
      'FROM inventory JOIN stock JOIN movement ON ' +
        'inventory.uuid = stock.inventory_uuid AND stock.tracking_number = movement.tracking_number ' +
      'WHERE (movement.depot_entry = ' + _depot + ' OR movement.depot_exit = ' + _depot + ') ' +
      'AND stock.tracking_number = ' + _id + ' ' +
      'GROUP BY stock.tracking_number;';

    return db.exec(sql)
    .then(function (rows) {
      var store = findDrugsInDepot(rows, depot);
      return q(store.data);
    });
  }

  function byCode (depot, code) {
    var sql, _depot, _code;

    _depot = sanitize.escape(depot);
    _code = sanitize.escape(code);

    sql =
      'SELECT stock.tracking_number, stock.lot_number, calculateMovement.depot_entry, calculateMovement.depot_exit, ' +
        'SUM(CASE WHEN calculateMovement.depot_entry =' + _depot + ' THEN calculateMovement.quantity ELSE -calculateMovement.quantity END) AS quantity, ' +
        'stock.expiration_date, code ' +
      'FROM inventory JOIN stock JOIN ' +
      // ' movement ON ' +
      '(SELECT uuid, depot_entry, depot_exit, tracking_number, quantity, date ' +
      'FROM movement ' +
      'UNION ' +
      'SELECT uuid, null as depot_entry, depot_uuid as depot_exit, tracking_number, quantity, date  ' +
      'FROM consumption) as calculateMovement ON ' +
        'inventory.uuid = stock.inventory_uuid AND stock.tracking_number = calculateMovement.tracking_number ' +
      'WHERE (calculateMovement.depot_entry = ' + _depot + ' OR calculateMovement.depot_exit = ' + _depot + ') ' +
      'AND inventory.code = ' + _code +
      'GROUP BY stock.tracking_number;';

    return db.exec(sql)
    .then(function (rows) {
      var store = findDrugsInDepot(rows, depot);
      return q(store.data);
    });
  }

  function byAllLots (depot) {
    var sql, _depot;

    _depot = sanitize.escape(depot);
    
    sql =
      'SELECT stock.tracking_number, stock.lot_number, calculateMovement.depot_entry, calculateMovement.depot_exit, ' +
        'SUM(CASE WHEN calculateMovement.depot_entry =' + _depot + ' THEN calculateMovement.quantity ELSE -calculateMovement.quantity END) AS quantity, ' +
        'stock.expiration_date, code, inventory.text as stock_description ' +
      'FROM inventory JOIN stock ' +
      'JOIN ' +
      
      // Model consumption as a movement from nothing, would be useful to know the difference between moved and consumed
      '(SELECT uuid, depot_entry, depot_exit, tracking_number, quantity, date ' +
      'FROM movement ' +
      'UNION ' +
      'SELECT uuid, null as depot_entry, depot_uuid as depot_exit, tracking_number, quantity, date  ' +
      'FROM consumption) as calculateMovement ON ' +
        'inventory.uuid = stock.inventory_uuid AND stock.tracking_number = calculateMovement.tracking_number ' +
      'WHERE calculateMovement.depot_entry = ' + _depot + ' OR calculateMovement.depot_exit = ' + _depot + ' ' +
      'GROUP BY stock.tracking_number ' +
      'ORDER BY stock.lot_number;';

    return db.exec(sql)
    .then(function (rows) {
      var store = findDrugsInDepot(rows, depot);
      return q(store.data);
    });
  }

  function byAllDrugs (depot) {
    var sql, _depot;

    _depot = sanitize.escape(depot);

    sql =
      'SELECT stock.tracking_number, movement.depot_entry, movement.depot_exit, SUM(stock.quantity) AS quantity, ' +
        'stock.expiration_date, code ' +
      'FROM inventory JOIN stock JOIN movement ON ' +
        'inventory.uuid = stock.inventory_uuid AND stock.tracking_number = movement.tracking_number ' +
      'WHERE (movement.depot_entry = ' + _depot + ' OR movement.depot_exit = ' + _depot + ') ' +
      'GROUP BY inventory.code ' +
      'ORDER BY inventory.code;';

    return db.exec(sql)
    .then(function (rows) {
      var store = findDrugsInDepot(rows, depot);
      return q(store.data);
    });

  }

  return function router (url, depot) {
    var routes, match, defer = q.defer();

    routes = [
      { re : /lot\/([0-9a-z\-]+)/ , fn : byLot },
      { re : /drug\/([0-9a-z\-]+)/, fn : byCode },
      { re : /lots/, fn : byAllLots },
      { re : /drugs/ , fn : byAllDrugs }
    ];

    routes.forEach(function (route) {
      match = route.re.exec(url);
      if (match) { defer.resolve(route.fn(depot, match[1])); }
    });

    if (!match) { defer.reject(new Error('No route found for url : ' + url)); }

    return defer.promise;
  };
};
