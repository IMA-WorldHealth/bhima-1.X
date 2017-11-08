var db      = require('../../../lib/db');
var util      = require('../../../lib/util');
var numeral = require('numeral');

var formatDollar = '0,0.00';
var formatFranc = '0.00';

// sends back object of { date : rate }
function getExchangeRateMap() {
  var sql = 'SELECT rate, DATE_FORMAT(date, \'%d-%m-%Y\') as date FROM exchange_rate ORDER BY date;'
  return db.exec(sql)
    .then(function (rates) {
      return rates.reduce(function (map, rate) {
        map[rate.date] = rate.rate;
        return map;
      }, {});
    });
}

function convert(rateMap, date, amount) {
  var factor = rateMap[date];
  return factor ? Math.round(factor * amount) : 'NO EXCHANGE RATE'
}

// UNUSED
function roundTo(value, denominator) {
  return (Math.round(value / denominator)) * denominator;
}

exports.compile = function (options) {
  'use strict';

  var debitorGroupReportDate = new Date();
  var i18nDebitorGroupReport = options.language == 'fr' ? require('../lang/fr.json').DEBITOR_GROUP_REPORT : require('../lang/en.json').DEBITOR_GROUP_REPORT;
  var context = {}, params = options.involveJournal === true ? [options.dg.account_id, util.toMysqlDate(options.dateFrom), util.toMysqlDate(options.dateTo), options.dg.account_id, util.toMysqlDate(options.dateFrom), util.toMysqlDate(options.dateTo)] : [options.dg.account_id, util.toMysqlDate(options.dateFrom), util.toMysqlDate(options.dateTo)];

  var postingJournalSql =
    'UNION ALL SELECT s.uuid as saleUUID, CONCAT(pr.abbr, s.reference) AS saleNumber, s.cost, DATE_FORMAT(s.invoice_date, \'%d-%m-%Y\') AS invoice_date, dg.name, ac.account_txt, SUM(pj.debit_equiv) AS debit, SUM(pj.credit_equiv) AS credit, pj.trans_id, pj.currency_id, DATE_FORMAT(pj.trans_date, \'%d-%m-%Y\') AS trans_date,  pj.trans_date AS shared_date, ' +
    'CONCAT(pt.first_name, \' \', pt.last_name) AS patientName FROM sale AS s JOIN posting_journal AS pj ON pj.inv_po_id = s.uuid JOIN account AS ac ON pj.account_id = ac.id JOIN debitor_group AS dg ' +
    'ON dg.account_id = pj.account_id JOIN patient AS pt ON pt.debitor_uuid = s.debitor_uuid JOIN project AS pr ON pr.id = s.project_id WHERE pj.account_id =? AND pj.trans_date >= ? AND pj.trans_date <= ? GROUP BY s.uuid ';

  var defaultSql =
    'SELECT s.uuid as saleUUID, CONCAT(pr.abbr, s.reference) AS saleNumber, s.cost, DATE_FORMAT(s.invoice_date, \'%d-%m-%Y\') AS invoice_date, dg.name, ac.account_txt, SUM(gl.debit_equiv) AS debit, SUM(gl.credit_equiv) AS credit, gl.trans_id, gl.currency_id, DATE_FORMAT(gl.trans_date, \'%d-%m-%Y\') AS trans_date, gl.trans_date AS shared_date, ' +
    'CONCAT(pt.first_name, \' \', pt.last_name) AS patientName FROM sale AS s JOIN general_ledger AS gl ON gl.inv_po_id = s.uuid JOIN account AS ac ON gl.account_id = ac.id JOIN debitor_group AS dg ' +
    'ON dg.account_id = gl.account_id JOIN patient AS pt ON pt.debitor_uuid = s.debitor_uuid JOIN project AS pr ON pr.id = s.project_id JOIN currency AS curr ON gl.currency_id = curr.id ' +
    'WHERE gl.account_id =? AND gl.trans_date >= ? AND gl.trans_date <= ? GROUP BY s.uuid ';

  defaultSql += options.involveJournal === true ? postingJournalSql : '';
  defaultSql += ' ORDER BY shared_date DESC;'

  context.reportDate = debitorGroupReportDate.toDateString();
  context.enterpriseName = options.enterprise.abbr + ' - ' + options.enterprise.name;
  context.phone = options.enterprise.phone;
  context.bp = options.enterprise.po_box;
  context.debitorGroupName = options.dg.name;
  context.dataStructure = i18nDebitorGroupReport;
  context.dateFrom = util.toMysqlDate(options.dateFrom);
  context.dateTo = util.toMysqlDate(options.dateTo);

  // hard code USD enterprise currency
  var isEnterpriseCurrency = (options.currency_id === options.enterprise.currency_id);
  context.symbol = isEnterpriseCurrency ? 'USD' : 'FC';

  function processResults(results, rateMap) {
     var processed = results;

    // first filter out the unbalanced
    if (options.unsoldOnly) {
      processed = results.filter(function (item){
        return item.cost - item.credit !== 0;
      });
    }

    function formatFC(value) {
      return numeral(value).format(formatFranc).concat('FC');
    }

    // converts only if not in the enterprise currency
    // NOTE - we do not need to specify a currency since we assume everything is FC
    // and that the debit_credit_equiv is always in the enterprise currency.
    function convertIfNecessary(date, value) {
      // only convert if the currency_id of the transaction is not the
      // enterprises and we have not seleted the
      if (!isEnterpriseCurrency) {
        return formatFC(convert(rateMap, date, value));
      }

      return numeral(value).format(formatDollar);
    }

    processed.forEach(function (item) {
      item._cost = convertIfNecessary(item.trans_date, item.cost);
      item._credit = convertIfNecessary(item.trans_date, item.credit);
      item._difference = convertIfNecessary(item.trans_date, item.cost - item.credit);
      item._hasNoRate = !!rateMap[item.trans_date];
    });

    return processed;
  }

  var rateMap;

  return getExchangeRateMap()
    .then(function (rates) {
    rateMap = rates;
    return db.exec(defaultSql, params)
  })
  .then(function (results) {
    context.data = processResults(results, rateMap);
    var total = {billed : 0, payed : 0};

    context.data.forEach(function (item) {
      total.billed += item.cost;
      total.payed += item.credit;
      item.difference = item.cost - item.credit
      item.cost = numeral(item.cost).format(formatDollar);
      item.credit = numeral(item.credit).format(formatDollar);
      item.difference = numeral(item.difference).format(formatDollar);
    });

    context.somBilled = numeral(total.billed).format(formatDollar);
    context.somPayed = numeral(total.payed).format(formatDollar);
    context.somDifference = total.billed - total.payed;
    context.somDifference = numeral(context.somDifference).format(formatDollar);
    return context;
  });
};
