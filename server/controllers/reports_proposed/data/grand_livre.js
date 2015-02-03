// reports_proposed/data/balance_sheet.js
// Collects and aggregates data for the enterprise balance sheet
var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

var formatDollar = '$0,0.00';
var grandLivreDate = new Date();

// expose the http route
exports.compile = function (options) {
  'use strict';

  var deferred = q.defer();
  var context = {};
  var fiscalYearId = options.fy;

  context.reportDate = grandLivreDate.toDateString();

  var sql =
    'SELECT `general_ledger`.`trans_id`, `general_ledger`.`trans_date`, `general_ledger`.`description`, ' +
    '`general_ledger`.`debit_equiv`, `general_ledger`.`credit_equiv`, `account`.`account_number`, ' +
    '`fiscal_year`.`fiscal_year_txt`, `cost_center`.`text` AS `cc`, `profit_center`.`text` AS `pc` ' +
    'FROM `general_ledger` JOIN `account` ON `account`.`id` = `general_ledger`.`account_id` JOIN ' +
    '`fiscal_year` ON `fiscal_year`.`id` = `general_ledger`.`fiscal_year_id` LEFT JOIN `cost_center` ' +
    ' ON `cost_center`.`id` = `general_ledger`.`cc_id` LEFT JOIN `profit_center` ON ' +
    '`profit_center`.`id` = `general_ledger`.`pc_id` WHERE `general_ledger`.`fiscal_year_id` =?';


  db.exec(sql, [fiscalYearId])
  .then(function (gl) {
    console.log('le gl est ', gl);
    context.data = gl;
    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();

  return deferred.promise;
};
