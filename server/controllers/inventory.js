/**
* This module contains the following routes:
*   /inventory/consumption
*   /inventory/expiration
*   /inventory/leadtimes
*   /inventory/metadata
*   /inventory/:uuid/consumption
*   /inventory/:uuid/expiration
*   /inventory/:uuid/leadtimes
*   /inventory/:uuid/metadata
*   /inventory/:uuid/stock
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
    stock       = require('./inventory/stock'),
    expirations = require('./inventory/expiration'),
    leadtimes   = require('./inventory/leadtimes'),
    alerts      = require('./inventory/alerts');

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
  },

  NO_STOCK : {
    code   : 'ERR_NO_STOCK',
    reason : 'No stock was found for the provided inventory uuid.'
  }
};

// exposed routes
exports.getInventoryItems = getInventoryItems;
exports.getInventoryItemsById = getInventoryItemsById;

exports.getInventoryConsumptionById = getInventoryConsumptionById;
exports.getInventoryConsumption = getInventoryConsumption;

exports.getInventoryStockLevelsById = getInventoryStockLevelsById;
exports.getInventoryStockLevels = getInventoryStockLevels;

exports.getInventoryExpirations = getInventoryExpirations;
exports.getInventoryExpirationsById = getInventoryExpirationsById;

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

    res.status(200).json(rows[0]);
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

/**
* GET /inventory/:uuid/leadtimes
* Calculates the lead time (delivery delay) associated with purchases on a
* single inventory item.
*/
exports.getInventoryLeadTimesById = function (req, res, next) {
  'use strict';

  var uuid = req.params.uuid,
      options = req.query;

  leadtimes.getInventoryLeadTimesById(uuid, options)
  .then(function (rows) {
    if (!rows.length) {
      return res.status(404).json(ERROR.NO_STOCK);
    }
    res.status(200).send(rows[0]);
  })
  .catch(next)
  .done();
};


/**
* GET /inventory/:uuid/leadtimes
* Calculates the lead time (delivery delay) associated with purchases on a
* single inventory item.
*/
exports.getInventoryLeadTimes = function (req, res, next) {
  'use strict';

  var options = req.query;

  leadtimes.getInventoryLeadTimes(options)
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

  var options = req.query;

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

   var options = req.query,
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

/**
* GET /inventory/expirations
* Returns stock expirations between two given dates
*
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*/
function getInventoryExpirations(req, res, next) {
  'use strict';

   var options = req.query;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  expirations.getExpirations(options)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/:uuid/expirations
* Returns stock expirations between two given dates for a given inventory ID
*
* query options:
*   group={day|week|month|year}
*   start={date}
*   end={date}
*/
function getInventoryExpirationsById(req, res, next) {
  'use strict';

   var options = req.query,
      uuid = req.params.uuid;

  // enforce that both parameters exist or neither exist
  if (!core.hasBoth(options.start, options.end)) {
    return res.status(400).json(ERROR.MISSING_PARAMETERS);
  }

  expirations.getExpirationsById(uuid, options)
  .then(function (rows) {
    if (!rows.length) {
      res.status(404).json(ERROR.NO_STOCK);
    }

    res.status(200).json(rows[0]);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/alerts
* Returns any combination of five types of stock alerts:
*   1) Stockout
*   2) Overstocked
*   3) Stock Expiring
*   4) Stock Expired
*   5) Stock Minimum
*/
function getInventoryAlerts(req, res, next) {
  'use strict';

  alerts.getStockAlerts()
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
}

/**
* GET /inventory/:uuid/alerts
* Returns any combination of five types of stock alerts:
*   1) Stockout
*   2) Overstocked
*   3) Stock Expiring
*   4) Stock Expired
*   5) Stock Minimum
*/
function getInventoryExpirationsById(req, res, next) {
  'use strict';

  var uuid = req.params.uuid;

  alerts.getStockAlertsById(uuid)
  .then(function (rows) {
    if (!rows.length) {
      res.status(404).json(ERROR.NO_STOCK);
    }

    res.status(200).json(rows[0]);
  })
  .catch(next)
  .done();
}
