#!/usr/local/bin/node

// TODO everything should be split into smaller utilities, DI etc.
// TODO graphing thing using d3.js 
// TODO check if file report exists, create it, create folder for tmp files (reportReference)


var q = require('q');
var fs = require('fs');

var template = require('./lib/template.js');
var data = require('./lib/data.js');
var mail = require('./lib/interface.js');
var util = require('./lib/util.js');


// Define report date, could be set in the past
var reportDate = new Date();

// TEMPORARY set the date back two days
// reportDate.setDate(reportDate.getDate());

var enterprise = "IMCK";
var timestamp = reportDate.toLocaleDateString();
var reportReference = util.generateUuid();




var template = {};

var dateFrom, dateTo;

// Hacky ordering
configureDates();

// TODO hardcoded subsidy account etc. 
// TODO hardcoded fiche data 
// Configure all data
var reportQuery = { 
  "New_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + dateFrom + " AND registration_date <= " + dateTo + " AND renewal = 0;",
  "Renewal_Patients" : "SELECT COUNT(uuid) as 'total' FROM patient WHERE registration_date >= " + dateFrom + " AND registration_date <= " + dateTo + " AND renewal = 1;",
  "Sum_Cash" : "SELECT SUM(cost) as 'total' FROM cash where date = " + dateFrom + ";",
  "Cash_Total_Invoice" : "SELECT COUNT(invoice_uuid) as 'total' FROM cash join cash_item where cash_item.cash_uuid = cash.uuid AND date = " + dateFrom + ";",
  "IMA_Total" : "SELECT SUM(debit) as 'total' FROM posting_journal where account_id = 1062 AND trans_date = " + dateFrom + ";",
  "IMA_Patients" : "SELECT COUNT(distinct sale.debitor_uuid) as 'total' from posting_journal join sale where posting_journal.inv_po_id = sale.uuid AND account_id = 1062 AND trans_date = " + dateFrom + ";",
  "New_Fiche" : "SELECT COUNT(sale.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020002) AND sale.invoice_date = " + dateFrom + ";",
  "Old_Fiche" : "SELECT COUNT(sale.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid AND sale_item.inventory_uuid = (SELECT uuid from inventory where code = 020003) AND sale.invoice_date = " + dateFrom + ";",
  "Basic_Sale" : "SELECT COUNT(uuid) as 'total' FROM sale WHERE invoice_date = " + dateFrom + ";",
  "Sale_Items" : "SELECT COUNT(sale_item.uuid) as 'total' FROM sale join sale_item where sale_item.sale_uuid = sale.uuid and invoice_date = " + dateFrom + ";"
}
var queryResults = {};

var include = [
  overview,
  patientTotalReport,
  sale,
  financeOverview,
  accounts,
  fiche,
  subsidyIMA
  // experimental
];

var documentStructure, documentContent;

// Temporary, these should belong somewhere 
var strongValue = "<strong style='font-size: 18px; color: #686868;'>%s</strong>"
  
initialise();

function initialise () {
  data.process(reportQuery)
  .then(function (result) {
    console.log(result('New_Patients'));
    data.end();
  })
  .catch(function (error) { 
    console.log(error); 
  });
}

// populateTemplates().then(function (result) { 
//   console.log('[buildReport.js] Loaded template files...');  
//   
//   // Initialise 
//   documentStructure = template.structure;
//   documentContent = '';
//   
//   populateQuery().then(writeHeader);
//   
//   // var output = template.structure.replace(/{{REPORT_REFERENCE}}/g, generateUuid());
//   // writeFile('completeReport.tmp', output);
// });

function writeHeader() { 
  
  var header = enterprise + " | " + timestamp;
  documentStructure = documentStructure.replace(/{{HEADERLINE}}/g, header);
  documentStructure = documentStructure.replace(/{{REPORT_REFERENCE}}/g, reportReference);
  // writeFile('compiledReport.html', documentStructure);

  
  return collateReports();
}

function collateReports() {  
  var sessionTemplate = [];
 
  try { 
  include.forEach(function (templateMethod) { 
    sessionTemplate.push(templateMethod());  
  });

  }catch(e) { 

    console.log(e);
  }
  
  documentContent = sessionTemplate.join("\n");
  
  writeFile('compiledReport.html', documentStructure.replace(/{{REPORT_BODY}}/g, documentContent)); 
  session.end();
}
  
function overview() { 
  return template.header.replace(/{{HEADER_TEXT}}/g, 'Overview');
}

// TODO create a section object with basic methods, introduce header and content etc.
function patientTotalReport() { 
  var sectionTemplate = template.section;
  var sectionHeading = "Patient Registration", sectionBody;
  
  var totalNew = queryResults['New_Patients'][0].total;
  var totalReturning = queryResults['Renewal_Patients'][0].total;
  
  sectionBody = [
    "Today,",
    printf(strongValue, (totalNew + totalReturning).toString()),
    "patients where registered;",
    printf(strongValue, totalNew.toString()),
    "patients new to the hospital, and",
    printf(strongValue, totalReturning.toString()),
    "returning."
  ];
    
  sectionTemplate = sectionTemplate.replace(/{{SECTION_HEADING}}/g, sectionHeading);
  sectionTemplate = sectionTemplate.replace(/{{SECTION_BODY}}/g, sectionBody.join(' '));
    
  return sectionTemplate;
}

function financeOverview() { 
  var sectionTemplate = template.section;
  var sectionHeading = "HBB Cash Box", sectionBody;

  var totalCash = queryResults['Sum_Cash'][0].total;
  var totalInvoices = queryResults['Cash_Total_Invoice'][0].total;

  sectionBody = [
    printf(strongValue, filterCurrency(totalCash)),
    "where introduced at the Caisse Aux HBB, paid against a total of",
    printf(strongValue, totalInvoices.toString()),
    "invoices."
  ];

  
  sectionTemplate = sectionTemplate.replace(/{{SECTION_HEADING}}/g, sectionHeading);
  sectionTemplate = sectionTemplate.replace(/{{SECTION_BODY}}/g, sectionBody.join(' '));

  return sectionTemplate;
}

function accounts() { 
  return template.header.replace(/{{HEADER_TEXT}}/g, 'Accounts'); 
}

function subsidyIMA() { 
  var sectionTemplate = template.section;
  var sectionHeading = "IMA Subsidy", sectionBody;

  var totalCost = queryResults['IMA_Total'][0].total;
  var totalPatients = queryResults['IMA_Patients'][0].total;
  
  sectionBody = [
    "The IMA subsidy was charged a total of",
    printf(strongValue, '$'.concat(totalCost.toFixed(2))),
    "enabling",
    printf(strongValue, totalPatients.toString()),
    "patients to receive health care."
  ];

  sectionTemplate = sectionTemplate.replace(/{{SECTION_HEADING}}/g, sectionHeading);
  sectionTemplate = sectionTemplate.replace(/{{SECTION_BODY}}/g, sectionBody.join(' '));
  
  return sectionTemplate;
}

function sale() { 
  // Includes outpatient and hospitalised
  var sectionTemplate = template.section;
  var sectionHeading = "Invoice", sectionBody;

  var saleNumber = queryResults['Basic_Sale'][0].total;
  var saleItems = queryResults['Sale_Items'][0].total;

  sectionBody = [
    printf(strongValue, saleNumber.toString()),
    "invoice transactions where submitted consisting of",
    printf(strongValue, saleItems.toString()), 
    "line items, this includes both hospitilised and outpatient invoices."
  ];

  sectionTemplate = sectionTemplate.replace(/{{SECTION_HEADING}}/g, sectionHeading);
  sectionTemplate = sectionTemplate.replace(/{{SECTION_BODY}}/g, sectionBody.join(' '));

  return sectionTemplate;
}

function fiche() { 
  var sectionTemplate = template.section;
  var sectionHeading = "Fiche Consultation", sectionBody;
  
  var newFicheCount = queryResults['New_Fiche'][0].total;
  var oldFicheCount = queryResults['Old_Fiche'][0].total;

  sectionBody = [
    "A total of",
    printf(strongValue, (newFicheCount + oldFicheCount).toString()),
    "charges where made for fiche consulations;",
    printf(strongValue, newFicheCount.toString()),
    "for 'Nouvelle Fiche' and",
    printf(strongValue, oldFicheCount.toString()),
    "for 'Ancienne Fiche'." 
  ];
  
  sectionTemplate = sectionTemplate.replace(/{{SECTION_HEADING}}/g, sectionHeading);
  sectionTemplate = sectionTemplate.replace(/{{SECTION_BODY}}/g, sectionBody.join(' '));

  return sectionTemplate;
}

function experimental() { 
  return template.header.replace(/{{HEADER_TEXT}}/g, 'Experimental Reports');
}

// TODO Date from and to can be set in configuration file 
function configureDates() { 
  
  dateFrom = "\'" + reportDate.getFullYear() + "-0" + (reportDate.getMonth() + 1) + "-" + reportDate.getDate() + " 00:00:00\'";
  
  reportDate.setDate(reportDate.getDate() + 1);
  dateTo = "\'" + reportDate.getFullYear() + "-0" + (reportDate.getMonth() + 1) + "-" + reportDate.getDate() + " 00:00:00\'";

  console.log('dateFrom', dateFrom);
  console.log('dateTo', dateTo);
}


// Templating 
function populateTemplates() { 
  var deferred = q.defer();
  var templateStatus = [];
  
  Object.keys(templateRoute).forEach(function (key) { 
    templateStatus.push(readFile(templateRoute[key]));
  });

  q.all(templateStatus).then(function (result) { 
    
    Object.keys(templateRoute).forEach(function (key, index) { 
      template[key] = result[index];
    });
    
    deferred.resolve(template);
  }, function (error) { 
    throw error;
  });
  
  return deferred.promise;
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

// I/O
function readFile(pathToFile) { 
  var deferred = q.defer();
    
  fs.readFile(pathToFile, 'utf8', function (error, result) { 
    if(error) throw error;
    deferred.resolve(result); 
  });

  return deferred.promise;
}

function writeFile(pathToFile, fileContent) { 
  var deferred = q.defer();
  
  fs.writeFile(pathToFile, fileContent, function (error) { 
    if(error) throw error;
    deferred.resolve();
  });

  return deferred.promise;
}

