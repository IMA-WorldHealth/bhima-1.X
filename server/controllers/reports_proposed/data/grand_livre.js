// reports_proposed/data/balance_sheet.js
// Collects and aggregates data for the enterprise balance sheet
var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

var formatDollar = '$0,0.00';
var grandLivreDate = new Date();

function splitByTransaction (gls) {
  var tapon_gls = gls;
  var formated_gls = [];
  gls.forEach(function (gl, i){
    var grouped_gls = getGroup(tapon_gls, gl.trans_id);
    tapon_gls = refresh(tapon_gls, grouped_gls[0].trans_id); //removing selected elements
    formated_gls.push(grouped_gls);
  });
  return formated_gls;
}

function refresh (tapon_gls, motif){
  var arr = tapon_gls;
  for(var i = 0; i<arr.length; i++){
    if(arr[i].trans_id == motif) {arr.splice(i, 1); refresh(arr, motif);}
  }
  return arr;
}

function getGroup (tapon_gls, motif) {
  var arr = [];
  arr = tapon_gls.filter(function (item){
    return item.trans_id == motif;
  });
  return arr;
}

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
  .then(function (gls) {
    var splited_gls = splitByTransaction(gls);
    console.log('le gl est ', splited_gls);
    context.data = splited_gls;
    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();

  return deferred.promise;
};
