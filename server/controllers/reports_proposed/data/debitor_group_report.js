// reports_proposed/data/balance_sheet.js
// Collects and aggregates data for the enterprise balance sheet
var q       = require('q');
var db      = require('../../../lib/db');
var numeral = require('numeral');

var formatDollar = '$0,0.00';
var debitorGroupReportDate = new Date();

exports.compile = function (options) {
  'use strict';

  var i18nDebitorGroupReport = options.language == 'fr' ? require('../lang/fr.json').DEBITOR_GROUP_REPORT : require('../lang/en.json').DEBITOR_GROUP_REPORT;
  var deferred = q.defer(), context = {}, params = options.involveJournal === true ? [options.dg.account_id, options.dg.account_id] : [options.dg.account_id];

  var sql2 =
    'UNION ALL SELECT s.uuid as saleUUID, CONCAT(pr.abbr, s.reference) AS saleNumber, s.cost, DATE_FORMAT(s.invoice_date, \'%d-%m-%Y\') AS invoice_date, dg.name, ac.account_txt, SUM(pj.debit_equiv) AS debit, SUM(pj.credit_equiv) AS credit, pj.trans_id, ' +
    'CONCAT(pt.first_name, \' \', pt.last_name) AS patientName FROM sale AS s JOIN posting_journal AS pj ON pj.inv_po_id = s.uuid JOIN account AS ac ON pj.account_id = ac.id JOIN debitor_group AS dg ' +
    'ON dg.account_id = pj.account_id JOIN patient AS pt ON pt.debitor_uuid = s.debitor_uuid JOIN project AS pr ON pr.id = s.project_id WHERE pj.account_id =? GROUP BY s.uuid';
  var addSql = options.involveJournal === true ? sql2 : '';
  var sql = 
    'SELECT s.uuid as saleUUID, CONCAT(pr.abbr, s.reference) AS saleNumber, s.cost, DATE_FORMAT(s.invoice_date, \'%d-%m-%Y\') AS invoice_date, dg.name, ac.account_txt, SUM(gl.debit_equiv) AS debit, SUM(gl.credit_equiv) AS credit, gl.trans_id, ' +
    'CONCAT(pt.first_name, \' \', pt.last_name) AS patientName FROM sale AS s JOIN general_ledger AS gl ON gl.inv_po_id = s.uuid JOIN account AS ac ON gl.account_id = ac.id JOIN debitor_group AS dg ' +
    'ON dg.account_id = gl.account_id JOIN patient AS pt ON pt.debitor_uuid = s.debitor_uuid JOIN project AS pr ON pr.id = s.project_id WHERE gl.account_id =? GROUP BY s.uuid ' + addSql;
  var filterResults = function (results){
    return results.filter(function (item){
      return item.debit - item.credit !== 0;
    });
  };

  context.reportDate = debitorGroupReportDate.toDateString();
  context.enterpriseName = options.enterprise.abbr + ' - ' + options.enterprise.name;
  context.phone = options.enterprise.phone;
  context.bp = options.enterprise.po_box;
  context.debitorGroupName = options.dg.name;
  context.title = i18nDebitorGroupReport.TITLE;
  context.enterprise = i18nDebitorGroupReport.ENTERPRISE;
  context.saleNumber = i18nDebitorGroupReport.SALE_NUMBER;
  context.patient = i18nDebitorGroupReport.PATIENT;
  context.dateBill = i18nDebitorGroupReport.BILL_DATE;
  context.amountBilled = i18nDebitorGroupReport.AMOUNT_BILLED;
  context.amountPayed = i18nDebitorGroupReport.AMOUNT_PAYED;
  context.difference = i18nDebitorGroupReport.DIFFERENCE;
  context.transNumber = i18nDebitorGroupReport.TRANS_NUMBER;
  context.date = i18nDebitorGroupReport.DATE;
  context.totalBilled = i18nDebitorGroupReport.TOTAL_BILLED;
  context.totalPayed = i18nDebitorGroupReport.TOTAL_PAYED;
  context.totalDifference = i18nDebitorGroupReport.TOTAL_DIFFERENCE;
  context.tel = i18nDebitorGroupReport.TEL;
  context.box = i18nDebitorGroupReport.BOX


 
  db.exec(sql, params)
  .then(function (results){
    context.data = options.unsoldOnly === true ? filterResults(results) : results;
    var total = {billed : 0, payed : 0};
    context.data.forEach(function (item){
      total.billed += item.cost;
      total.payed += item.credit;
      item.difference = item.cost - item.credit;
      item.cost = numeral(item.cost).format(formatDollar);      
      item.credit = numeral(item.credit).format(formatDollar);
      item.difference = numeral(item.difference).format(formatDollar);
    });
    context.somBilled = numeral(total.billed).format(formatDollar);
    context.somPayed = numeral(total.payed).format(formatDollar);
    context.somDifference = total.billed - total.payed;
    context.somDifference = numeral(context.somDifference).format(formatDollar);
    deferred.resolve(context);
  })
  .catch(deferred.reject)
  .done();
  return deferred.promise;
};
