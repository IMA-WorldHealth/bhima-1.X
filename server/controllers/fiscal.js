var q = require('q');
var db = require('./../lib/db');
var util = require('./../lib/util');

/*
 * HTTP Controllers
*/
exports.createFiscalYear = function (req, res, next) {
  var hasBalances, data, fiscalYearId;

  // check if we need to create opening balances or not.
  hasBalances = util.isDefined(req.body.balances);

  // parse dates from client into date objects
  data = req.body;
  data.start = new Date(data.start);
  data.end = new Date(data.end);

  console.log('[FISCAL]', 'Creating new year...');
  // create the new year record
  createNewYear(data)
  .then(function (result) {

    // retrieve the newly inserted ID
    fiscalYearId = result.insertId;
    data.fiscalYearId = fiscalYearId;
    console.log('[FISCAL]', 'New Year ID:', fiscalYearId);

    console.log('[FISCAL]', 'Creating Periods...');
    // create periods corresponding to the fiscal year
    return createPeriods(fiscalYearId, data.start, data.end);
  })
  .then(function (result) {

    console.log('[FISCAL]', 'Making the choice to either create balances or carry forward old balances...');
    // if the fiscal year has balances,
    // it means it is the first fiscal year,
    // and we need to create opening balances
    if (hasBalances) {
      console.log('[FISCAL]', 'Creating opening balances...');
      return createOpeningBalances(data);

    // otherwise, we must tabulate and carry forward
    // the income and expense accounts from last fiscal
    // year, and put them in the closing_account;
    } else  {
      console.log('[FISCAL]', 'Carrying forward old balances...');
      return carryForwardBalances(data);
    }

  })
  .then(function (results) {
    console.log('[FISCAL]', 'Completed everything with success.');
    res.status(200).send(results);
  })
  .catch(function (error) {
    console.log('[FISCAL]', 'An error occurred.', error);
    next(error);
  })
  .done();
};

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
    console.log('[FOUND]', periodId);

    sql =
      'INSERT INTO period_total (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit) VALUES ';

    // copy over debits and credits for period_total
    totals = balances.map(function (account) {
      return [
        data.enterprise_id,
        data.fiscalYearId,
        periodId,                  // opening balances stored in period 0
        account.account_id,
        account.credit,
        account.debit
      ];
    });

    // sanitize the input
    sql += db.sanitize(totals) + ';';

    return db.exec(sql);
  });
}

// triggered for all fiscal years except the first
// sums the balances from the previous fiscal year
// and puts in them in the opening balances (period 0)
function carryForwardBalances(data) {

  var previousId = data.previous_fiscal_year;

}

// calculate the positive integer difference between two dates in months
function monthDiff(firstDate, secondDate) {
  var diff = secondDate.getMonth() - firstDate.getMonth();
  diff += (secondDate.getFullYear() - firstDate.getFullYear()) * 12;
  diff = Math.abs(diff);
  return diff <= 0 ? 0 : diff; // FIXME : This should throw an error if diff <= 0.
}

// creates a fiscal year record
function createNewYear(data) {
  var sql, monthNo, startMonth, startYear,
      enterpriseId = data.enterprise_id,
      startDate = data.start,
      endDate = data.end,
      previousFiscalYear = data.previous_fiscal_year || null,
      fiscalYearText = data.fiscal_year_txt,

      // if there is no closing account, we are on the first fiscal year.
      closingAccount = data.closingAccount || null;

  // date math to get the month number, start month, and start year
  monthNo = monthDiff(startDate, endDate);
  startMonth = startDate.getMonth() + 1;
  startYear = startDate.getFullYear();

  console.log('[FISCAL] createNewYear values:', enterpriseId, monthNo, fiscalYearText, startMonth, startYear, previousFiscalYear, closingAccount);

  // template the fiscal year query
  sql =
    'INSERT INTO fiscal_year (enterprise_id, number_of_months, fiscal_year_txt, start_month, start_year, previous_fiscal_year, closing_account) VALUES ' +
      '(?, ?, ?, ?, ?, ?, ?);';

  return db.exec(sql, [enterpriseId, monthNo, fiscalYearText, startMonth, startYear, previousFiscalYear, closingAccount]);
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

  // create a period for each month, calculating the
  // first day and last day of the month
  for (var i = 0; i < totalMonths + 1; i++) {
    periodStart = new Date(start.getFullYear(), start.getMonth() + i);
    periodStop = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    template.push([fiscalYearId, i, periodStart, periodStop]);
  }

  sql += db.sanitize(template) + ';';

  console.log('FISCAL', 'sql', sql);

  // sanitize turns the template into (a,b), (c,d) ..
  return db.exec(sql);
}
