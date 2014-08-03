var q = require('q');

// Singleton pattern of creating modules may not be required for utilities like this
// instances should all be seperate from each other and it's not readable/ clear
module.exports = function (db) {
  'use strict';
  /*summary
  *   Handle the creation of fiscal years, given start date, end date and description (currently assumed to have period length of 1 month)
  *   Creates periods and their respective budgets for each account.
  *   Returns 200 success on complete entry of every part and 500 on failure indicating which stage the process failed.
  *
  * TODO discuss: 3 seperate operations are currently executed, generating fiscal year, periods and budget,
  * this is to report on exactly went to the client
  * but may not give optimal performance
  */

  //This is a pretty gross function declaration, too many parameters etc. pass a JSON object through?
  function create(enterprise, start, end, description, callback) {

    //TODO discuss: Passing variables down through all the functions vs. declaring them at the top, testing/ coupling vs. readability/ clarity?
    //              this version seems very tightly coupled
    var fiscalInsertId;
    var periodZeroId;
    var startObj = new Date(start);
    var endObj = new Date(end);
    var validData = verifyData(startObj, endObj, enterprise);
    if (!validData.valid) {
      return callback(validData, null);
    }

    //Create line in fiscal_year
    createFiscalRecord(enterprise, startObj, endObj, description)
    .then(function (fiscalSuccess) {
      fiscalInsertId = fiscalSuccess.insertId;
      return createPeriodRecords(fiscalInsertId, startObj, endObj);
    })
    .then(function (periodSuccess) {
      periodZeroId = periodSuccess.periodZeroId;
      return createBudgetRecords(enterprise, periodSuccess.insertId, periodSuccess.affectedRows, fiscalInsertId);
    })
    .then(function () {
      callback(null, {'fiscalInsertId' : fiscalInsertId, 'periodZeroId': periodZeroId, 'message' : 'Fiscal year, Periods and Budget items generated'});
    })
    .catch(function (err) {
      callback(err);
    })
    .done();
  }

  function statusObject(valid, message) {
    return {
      'valid' : valid,
      'code'  : message
    };
  }

  function verifyData(start, end) {
    // Enterprise must exist

    // Start date must be before end date
    if (start > end) {
      return statusObject(false, 'Start date must be before end date');
    }
    return statusObject(true, 'Tests completed');
  }

  function createFiscalRecord(enterprise, start, end, description) {
    var monthNo, startMonth, startYear,
        previousFiscal;

    monthNo = monthDiff(start, end);
    startMonth = start.getMonth() + 1;
    startYear = start.getFullYear();

    //Get previous fiscal year, then insert fiscal year into DB
    return getLatestFiscal()
    .then(function (res) {
      previousFiscal = res;

      var fiscalSql =
        'INSERT INTO fiscal_year (enterprise_id, number_of_months, fiscal_year_txt, start_month, start_year, previous_fiscal_year) VALUES ' +
        '(' + enterprise + ',' + monthNo + ',\'' + description + '\',' + startMonth + ',' + startYear + ',' + previousFiscal + ');';

      return db.exec(fiscalSql);
    });
  }

  function createPeriodRecords(fiscalYearId, start, end) {
    var totalMonths, periodSQL;
    var deferred = q.defer();
    var periodSQLHead = 'INSERT INTO period (fiscal_year_id, period_number, period_start, period_stop) VALUES ';
    var periodSQLBody = [];

    // create an opening balances period

    var ps = new Date(start.getFullYear(), start.getMonth());
    periodSQLBody.push('(' + fiscalYearId + ',' + 0 +', \'' + formatMySQLDate(ps) + '\' , \'' + formatMySQLDate(ps) + '\')');

    totalMonths = monthDiff(start, end) + 1;
    for (var i = 0; i < totalMonths; i++) {
      var currentPeriodStart = new Date(start.getFullYear(), start.getMonth() + i);
      var currentPeriodStop = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0);

      periodSQLBody.push('(' + fiscalYearId + ',' + Number(i) + 1 + ',\'' + formatMySQLDate(currentPeriodStart) + '\',\'' + formatMySQLDate(currentPeriodStop) + '\')');
    }

    periodSQL = periodSQLHead + periodSQLBody.join(',');
    db.execute(periodSQL, function (err, rows) {
      if (err) {
        return deferred.reject(err);
      }
      var period_zero_sql =
        'SELECT id FROM period WHERE fiscal_year_id = ' + fiscalYearId + ' AND period_number = 0';
      db.execute(period_zero_sql, function (err, pz) {
        if (err) {
          return deferred.reject(err);
        }
        deferred.resolve({ insertId : rows.insertId, periodZeroId : pz[0].id, affectedRows: rows.affectedRows });
      });
    });

    return deferred.promise;
  }

  function createBudgetRecords(enterprise, insertedPeriodId, totalPeriodsInserted) {
    var accountIdList, budgetSql;
    var periodIdList  = [];
    var budgetSqlHead =
      'INSERT INTO budget (account_id, period_id, budget) VALUES ';
    var budgetSqlBody = [];

    var budgetOptions = [0, 10, 20, 30, 50];

    //FIXME - this is so Bad. Periods are inserted as a group returning the inital insert value, extrapolating period Ids from this and number of rows affected
    for (var i = insertedPeriodId, l = (totalPeriodsInserted + insertedPeriodId); i < l; i++) {
      periodIdList.push(i);
    }

    return getAccountList(enterprise)
    .then(function (res) {
      accountIdList = res;
      accountIdList.forEach(function (account) {
        periodIdList.forEach(function (period) {
          budgetSqlBody.push('(' + account.id + ',' + period + ',' + budgetOptions[(Math.round(Math.random() * (budgetOptions.length - 1)))] + ')');
        });
      });

      budgetSql = budgetSqlHead + budgetSqlBody.join(',');
      return db.exec(budgetSql);
    });
  }

  function getAccountList(enterprise) {
    var accountSql =
      'SELECT id FROM account WHERE enterprise_id = ' + enterprise + ';';
    return db.exec(accountSql);
  }

  function getLatestFiscal() {
    //Recersively determine latest fiscal year - should be swapped for simple maxId request if generation time is too long
    var deferred = q.defer();
    var initialRequest =
      'SELECT id FROM fiscal_year WHERE previous_fiscal_year IS NULL';
    var iterateRequest =
      'SELECT id, previous_fiscal_year FROM fiscal_year WHERE previous_fiscal_year=';

    // find head of list (if it exists)
    db.exec(initialRequest)
    .then(function (rows) {
      if (rows.length > 1) {
        deferred.reject('too many null values - corrupt data');
      }

      if (rows.length < 1) {
        // no fiscal years - create the first one
        deferred.resolve();
      }

      iterateList(rows[0].id);
    })
    .catch(deferred.reject)
    .done();

    function iterateList(id) {
      db.exec(iterateRequest + id)
      .then(function (rows) {
        if (rows.length === 0) {
          deferred.resolve(id);
        }
        iterateList(rows[0].id);
      })
      .catch(deferred.reject)
      .done();
    }

    return deferred.promise;
  }

  function monthDiff(firstDate, secondDate) {
    // calculate the positive integer difference between two dates in months
    var diff = secondDate.getMonth() - firstDate.getMonth();
    diff += (secondDate.getFullYear() - firstDate.getFullYear()) * 12;
    diff = Math.abs(diff);
    return diff <= 0 ? 0 : diff; // FIXME : This should throw an error if diff <= 0.
  }

  function formatMySQLDate(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  }

  return {
    'create' : create
  };
};
