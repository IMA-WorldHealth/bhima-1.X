'use strict'

//Singleton pattern of creating modules may not be required for utilities like this
//instances should all be seperate from each other and it's not readable/ clear
module.exports = (function(db) { 
  /*summary
  *   Handle the creation of fiscal years, given start date, end date and description (currently assumed to have period length of 1 month)
  *   Creates periods and their respective budgets for each account. 
  *   Returns 200 success on complete entry of every part and 500 on failure indicating which stage the process failed.
  */
  var enterprise, startDate, endDate, description;

  function create(enterprise, startDate, endDate, description) { 
    enterprise = enterprise;
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    description = description;


  }

  function verifyData() { 

    console.log('[fiscal.js] verifyData()', enterprise, startDate, endDate, description);
    //Enterprise must exist

    //Start date must be before end date
    
  }

  function getPreviousFiscal() { 

  }
  
  return {
    'create' : create
  }
});