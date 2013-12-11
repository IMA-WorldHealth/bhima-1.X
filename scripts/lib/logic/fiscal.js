'use strict'
var q = require('q');

//Singleton pattern of creating modules may not be required for utilities like this
//instances should all be seperate from each other and it's not readable/ clear
module.exports = (function(db) { 
  /*summary
  *   Handle the creation of fiscal years, given start date, end date and description (currently assumed to have period length of 1 month)
  *   Creates periods and their respective budgets for each account. 
  *   Returns 200 success on complete entry of every part and 500 on failure indicating which stage the process failed.
  *
  * TODO discuss: 3 seperate operations are currently executed, generating fiscal year, periods and budget, this is to report on exactly whent to the client 
  * but may not give optimal performance
  */
 
  //This is a pretty gross function decleration, too many parameters etc. pass a JSON object through?
  function create(enterprise, startDate, endDate, description, callback) { 
    
    //TODO discuss: Passing variables down through all the functions vs. declaring them at the top, testing/ coupling vs. readability/ clarity? 
    //              this version seems very tightly coupled
    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);
    var validData = verifyData(startDateObj, endDateObj, enterprise);

    if(!validData.valid) return callback(validData.message);
    
    //Create line in `fiscal_year`
    createFiscalRecord(enterprise, startDateObj, endDateObj, description)
    
    .then(function(fiscalSuccess) { 
      console.log('deferred success');
      var fiscalInsertId = fiscalSuccess;
      return createPeriodRecords(enterprise, fiscalInsertId, startDateObj, endDateObj);
    }, function(err) { 
      console.log("fiscal error");
      throw new Error(err);
    })
    
    .then(function(periodSuccess) { 
      callback("Module completed up to period");
    }, function(err) { 
      console.log("period error");
      throw new Error(err);
    })
    
    .fail(function(err) { 
      console.log("Got to error", err);
      callback("error in promise chain" + err);
    })
  }

  function statusObject(valid, message) { 
      return { 
        'valid': valid,
        'message': message
      }
    }

  function verifyData(startDate, endDate, enterprise) { 

    //Enterprise must exist

    //Start date must be before end date
    if(!(startDate < endDate)) {
      return statusObject(false, "Start date must be before end date");
    };
    return statusObject(true, "Tests completed");
  }

  function createFiscalRecord(enterprise, startDate, endDate, description) { 
    var deferred = q.defer();
    var monthNo, startMonth, startYear, previousFiscal, fiscalSQL;

    monthNo = monthDiff(startDate, endDate);
    startMonth = startDate.getMonth() + 1;
    startYear = startDate.getFullYear();

    //Get previous fiscal year, then insert fiscal year into DB
    getLatestFiscal()
    .then(function(res) { 
      previousFiscal = res;

      fiscalSQL = "INSERT INTO `fiscal_year` (enterprise_id, number_of_months, fiscal_year_txt, start_month, start_year, previous_fiscal_year) VALUES " + 
                  "(" + enterprise + "," + monthNo + ",'" + description + "'," + startMonth + "," + startYear + "," + previousFiscal + ");";

      db.execute(fiscalSQL, function(err, ans) { 
        if(err) return deferred.reject(err);
        deferred.resolve(ans.insertId);
      })
    });

    return deferred.promise;
  } 

  function createPeriodRecords(enterprise, fiscalYearId, startDate, endDate) { 
    var accountIdList, totalMonths, periodSQL;
    var deferred = q.defer();
    var periodSQLHead = 'INSERT INTO `period` (fiscal_year_id, period_start, period_stop) VALUES ';
    var periodSQLBody = [];

    totalMonths = monthDiff(startDate, endDate) + 1;
    for(var i = 0; i < totalMonths; i++) { 
      var currentPeriodStart = new Date(startDate.getFullYear(), startDate.getMonth() + i);
      var currentPeriodStop = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0);
      
      periodSQLBody.push('(' + fiscalYearId + ',"' + formatMySQLDate(currentPeriodStart) + '","' + formatMySQLDate(currentPeriodStop) + '")');
    }

    periodSQL = periodSQLHead + periodSQLBody.join(',');
    db.execute(periodSQL, function(err, ans) {
      if(err) return deferred.reject(err);
      deferred.resolve(ans);
    });

    return deferred.promise;
  }

  function createBudgetRecords() { 
    var accountIdList;
    var deferred = q.defer();

    getAccountList()
    .then(function(res) { 
      accountIdList = res;
    });

    return deferred.promise;
  }

  function getAccountList(enterprise) { 
    var deferred = q.defer();
    var accountSQL = 'SELECT id FROM `account` WHERE enterprise_id=' + enterprise + ';';
    db.execute(accountSQL, function(err, ans) { 
      if(err) return deferred.reject(err);
      deferred.resolve(ans);
    })
    return deferred.promise;
  }

  function getLatestFiscal() { 
    //Recersively determine latest fiscal year - should be swapped for simple maxId request if generation time is too long
    var deferred = q.defer();
    var head_request = "SELECT `id` FROM `fiscal_year` WHERE `previous_fiscal_year` IS NULL";
    var iterate_request = "SELECT `id`, `previous_fiscal_year` FROM `fiscal_year` WHERE `previous_fiscal_year`=";

    //find head of list (if it exists)
    db.execute(head_request, function(err, ans) {
      if(ans.length > 1) {
        deferred.reject("too many null values - corrupt data");
      }
      if(ans.length < 1) {
        //no fiscal years - create the first one
        deferred.resolve(null);
      }
      iterateList(ans[0].id);
    });

    function iterateList(id) {
      db.execute(iterate_request + id, function(err, ans) {
        if(err) return deferred.reject(err);
        if(ans.length===0) {
          return deferred.resolve(id);
        }
        return iterateList(ans[0].id);
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
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
  }
  
  return {
    'create' : create
  }
});