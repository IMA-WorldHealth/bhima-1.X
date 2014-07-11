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

  //This is a pretty gross function decleration, too many parameters etc. pass a JSON object through?
  function create(enterprise, startDate, endDate, description, callback) {

    //TODO discuss: Passing variables down through all the functions vs. declaring them at the top, testing/ coupling vs. readability/ clarity?
    //              this version seems very tightly coupled
    var fiscalInsertId;
    var periodZeroId;
    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);
    var validData = verifyData(startDateObj, endDateObj, enterprise);
    var s;
    if (!validData.valid) {
      return callback(validData, null);
    }

    //Create line in `fiscal_year`
    createFiscalRecord(enterprise, startDateObj, endDateObj, description)

    .then(function(fiscalSuccess) {
      fiscalInsertId = fiscalSuccess.insertId;
      return createPeriodRecords(fiscalInsertId, startDateObj, endDateObj);
    }, function(err) {
      throw err;
    })

    .then(function(periodSuccess) {
      s = periodSuccess;
      periodZeroId = periodSuccess.periodZeroId;
      return createBudgetRecords(enterprise, periodSuccess.insertId, periodSuccess.affectedRows, fiscalInsertId);
    }, function(err) {
      throw err;
    })
    .then(function () {
      console.log('\n\n', s ,'\n');
      callback(null, {'fiscalInsertId' : fiscalInsertId, 'periodZeroId': periodZeroId, 'message' : 'Fiscal year, Periods and Budget items generated'});
    }, function(err) {
      throw err;
    })

    .fail(function(err) {
      callback(err, null);
    });
  }

  function statusObject(valid, message) {
      return {
        'valid': valid,
        'code': message
      };
    }

  function verifyData(startDate, endDate) {
    //Enterprise must exist

    //Start date must be before end date
    if (startDate > endDate) {
      return statusObject(false, 'Start date must be before end date');
    }
    return statusObject(true, 'Tests completed');
  }

  function createFiscalRecord(enterprise, startDate, endDate) {
    var description;
    var monthNo, startMonth, startYear, previousFiscal;

    monthNo = monthDiff(startDate, endDate);
    startMonth = startDate.getMonth() + 1;
    startYear = startDate.getFullYear();

    //Get previous fiscal year, then insert fiscal year into DB
    return getLatestFiscal()
    .then(function (res) {
      previousFiscal = res;

      var fiscalSQL =
        'INSERT INTO `fiscal_year` (enterprise_id, number_of_months, fiscal_year_txt, start_month, start_year, previous_fiscal_year) VALUES ' +
        '(' + enterprise + ',' + monthNo + ',\'' + description + '\',' + startMonth + ',' + startYear + ',' + previousFiscal + ');';

      return db.exec(fiscalSQL);
    });

  }

  function createPeriodRecords(fiscalYearId, startDate, endDate) {
    var totalMonths, periodSQL;
    var periodSQLHead = 'INSERT INTO `period` (fiscal_year_id, period_number, period_start, period_stop) VALUES ';
    var periodSQLBody = [];

    // create an opening balances period

    var ps = new Date(startDate.getFullYear(), startDate.getMonth());
    periodSQLBody.push('(' + fiscalYearId + ',' + 0 +', \'' + formatMySQLDate(ps) + '\' , \'' + formatMySQLDate(ps) + '\')');

    totalMonths = monthDiff(startDate, endDate) + 1;
    for (var i = 0; i < totalMonths; i++) {
      var currentPeriodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i);
      var currentPeriodStop = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0);

      periodSQLBody.push('(' + fiscalYearId + ',' + Number(i) + 1 + ',\'' + formatMySQLDate(currentPeriodStart) + '\',\'' + formatMySQLDate(currentPeriodStop) + '\')');
    }

    periodSQL = periodSQLHead + periodSQLBody.join(',');
    return db.exec(periodSQL)
    .then(function (ans) {
      var period_zero_sql =
        'SELECT `id` FROM `period` WHERE `fiscal_year_id` = ' + fiscalYearId + ' AND `period_number` = 0';

      return db.exec(period_zero_sql)
      .then(function (pz) {
        return q.resolve({ insertId : ans.insertId, periodZeroId : pz[0].id, affectedRows: ans.affectedRows });
      });
    });
  }

  function createBudgetRecords(enterprise, insertedPeriodId, totalPeriodsInserted) {
    var accountIdList, budgetSQL;
    var periodIdList  = [];
    var budgetSQLHead = 'INSERT INTO `budget` (account_id, period_id, budget) VALUES ';
    var budgetSQLBody = [];

    var budgetOptions = [0, 10, 20, 30, 50];

    //FIXME - this is so Bad. Periods are inserted as a group returning the inital insert value, extrapolating period Ids from this and number of rows affected
    for (var i = insertedPeriodId, l = (totalPeriodsInserted + insertedPeriodId); i < l; i++) {
      periodIdList.push(i);
    }

    return getAccountList(enterprise)
    .then(function (res) {
      accountIdList = res;
      accountIdList.forEach(function(account) {
        periodIdList.forEach(function(period) {
          budgetSQLBody.push('(' + account.id + ',' + period + ',' + budgetOptions[(Math.round(Math.random() * (budgetOptions.length - 1)))] + ')');
        });
      });

      budgetSQL = budgetSQLHead + budgetSQLBody.join(',');
      return db.exec(budgetSQL);
    });
  }

  function getAccountList(enterprise) {
    var accountSQL = 'SELECT id FROM `account` WHERE enterprise_id = ' + enterprise + ';';
    return db.exec(accountSQL);
  }

  function getLatestFiscal() {
    //Recersively determine latest fiscal year - should be swapped for simple maxId request if generation time is too long
    var deferred = q.defer();
    var head_request = 'SELECT `id` FROM `fiscal_year` WHERE `previous_fiscal_year` IS NULL';
    var iterate_request = 'SELECT `id`, `previous_fiscal_year` FROM `fiscal_year` WHERE `previous_fiscal_year`=';

    //find head of list (if it exists)
    db.execute(head_request, function (err, ans) {
      if (err) { deferred.reject(err); }
      if (ans.length > 1) {
        return deferred.reject('too many null values - corrupt data');
      }
      if (ans.length < 1) {
        //no fiscal years - create the first one
        return deferred.resolve(null);
      }

      iterateList(ans[0].id);
    });

    function iterateList(id) {
      db.exec(iterate_request + id)
      .then(function (ans) {
        if (ans.length === 0) {
          return deferred.resolve(id);
        }
        iterateList(ans[0].id);
      })
      .catch(function (err) {
        return deferred.reject(err);
      });
    }

    return deferred.promise;
  }

  function monthDiff(firstDate, secondDate) {
    /*summary
    *   calculate the positive integer difference between two dates in months
    */
    var diff = secondDate.getMonth() - firstDate.getMonth();
    diff += (secondDate.getFullYear() - firstDate.getFullYear()) * 12;
    diff = Math.abs(diff);
    return diff <= 0 ? 0 : diff;
  }

  function formatMySQLDate(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  }

  return {
    'create' : create
  };
};
