#!/usr/local/bin/node
var q = require('q');
var fs = require('fs');

var template = require('./lib/template.js');
var data = require('./lib/data.js');
var mail = require('./lib/interface.js');
var util = require('./lib/util.js');

var enterprise = "IMCK";

// TODO This is derived from send.js (from cron job)
var service = "daily";
var language = "en";

// FIXME
var reportDate = new Date();
var timestamp = reportDate.toLocaleDateString();
var reportReference = util.generateUuid();

var reportQuery = {};

var include = [
  overview,
  breakdown,
  patientTotalReport,
  sale,
  financeOverview,
  accounts,
  fiche,
  subsidyIMA
];

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
    "New_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + util.date.from + " AND registration_date <= " + util.date.to + " AND renewal = 0;",
    "Renewal_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + util.date.from + " AND registration_date <= " + util.date.to + " AND renewal = 1;",
    "Sum_Cash" : "SELECT SUM(cost) as 'total' FROM cash where date = " + util.date.from + ";",
    "Cash_Total_Invoice" : "SELECT COUNT(invoice_uuid) as 'total' FROM cash join cash_item where cash_item.cash_uuid = cash.uuid AND date = " + util.date.from + ";",
    "IMA_Total" : "SELECT SUM(debit) as 'total' FROM posting_journal where account_id = 1062 AND trans_date = " + util.date.from + ";",
    "IMA_Patients" : "SELECT COUNT(distinct sale.debitor_uuid) as 'total' from posting_journal join sale where posting_journal.inv_po_id = sale.uuid AND account_id = 1062 AND trans_date = " + util.date.from + ";",
    "New_Fiche" : "SELECT COUNT(sale.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020002) AND sale.invoice_date = " + util.date.from + ";",
    "Old_Fiche" : "SELECT COUNT(sale.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020003) AND sale.invoice_date = " + util.date.from + ";",
    "Basic_Sale" : "SELECT COUNT(uuid) as 'total' FROM sale WHERE invoice_date = " + util.date.from + ";",
    "Sale_Items" : "SELECT COUNT(sale_item.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid and invoice_date = " + util.date.from + ";"
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
  var header = enterprise + " | " + timestamp;
  
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
  

  template.produceReport(sessionTemplate.join("\n"), path);
  
  // Write the name of the file written to standard out
  console.log(path);
  data.end();
}

// Temporary methods for initial email
function messageInfo() {
  return template.fetch('message').replace(/{{ALERT_MESSAGE}}/g, template.reports("Section", "alert_one").content);
}

function messagePax() {
  return template.fetch('message').replace(/{{ALERT_MESSAGE}}/g, template.reports("Section", "alert_two").content);
}

function overview() { 
  return template.fetch('header').replace(/{{HEADER_TEXT}}/g, template.reports("Header", "overview"));
}

function breakdown() { 
  var patientNew = data.lookup('New_Patients')[0].total;
  var patientReturning = data.lookup('Renewal_Patients')[0].total;

  var structureTemplate = template.fetch('table');
  var headerTemplate = template.fetch('tableHeader');
  var rowTemplate = template.fetch('tableRow');
  
  var row = [], table, header, body;
  
  // Populate Header 
  header = template.replace(headerTemplate, "{{DATA_ONE}}", "");
  header = template.replace(header, "{{DATA_TWO}}", "IMCK HBB");
  header = template.replace(header, "{{DATA_THREE}}", "IMCK PAX");
  
  // Populate Body
  row[0] = template.replace(rowTemplate, "{{DATA_ONE}}", "New Patients");
  row[0] = template.replace(body, "{{DATA_TWO}}", patientNew);
  row[0] = template.replace(body, "{{DATA_THREE}}", patientReturning);
  
  // Populate Table
  table = template.replace(structureTemplate, "{{HEADER_CONTENT}}", header);
  table = template.replace(table, "{{BODY_CONTENT}}", body);

  return table;
}
// TODO create a section object with basic methods, introduce header and content etc.
function patientTotalReport() {
  var totalNew = data.lookup('New_Patients')[0].total;
  var totalReturning = data.lookup('Renewal_Patients')[0].total;
  
  var sectionTemplate = template.reports("Section", "registration");
  var report =
    template.compile(
        sectionTemplate.content,
        template.insertStrong(totalNew + totalReturning),
        template.insertStrong(totalReturning),
        template.insertStrong(totalNew)
        );

  return template.compileSection(sectionTemplate.heading, report);
}

function financeOverview() {
  var totalCash = data.lookup('Sum_Cash')[0].total;
  var totalInvoices = data.lookup('Cash_Total_Invoice')[0].total;
  
  var sectionTemplate = template.reports("Section", "cash");
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
  return template.fetch('header').replace(/{{HEADER_TEXT}}/g, template.reports("Header", "accounts"));
}

function subsidyIMA() { 
  var totalCost = data.lookup('IMA_Total')[0].total || 0;
  var totalPatients = data.lookup('IMA_Patients')[0].total;
  
  var sectionTemplate = template.reports("Section", "subsidy");
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
  
  var sectionTemplate = template.reports("Section", "sale");
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
  
  var sectionTemplate = template.reports("Section", "fiche");
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
  return template.header.replace(/{{HEADER_TEXT}}/g, template.reports("Header", "experimental"));
}

// Currently only FC
function filterCurrency (value) {
  var symbol = "FC";
  var separator = ".";
  var decimal = ",";
  
  var decimalDigits, template;
  
  //From application filter.js
  value = (value || 0).toFixed(2);
  decimalDigits = value.slice(value.indexOf('.')+1, value.indexOf('.') + 3);

  if (decimalDigits) value = value.slice(0, value.indexOf('.'));
  template = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1"+separator);
  template += decimal + decimalDigits + symbol;
  
  return template;
}

function handleError(error) {
  throw error;
}

// Temporary - ensure out exists
function configureEnvironment() {
  var deferred = q.defer();
    
  fs.exists('./out', function (result) {
    if (result) return deferred.resolve();
    
    fs.mkdir('out', function () {
      return deferred.resolve();
    });
  });
  return deferred.promise;
}
