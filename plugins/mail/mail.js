#!/usr/local/bin/node
var q = require('q');
var fs = require('fs');

var template = require('./lib/template.js');
var data = require('./lib/data.js');
var mail = require('./lib/interface.js');
var util = require('./lib/util.js');

var enterprise = 'IMCK';

// TODO This is derived from send.js (from cron job)
var service = 'daily';
var language = 'en';

// FIXME
var reportDate = new Date();
var timestamp = reportDate.toLocaleDateString();
var reportReference = util.generateUuid();

var reportQuery = {};

var include = [
  updateProgress,
  overview,
  breakdown,
  hbbFinanceOverview,
  paxFinanceOverview,
  categoryPrincipal,
  principalIncomeExpense,
  principalBalance,
  accounts,
  subsidyIMA
];

console.log('Initialization done');


// Temporary - ensure out exists
function configureEnvironment() {
  var deferred = q.defer();

  fs.exists('./out', function (result) {
    if (result) { return deferred.resolve(); }

    fs.mkdir('out', function () {
      return deferred.resolve();
    });
  });
  return deferred.promise;
}

parseParams()
.then(configureEnvironment)
.then(buildQuery)
.then(settup);

// Naive parmeter parsing, should have the following format -l language -s service
function parseParams() {
  service = process.argv[2] || service;
  language = process.argv[3] || language;
  return q.resolve();
}

function buildQuery()  {
  reportQuery = {
    'HBB_New_Patients' : 'SELECT COUNT(uuid) as \'total\' FROM patient WHERE registration_date >= ' + util.date.from + ' AND registration_date <= ' + util.date.to + ' AND renewal = 0 AND project_id = 1;',
    'PAX_New_Patients' : 'SELECT COUNT(uuid) as \'total\' FROM patient WHERE registration_date >= ' + util.date.from + ' AND registration_date <= ' + util.date.to + ' AND renewal = 0 AND project_id = 2;',

    'HBB_Renewal_Patients' : 'SELECT COUNT(uuid) as \'total\' FROM patient WHERE registration_date >= ' + util.date.from + ' AND registration_date <= ' + util.date.to + ' AND renewal = 1 AND project_id = 1;',
    'PAX_Renewal_Patients' : 'SELECT COUNT(uuid) as \'total\' FROM patient WHERE registration_date >= ' + util.date.from + ' AND registration_date <= ' + util.date.to + ' AND renewal = 1 AND project_id = 2;',

    'IMA_Total' : 'SELECT SUM(`t`.`debit_equiv` - `t`.`credit_equiv`) as \'total\' FROM (SELECT `p`.`debit_equiv`, `p`.`credit_equiv` FROM `posting_journal` as `p` WHERE `p`.`account_id` = 3551  AND trans_date=' + util.date.from + 
    ' UNION ALL SELECT `g`.`debit_equiv`, `g`.`credit_equiv` FROM `general_ledger` as `g` WHERE `g`.`account_id` = 3551 AND trans_date=' + util.date.from + ') as `t`;',

    'IMA_Patients' : 'SELECT COUNT(DISTINCT debitor_uuid) as \'total\' FROM `sale` JOIN `sale_subsidy` JOIN `subsidy` JOIN `debitor_group` WHERE `sale`.`uuid` = `sale_subsidy`.`sale_uuid` AND ' +
    '`sale_subsidy`.`subsidy_uuid` = `subsidy`.`uuid` AND `subsidy`.`debitor_group_uuid` = `debitor_group`.`uuid` AND `sale`.`project_id` = 1 AND sale.invoice_date = ' + util.date.from + ' AND  `debitor_group`.`uuid` = \'25ba37de-3b26-4624-afba-f2ec002da9b8 \' ' +
    'AND `sale`.`uuid` NOT IN (SELECT sale_uuid FROM credit_note);',

    'HBB_New_Fiche' : 'SELECT COUNT(sale.uuid) as \'total\' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020002) ' +
    'AND sale.invoice_date = ' + util.date.from + ' AND sale.project_id = 1 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',

    'PAX_New_Fiche' : 'SELECT COUNT(sale.uuid) as \'total\' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020002) ' +
    'AND sale.invoice_date = ' + util.date.from + ' AND sale.project_id = 2 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',

    'HBB_Old_Fiche' : 'SELECT COUNT(sale.uuid) as \'total\' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020003) ' +
    'AND sale.invoice_date = ' + util.date.from + ' AND sale.project_id = 1 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',

    'PAX_Old_Fiche' : 'SELECT COUNT(sale.uuid) as \'total\' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020003) ' +
    'AND sale.invoice_date = ' + util.date.from + ' AND sale.project_id = 2 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',


    'HBB_Basic_Sale' : 'SELECT COUNT(uuid) as \'total\' FROM sale WHERE invoice_date = ' + util.date.from + ' AND sale.project_id = 1 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',
    'PAX_Basic_Sale' : 'SELECT COUNT(uuid) as \'total\' FROM sale WHERE invoice_date = ' + util.date.from + ' AND sale.project_id = 2 AND sale.uuid NOT IN (SELECT sale_uuid FROM credit_note);',


    'HBB_Principal_Cash_Income_Expense' : 'SELECT SUM(if(currency_id=1,debit_equiv / 930, debit_equiv)) as debit, SUM(if(currency_id=1,credit_equiv / 930, credit_equiv)) as credit FROM (SELECT `p`.`debit_equiv`, `p`.`credit_equiv`, `p`.`currency_id` FROM posting_journal as p WHERE `p`.`account_id` IN (2935, 2939) AND `p`.`trans_date` =' + util.date.from + ' UNION ALL SELECT `g`.`debit_equiv`, `g`.`credit_equiv`, `g`.`currency_id` FROM general_ledger as g WHERE `g`.`account_id` IN (2935, 2939) AND `g`.`trans_date` =' + util.date.from +') as t;',

    'HBB_Principal_Cash_Balance' : 'SELECT SUM(debit_equiv - credit_equiv) as balance FROM posting_journal WHERE account_id IN (2935, 2939) ' +
    'UNION ALL SELECT SUM(debit_equiv - credit_equiv) FROM general_ledger WHERE account_id IN (2935, 2939);',

    'HBB_Sum_Cash' : 'SELECT SUM(if(currency_id = 2, cost * 930, cost )) as \'total\' FROM cash WHERE  project_id = 1 AND date=' + util.date.from + ' AND uuid NOT IN (SELECT cash_uuid FROM cash_discard);',
    'PAX_Sum_Cash' : 'SELECT SUM(if(currency_id = 2, cost * 930, cost )) as \'total\' FROM cash WHERE  project_id = 2 AND date=' +  util.date.from + ' AND uuid NOT IN (SELECT cash_uuid FROM cash_discard);',
    'HBB_Cash_Total_Invoice' : 'SELECT COUNT(invoice_uuid) as \'total\' FROM cash join cash_item where cash_item.cash_uuid = cash.uuid AND date = ' + util.date.from + ' AND project_id = 1;',
    'PAX_Cash_Total_Invoice' : 'SELECT COUNT(invoice_uuid) as \'total\' FROM cash join cash_item where cash_item.cash_uuid = cash.uuid AND date = ' + util.date.from + ' AND project_id = 2;'
  };

  return q.resolve();
}

function settup () {
  // Initialise modules
  data.process(reportQuery)
  .then(template.load(language))
  .then(configureReport)
  .then(collateReports)
  .catch(handleError);
}

function configureReport () {

  // Configuration, currently only header
  var header = enterprise + ' | ' + timestamp;

  template.writeHeader(header, reportReference);
  return q.resolve();
}


function collateReports() {
  var sessionTemplate = [];

  // TODO move to util
  var file = reportDate.getDate() +
             '-' +
             (reportDate.getMonth() + 1) +
             '-' +
             reportDate.getFullYear() +
             '_' +
             language +
             '_' +
             service;
  var path = 'out/'.concat(file, '.html');

  try {
    include.forEach(function (templateMethod) {
      sessionTemplate.push(templateMethod());
    });
  }catch(e) {
    console.log(e);
  }

  template.produceReport(sessionTemplate.join('\n'), path);

  // Write the name of the file written to standard out
  console.log('Writing', path);
  data.end();
}

function linkDown() {
  var message = template.reports('Section', 'network_warning');
  return template.fetch('message').replace(/{{ALERT_MESSAGE}}/g, message.heading + ' ' + message.content);
}

function updateProgress() {
  var message = template.reports('Section', 'system_update');
  return template.fetch('message').replace(/{{ALERT_MESSAGE}}/g, message.heading + ' ' + message.content);
}

function overview() {
  return template.fetch('header').replace(/{{HEADER_TEXT}}/g, template.reports('Header', 'overview'));
}

function breakdown() {

  var hbbNew = data.lookup('HBB_New_Patients')[0].total;
  var paxNew = data.lookup('PAX_New_Patients')[0].total;

  var hbbReturning = data.lookup('HBB_Renewal_Patients')[0].total;
  var paxReturning = data.lookup('PAX_Renewal_Patients')[0].total;

  var paxNewFiche = data.lookup('PAX_New_Fiche')[0].total;
  var paxOldFiche = data.lookup('PAX_Old_Fiche')[0].total;

  var hbbNewFiche = data.lookup('HBB_New_Fiche')[0].total;
  var hbbOldFiche = data.lookup('HBB_Old_Fiche')[0].total;

  var hbbTotalSale = data.lookup('HBB_Basic_Sale')[0].total;
  var paxTotalSale = data.lookup('PAX_Basic_Sale')[0].total;

  // var hbbTotalSaleItems = data.lookup('HBB_Sale_Items')[0].total;
  // var paxTotalSaleItems = data.lookup('PAX_Sale_Items')[0].total;

  var structureTemplate = template.fetch('table');
  var headerTemplate = template.fetch('tableHeader');
  var rowTemplate = template.fetch('tableRow');

  var row = [], table, header, body;

  // Populate Header
  header = template.replace(headerTemplate, '{{DATA_ONE}}', 'Rubrics');
  header = template.replace(header, '{{DATA_TWO}}', 'IMCK HBB');
  header = template.replace(header, '{{DATA_THREE}}', 'IMCK PAX');

  // Populate Body
  row[0] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'new_patients'));
  row[0] = template.replace(row[0], '{{DATA_TWO}}', hbbNew);
  row[0] = template.replace(row[0], '{{DATA_THREE}}', paxNew);
  row[0] = template.replace(row[0], '{{ROW_STYLE}}', '');

  row[1] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'returning_patients'));
  row[1] = template.replace(row[1], '{{DATA_TWO}}', hbbReturning);
  row[1] = template.replace(row[1], '{{DATA_THREE}}', paxReturning);
  row[1] = template.replace(row[1], '{{ROW_STYLE}}', '');

  row[2] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'total_patients'));
  row[2] = template.replace(row[2], '{{DATA_TWO}}', hbbNew + hbbReturning);
  row[2] = template.replace(row[2], '{{DATA_THREE}}', paxNew + paxReturning);
  row[2] = template.replace(row[2], '{{ROW_STYLE}}', 'style=\'font-weight: bold\'');

  row[3] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'new_fiche'));
  row[3] = template.replace(row[3], '{{DATA_TWO}}', hbbNewFiche);
  row[3] = template.replace(row[3], '{{DATA_THREE}}', paxNewFiche);
  row[3] = template.replace(row[3], '{{ROW_STYLE}}', '');

  row[4] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'old_fiche'));
  row[4] = template.replace(row[4], '{{DATA_TWO}}', hbbOldFiche);
  row[4] = template.replace(row[4], '{{DATA_THREE}}', paxOldFiche);
  row[4] = template.replace(row[4], '{{ROW_STYLE}}', '');

  row[5] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'total_fiche'));
  row[5] = template.replace(row[5], '{{DATA_TWO}}', hbbNewFiche + hbbOldFiche);
  row[5] = template.replace(row[5], '{{DATA_THREE}}', paxNewFiche + paxOldFiche);
  row[5] = template.replace(row[5], '{{ROW_STYLE}}', 'style=\'font-weight: bold\'');

  row[6] = template.replace(rowTemplate, '{{DATA_ONE}}', template.reports('Overview', 'total_invoice'));
  row[6] = template.replace(row[6], '{{DATA_TWO}}', hbbTotalSale);
  row[6] = template.replace(row[6], '{{DATA_THREE}}', paxTotalSale);
  row[6] = template.replace(row[6], '{{ROW_STYLE}}', 'style=\'font-weight: bold\'');

  body = row.join('\n');

  // Populate Table
  table = template.replace(structureTemplate, '{{HEADER_CONTENT}}', header);
  table = template.replace(table, '{{BODY_CONTENT}}', body);

  return table;
}
// TODO create a section object with basic methods, introduce header and content etc.
function patientTotalReport() {
  var totalNew = data.lookup('New_Patients')[0].total;
  var totalReturning = data.lookup('Renewal_Patients')[0].total;

  var sectionTemplate = template.reports('Section', 'registration');
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong(totalNew + totalReturning),
        template.insertStrong(totalReturning),
        template.insertStrong(totalNew)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function hbbFinanceOverview() {
  var totalCash = data.lookup('HBB_Sum_Cash')[0].total;
  var totalInvoices = data.lookup('HBB_Cash_Total_Invoice')[0].total;

  var sectionTemplate = template.reports('Section', 'cash_hbb');

  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong(filterCurrency(totalCash)),
        template.insertStrong(totalInvoices)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function paxFinanceOverview() {

  var totalCash = data.lookup('PAX_Sum_Cash')[0].total;
  var totalInvoices = data.lookup('PAX_Cash_Total_Invoice')[0].total;

  var sectionTemplate = template.reports('Section', 'cash_pax');
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong(filterCurrency(totalCash)),
        template.insertStrong(totalInvoices)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function accounts() {

  // FIXME Temporary
  return template.fetch('header').replace(/{{HEADER_TEXT}}/g, template.reports('Header', 'accounts'));
}

function categoryPrincipal() {
  // FIXME Temporary
  return template.fetch('header').replace(/{{HEADER_TEXT}}/g, template.reports('Header', 'principal'));
}

function principalIncomeExpense() {
  var result = data.lookup('HBB_Principal_Cash_Income_Expense');

  var journal_debit = result[0].debit || 0;
  var journal_credit = result[0].credit || 0;

  //var ledger_debit = result[1].debit;
 // var ledger_credit = result[1].credit;

  var sectionTemplate = template.reports('Section', 'principal_income_expense');

  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong('$'.concat((journal_debit).toFixed(2))),
        template.insertStrong('$'.concat((journal_credit).toFixed(2)))
        );
  return template.compileSection(sectionTemplate.heading, report);
}

function principalBalance() {

  //var result = data.lookup('HBB_Principal_Cash_Balance');

 var result = data.lookup('HBB_Principal_Cash_Income_Expense');
 var debit = result[0].debit || 0;
 var credit = result[0].credit || 0;

  var journal_balance = debit -  credit;
  //var ledger_balance = result[1].balance;

  var sectionTemplate = template.reports('Section', 'principal_balance');

  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong('$'.concat((journal_balance).toFixed(2)))
        );
  return template.compileSection(sectionTemplate.heading, report);
}

function subsidyIMA() {
  var totalCost = data.lookup('IMA_Total')[0].total || 0;
  var totalPatients = data.lookup('IMA_Patients')[0].total;

  var sectionTemplate = template.reports('Section', 'subsidy');
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong('$'.concat(totalCost.toFixed(2))),
        template.insertStrong(totalPatients)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function sale() {
  var saleNumber = data.lookup('Basic_Sale')[0].total;
  var saleItems = data.lookup('Sale_Items')[0].total;

  var sectionTemplate = template.reports('Section', 'sale');
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong(saleNumber),
        template.insertStrong(saleItems)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function fiche() {
  var newFicheCount = data.lookup('New_Fiche')[0].total;
  var oldFicheCount = data.lookup('Old_Fiche')[0].total;

  var sectionTemplate = template.reports('Section', 'fiche');
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong((newFicheCount + oldFicheCount)),
        template.insertStrong(newFicheCount),
        template.insertStrong(oldFicheCount)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function experimental() {
  return template.header.replace(/{{HEADER_TEXT}}/g, template.reports('Header', 'experimental'));
}

// Currently only FC
function filterCurrency (value) {
  var symbol = 'FC';
  var separator = '.';
  var decimal = ',';

  var decimalDigits, template;

  //From application filter.js
  value = (value || 0).toFixed(2);
  decimalDigits = value.slice(value.indexOf('.')+1, value.indexOf('.') + 3);

  if (decimalDigits) { value = value.slice(0, value.indexOf('.')); }
  template = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1'+separator);
  template += decimal + decimalDigits + symbol;

  return template;
}

function handleError(error) {
  console.log('handleError', error);

  // Stop termination
}
