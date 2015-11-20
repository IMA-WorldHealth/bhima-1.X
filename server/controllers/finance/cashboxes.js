/**
* Cashboxes Controller
*
* This controller is responsible for creating and updating cashboxes.  Every
* cashbox must have a name, and as many accounts as there are currencies
* supported by the application.
*/

var db = require('../../lib/db');

/*
* TODO - PROPOSAL: rename cash_box to cashbox in the database.  Easier for everything
* in life.
*/

// FIXME -- For some reason, is_bank can be null.

/**
* GET /cashboxes
* Lists available cashboxes, defaulting to all in the database.  Pass in the
* optional parameters:
*  1) project_id={id}
*  2) is_auxillary={1|0}
*  3) is_bank={1|0}
* to filter results appropriately.
*/
exports.list = function list(req, res, next) {
  'use strict';

  var sql,
      possibleConditions = ['project_id', 'is_auxillary', 'is_bank'],
      providedConditions = Object.keys(req.query),
      conditions = [];

  sql =
    'SELECT id, text FROM cash_box ';

  // loop through conditions if they exist, escaping them and adding them
  // to the query string.
  if (providedConditions.length > 0) {
    possibleConditions.forEach(function (k) {
      var key = req.query[k];

      // if the key exists, add it to a list of growing conditions
      if (key) {
        conditions.push(k + ' = ' + db.sanitize(key));
      }
    });
  }

  // if we have actual matches, concatenate them into a WHERE condition
  if (conditions.length > 0) {
    sql += 'WHERE ' + conditions.join(' AND ');
  }

  sql += ';';

  db.exec(sql)
  .then(function (rows) {
    res.status(200).json(rows);
  })
  .catch(next)
  .done();
};

/**
* GET /cashboxes/:id
*
* Returns the details of a specific cashbox, including the supported currencies
* and their accounts.
*/
exports.details = function details(req, res, next) {
  'use strict';

  var sql,
      cashbox;

  sql =
    'SELECT id, text, project_id, is_auxillary, is_bank FROM cash_box ' +
    'WHERE id = ?;';

  db.exec(sql, [req.params.id])
  .then(function (rows) {

    if (!rows.length) {
      throw req.codes.NOT_FOUND;
    }

    cashbox = rows[0];

    // query the currencies supported by this cashbox
    sql =
      'SELECT currency_id, account_id, gain_exchange_account_id, ' +
        'loss_exchange_account_id, virement_account_id ' +
      'FROM cash_box_account_currency ' +
      'WHERE cash_box_id = ?;';

    return db.exec(sql, [cashbox.id]);
  })
  .then(function (rows) {

    // assign the currencies to the cashbox
    cashbox.currencies = rows;

    res.status(200).json(cashbox);
  })
  .catch(next)
  .done();
};
