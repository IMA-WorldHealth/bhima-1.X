// controllers/finance.js

// POST /journal/voucher
// Securely post a transaction to the posting journal.
// 
// The steps involved are this:
//  1) Check for an exchange rate
//  2a) Get the period_id, fiscal_year_id for the submitted date
//  2b) Validate the date isn't in the future
//  3) Check permissions and link the user with the registration
//  4) Exchange the values that need to be exchanged
//  5) Write to journal_log that a post happened
exports.postJournalVoucher = function (req, res, next) {
  'use strict';
  
  var sql;

};
