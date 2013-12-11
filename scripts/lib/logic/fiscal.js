'use strict'
var q = require('q');

//Singleton pattern of creating modules may not be required for utilities like this
//instances should all be seperate from each other and it's not readable/ clear
module.exports = (function(db) { 
  /*summary
  *   Handle the creation of fiscal years, given start date, end date and description (currently assumed to have period length of 1 month)
  *   Creates periods and their respective budgets for each account. 
  *   Returns 200 success on complete entry of every part and 500 on failure indicating which stage the process failed.
  */
 
  //This is a pretty gross function decleration, too many parameters etc. pass a JSON object through?
  function create(enterprise, startDate, endDate, description, callback) { 
    
    //TODO discuss: Passing variables down through all the functions vs. declaring them at the top, testing/ coupling vs. readability/ clarity? 
    //              this version seems very tightly coupled
    var previousFiscal;
    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);
    var validData = verifyData(startDateObj, endDateObj, enterprise);
    if(!validData.valid) return callback(validData.message);

    //Determine previous fiscal year
    
    //Create line in `fiscal_year`
  }

  function verifyData(startDate, endDate, enterprise) { 
    var statusObject = {
      valid: true,
      message: ""
    }
    
    //Enterprise must exist

    //Update status message - return 
    //Start date must be before end date
    if(!(startDate < endDate)) return {valid: false, message: "Start date must be before end date"};
    return statusObject;
  }

  function createFiscalRecord(enterprise, startDate, endDate) { 

  }

  function createPeriodRecords() { 

  }

  function createBudgetRecords() { 

  }

  function getLatestFiscal() { 

    //Recersively determine latest fiscal year - should be swapped for simple maxId request if generation time is too long
    var deferred = q.defer();
    var head_request = "SELECT `id` FROM `fiscal_year` WHERE `previous_fiscal_year` IS NULL";
    var iterate_request = "SELECT `id`, `previous_fiscal_year` FROM `fiscal_year` WHERE `previous_fiscal_year`=";

    //find head of list (if it exists)
    db.execute(head_request, function(err, ans) {
      if(ans.length > 1) {
        return;
      }
      if(ans.length < 1) {
        //no fiscal years - create the first one
        res.send({previous_fiscal_year: null});
        return;
      }
      iterateList(ans[0].id);
    });

    function iterateList(id) {
      iterations++;
      db.execute(iterate_request + id, function(err, ans) {
        if(err) return;
        if(ans.length===0) {
          return respond(id);
        }
        return iterateList(ans[0].id);
      });
    }

    function respond(previous_id) {
      console.log('[fiscal.js] responding');
      return previous_id;
      // res.send({previous_fiscal_year: previous_id});
    }

    return deferred.promise;
  }
  
  return {
    'create' : create
  }
});