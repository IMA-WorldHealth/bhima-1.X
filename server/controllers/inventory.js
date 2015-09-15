/*
* This module contains the following routes:
*   /inventory/delays
*   /inventory/stock
*   /inventory/consumption
*   /inventory/:uuid/delays
*   /inventory/:uuid/stock
*   /inventory/:uuid/consumption
*
*   TODO
*   /inventory/alerts
*   /inventory/:uuid/alerts
*
* TODO
* I would like to have a breakdown of usage by service.  How do I do this?
* What is the best HTTP API for this sort of complex linked data?
*
* It is meant to be a high-level API to data about inventory data.
*
* As per REST conventions, the routes with a UUID return a single
* JSON instance or 404 NOT FOUND.  The others return an array of
* results.
*/

var db = require('../lib/db'),
    q  = require('q');

var core        = require('./inventory/core'),
    consumption = require('./inventory/consumption'),
    stock       = require('./inventory/stock');

// define the errors used in this module
var ERROR = {
  MISSING_PARAMETERS : {
    code   : 'ERR_MISSING_PARAMETERS',
    reason : 'When using date ranges, you must provide ' +
             'both a start and end date.'
  },
  NOT_FOUND : {
    code   : 'ERR_NOT_FOUND',
    reason : 'The inventory uuid requested was not found in the database'
  }
};

// exposed routes
exports.getInventoryItems = getInventoryItems;
exports.getInventoryItemsById = getInventoryItemsById;
exports.getInventoryConsumptionById = getInventoryConsumptionById;
exports.getInventoryConsumption = getInventoryConsumption;
exports.getInventoryStockLevelsById = getInventoryStockLevelsById;
exports.getInventoryStockLevels = getInventoryStockLevels;

/**
* GET /inventory/metadata
* Returns a description all inventory items in the inventory table.
*
* @function getInventoryItems
*/
function getInventoryItems(req, res, next) {
  'use strict';

  core.getItemsMetadata()
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/:uuid/metadata
* Returns a description of the item from the inventory table.
*
* @function getInventoryItemsById
*/
function getInventoryItemsById(req, res, next) {
  'use strict';

  var uuid = req.params.uuid;

  core.getItemsMetadataById(uuid)
  .then(function (rows) {
    if (!rows.length) {
      res.status(404).json(ERROR.NOT_FOUND);
    }

    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/:uuid/consumption
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*   average={0|1}
*
* Returns the consumption of a stock by the inventory item.
*/
function getInventoryConsumptionById(req, res, next) {
  'use strict';

  var data,
      uuid = req.params.uuid,
      options = req.query;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  // get the consumption
  core.getItemsMetadataById(uuid)
  .then(function (rows) {
    if (!rows.length) {
      throw ERROR.NOT_FOUND;
    }

    // cache results
    data = rows[0];

    // query consumption data
    return options.average ?
      consumption.getAverageItemConsumption(uuid, options) :
      consumption.getItemConsumption(uuid, options);
  })
  .then(function (rows) {
    data.consumption = options.average ? rows[0].average : rows;
    res.status(200).json(data);
  })
  .catch(function (error) {
    if (error.code === 'ERR_NOT_FOUND') {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    // handle database error generically
    next(error);
  })
  .done();
}

/*
* GET /inventory/consumption
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*
* Returns the consumption of a stock by the inventory item.
*/
function getInventoryConsumption(req, res, next) {
  'use strict';

  var data,
      uuid = req.params.uuid,
      options = req.query;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  core.getItemsMetadata()
  .then(function (rows) {

    // cache rows
    data = rows;

    // loop through all inventory items, calculating the consumption for each
    return q.all(data.map(function (item) {
      return options.average ?
        consumption.getAverageItemConsumption(item.uuid, options) :
        consumption.getItemConsumption(item.uuid, options);
    }));
  })
  .then(function (rows) {

    // FIXME - I'm not entirely sure this works in every scenario,
    // remove this if you know the answer.

    // Loop through the original array and associate promises (consumptions)
    // with the original inventory value
    data.forEach(function (item, idx) {
      item.consumption = rows[idx];
    });

    // return to client
    res.status(200).json(data);
  })
  .catch(next)
  .done();
}


/*
* GET /inventory/:uuid/delay
*
* Calculates the delivery delay associated with purchases on a
* single inventory item.  Also known as the "Lead Time".
*/
exports.getInventoryDelayById = function (req, res, next) {
  'use strict';

  var sql, id = req.params.uuid;

  sql =
    'SELECT ROUND(AVG(CEIL(DATEDIFF(s.entry_date, p.purchase_date)))) AS days ' +
    'FROM purchase AS p JOIN stock AS s JOIN purchase_item AS z JOIN inventory AS i ON ' +
      'p.uuid = s.purchase_order_uuid AND ' +
      's.inventory_uuid = i.uuid AND ' +
      'p.uuid = z.purchase_uuid ' +
    'WHERE z.inventory_uuid = s.inventory_uuid AND i.uuid = ?;';

  db.exec(sql, [id])
  .then(function (rows) {
    if (!rows.length) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    res.status(200).send(rows[0]);
  })
  .catch(next)
  .done();
};


/*
* GET /inventory/delays
*
* Calculates the delivery delay associated with purchases on all
* inventory items.  Also known as the "Lead Time".
*/
exports.getInventoryDelay = function (req, res, next) {
  'use strict';

  var sql;

  sql =
    'SELECT i.uuid, ROUND(AVG(CEIL(DATEDIFF(s.entry_date, p.purchase_date)))) AS days ' +
    'FROM purchase AS p JOIN stock AS s JOIN purchase_item AS z JOIN inventory AS i ON ' +
      'p.uuid = s.purchase_order_uuid AND ' +
      's.inventory_uuid = i.uuid AND ' +
      'p.uuid = z.purchase_uuid ' +
    'WHERE z.inventory_uuid = s.inventory_uuid;';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).send(rows);
  })
  .catch(next)
  .done();
};

/**
* GET /inventory/stock
* Returns the inventory stock levels for a certain inventory item.
*
* TODO
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*/
function getInventoryStockLevels(req, res, next) {
  'use strict';

  var sql,
      options = req.query;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  stock.getStockLevels(options)
  .then(function (rows) {

    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/:uuid/stock
* Returns the inventory levels for a certain inventory item.
*
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*/
function getInventoryStockLevelsById(req, res, next) {
  'use strict';

  var sql,
      options = req.query,
      uuid = req.params.uuid;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  stock.getStockLevelsById(uuid, options)
  .then(function (rows) {

    // in case there are no records, make one up.  This makes sense for items
    // that have never been pruchases.  If they have been purchased, rows would
    // not be empty.
    if (!rows.length) {
      return res.status(200).json({ uuid : uuid, quantity : 0 });
    }

    res.status(200).json(rows[0]);
  })
  .catch(next)
  .done();
}
