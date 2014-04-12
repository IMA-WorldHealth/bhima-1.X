var q = require('q'),
    uuid = require('../../lib/util/guid');

module.exports = function (db, parser, journal) { 
  'use strict';
  
  // TODO Server side sale and purchase order are very similar, they should
  // probably be combined
  
  // TODO employee responsible for purchase, credited money from purchase request
  //      must be able to select them at purchase order

  // TODO create purchase order, expense cash, confirm recieving (work with overflow money)
  
  // TODO 
  //  - Purchase price and sale price 
  //  - On purchase order no money is moved
  //  - Move money from cash balance account to asset account (on authorisation of purchase)
  //  - On sale move money from asset account to expense account,
  //    credit sale account
  
  function execute(data, user, callback) { 

  }
};
