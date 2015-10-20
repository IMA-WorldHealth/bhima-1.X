var db = require('./../lib/db'),
    util = require('./../lib/util'),
    journal = require('./journal');

/*
 * HTTP Controller
*/
exports.createFiscalYear = function (req, res, next) {
  'use strict';

  var hasBalances, data, fiscalYearId;

  // check if we need to create opening balances or not.
  hasBalances = util.isDefined(req.body.balances);

  // parse dates from client into date objects
  data = req.body;
  data.start = new Date(data.start);
  data.end = new Date(data.end);

  // create the new year record
  createNewYear(data)
  .then(function (result) {

    // retrieve the newly inserted ID
    fiscalYearId = result.insertId;
    data.fiscalYearId = fiscalYearId;

    // create periods corresponding to the fiscal year
    return createPeriods(fiscalYearId, data.start, data.end);
  })
  .then(function (result) {

    // if the fiscal year has balances,
    // it means it is the first fiscal year,
    // and we need to create opening balances
    if (hasBalances) {
      return createOpeningBalances(data);
    }

    // otherwise, we must tabulate and carry forward
    // the income and expense accounts from last fiscal
    // year, and put them in closing accounts.
    // Closing the previous fiscal year happens as
    // a seperate utility.
  })
  .then(function (results) {
    res.status(200).send({ id : fiscalYearId });
  })
  .catch(function (error) {
    next(error);
  })
  .done();
};

exports.fiscalYearResultat = function (req, res, next) {
  'use strict';
  var data      = req.body.params,
      user_id   = data.user_id,
      new_fy_id = data.new_fy_id,
      bundle    = data.bundle;

  journal.request('fiscal_year_resultat', new_fy_id, user_id, function (error, result) {
    if (error) {
      return next(error);
    }
    res.status(200).send();
  }, undefined, bundle);
}

// calculate the positive integer difference between two dates in months
function monthDiff(firstDate, secondDate) {
  var diff = secondDate.getMonth() - firstDate.getMonth();
  diff += (secondDate.getFullYear() - firstDate.getFullYear()) * 12;
  diff = Math.abs(diff);
  return diff <= 0 ? 0 : diff; // FIXME : This should throw an error if diff <= 0.
}

// only triggered when it is the first fiscal year
// this creates opening balances using the balances
// shipped back from the client.
function createOpeningBalances(data) {
  var sql,
      periodId,
      balances = data.balances,
      totals;

  sql =
    'SELECT id FROM period WHERE period_number = 0 AND fiscal_year_id = ?;';

  // first, get the id of the 0 period
  return db.exec(sql, [data.fiscalYearId])
  .then(function (periods) {
    periodId = periods[0].id;

    totals = balances.map(function (account) {
      return {
        projectId    : 1,                            // Set to HBB project ID
        description  : 'Initialisation Fiscal Year',
        accountId    : account.account_id,
        debit        : account.debit,
        credit       : account.credit,
        currencyId   : data.currency_id,              // Default currency is dollars us
      };
    });

    var details = {
      balances  : totals,
      dateStart : util.toMysqlDate(data.start)
    };

    return journal.request('create_fiscal_year', periodId, data.user_id, function (error, result) {
      if (error) {
        return error;
      }
      return result;
    }, -1, details);

  });
}

// creates a fiscal year record
function createNewYear(data) {
  var sql, monthNo, startMonth, startYear,
      enterpriseId = data.enterprise_id,
      startDate = data.start,
      endDate = data.end,
      previousFiscalYear = data.previous_fiscal_year || null,
      fiscalYearText = data.fiscal_year_txt;

  // date math to get the month number, start month, and start year
  monthNo = monthDiff(startDate, endDate) + 1; // FIXME Why is the plus one?
  startMonth = startDate.getMonth() + 1;
  startYear = startDate.getFullYear();

  // template the fiscal year query
  sql =
    'INSERT INTO fiscal_year (enterprise_id, number_of_months, fiscal_year_txt, start_month, start_year, previous_fiscal_year) VALUES ' +
      '(?, ?, ?, ?, ?, ?);';

  return db.exec(sql, [enterpriseId, monthNo, fiscalYearText, startMonth, startYear, previousFiscalYear]);
}

// creates the periods (including period 0) for a fiscal year
function createPeriods(fiscalYearId, start, end) {
  var sql,
      totalMonths,
      periodStart,
      periodStop,
      template = [];

  // calculate the total months in the fiscal year to be inserted
  totalMonths = monthDiff(start, end) + 1;

  // Initial SQL query without template
  sql =
    'INSERT INTO period (fiscal_year_id, period_number, period_start, period_stop) VALUES ';

  // create the zero period
  template.push([fiscalYearId, 0, periodStart, periodStart]);

  // create a period for each month, calculating the
  // first day and last day of the month
  for (var i = 0; i < totalMonths; i++) {
    periodStart = new Date(start.getFullYear(), start.getMonth() + i);
    periodStop = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    template.push([fiscalYearId, i+1, periodStart, periodStop]);
  }

  sql += db.sanitize(template) + ';';

  // sanitize turns the template into (a,b), (c,d) ..
  return db.exec(sql);
}
