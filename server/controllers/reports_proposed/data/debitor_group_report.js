// reports_proposed/data/balance_sheet.js
// Collects and aggregates data for the enterprise balance sheet
var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');
var sanitize = require('../../../lib/sanitize');

var formatDollar = '$0,0.00';
var debitorGroupReportDate = new Date();

exports.compile = function (options) {
  'use strict';

  var i18nDebitorGroupReport = options.language == 'fr' ? require('../lang/fr.json').DEBITOR_GROUP_REPORT : require('../lang/en.json').DEBITOR_GROUP_REPORT;
  var deferred = q.defer(), context = {}, params = options.involveJournal === true ? [options.dg.account_id, options.dg.account_id] : [options.dg.account_id];

  var sql2 =
    'UNION ALL SELECT `s`.`uuid`, `s`.`cost`, `s`.`invoice_date`, `dg`.`name`, `ac`.`account_txt`, SUM(`pj`.`debit_equiv`) AS `debit`, SUM(`pj`.`credit_equiv`) AS `credit` ' +
    'FROM `sale` AS `s` JOIN `posting_journal` AS `pj` ON `pj`.`inv_po_id` = `s`.`uuid` JOIN `account` AS `ac` ON `pj`.`account_id` = `ac`.`id` JOIN `debitor_group` AS `dg` ' +
    'ON `dg`.`account_id` = `pj`.`account_id` WHERE `pj`.`account_id` =? GROUP BY `s`.`uuid`';
  var addSql = options.involveJournal === true ? sql2 : '';
  var sql = 
    'SELECT `s`.`uuid` as sale_uuid, `s`.`cost`, `s`.`invoice_date`, `dg`.`name`, `ac`.`account_txt`, SUM(`gl`.`debit_equiv`) AS `debit`, SUM(`gl`.`credit_equiv`) AS `credit` ' +
    'FROM `sale` AS `s` JOIN `general_ledger` AS `gl` ON `gl`.`inv_po_id` = `s`.`uuid` JOIN `account` AS `ac` ON `gl`.`account_id` = `ac`.`id` JOIN `debitor_group` AS `dg` ' +
    'ON `dg`.`account_id` = `gl`.`account_id` WHERE `gl`.`account_id` =? GROUP BY `s`.`uuid` ' + addSql;
  var filterResults = function (results){
    return results.filter(function (item){
      return item.debit - item.credit !== 0;
    });
  };

  context.reportDate = debitorGroupReportDate.toDateString();
  context.enterpriseName = options.enterprise.abbr;
  context.title = i18nDebitorGroupReport.TITLE;
  context.enterprise = i18nDebitorGroupReport.ENTERPRISE;
  context.debit = i18nDebitorGroupReport.DEBIT;
  context.credit = i18nDebitorGroupReport.CREDIT;
  context.date = i18nDebitorGroupReport.DATE;

 
  db.exec(sql, params)
  .then(function (results){
    context.data = options.unsoldOnly === true ? filterResults(results) : results;
    console.log('resultat', context.data);   
  })
  .catch(deferred.reject)
  .done();
  return deferred.promise;
};
