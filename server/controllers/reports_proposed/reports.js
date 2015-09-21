/**
 * @description
 *
 * @returns 
 *
 * @todo Report index now driven by database, a number of reports have been hardcoded
 * using 'documentHandler', these should be migrated into lines in the 'report' table
 * and removed from documentHandler as soon as possible
 *
 * @todo reports to prove integrations 
 * - Chart of accounts 
 * - Income vs. Expense 
 * - ?Balance
 * - Sale records 
 * - State of employment
 *
 * @todo Either fully support or fully depreciate reports created during prototype
 */

var path                    = require('path');
var fs                      = require('fs');
var q                       = require('q');
var db                      = require('./../../lib/db');

// Import and compile template files
var dots                    = require('dot').process({path : path.join(__dirname, 'templates')});

var wkhtmltopdf             = require('wkhtmltopdf');
var uuid                    = require('./../../lib/guid');
var config                  = require('./config');

// DEPRECIATED Document contexts
var invoiceContext          = require('./data/prototype_legacy/invoice');
var balanceContext          = require('./data/prototype_legacy/balance_sheet');
var bilanContext            = require('./data/prototype_legacy/bilan');
var grandLivreContext       = require('./data/prototype_legacy/grand_livre');
var EmployeeStateContext    = require('./data/prototype_legacy/employee_state');
var accountResultContext    = require('./data/prototype_legacy/account_result');

// Module configuration
var writePath = path.join(__dirname, 'out/');

var contextPath = './data/';

// Used to track initialising state - requests during loading are currently denied
var moduleLoading = false;
var reportIndex = {};

// TODO: All of these should be driven be either a JSON configuration file or 
// by the report index in the database. 
// TODO: Recommend convention based context and template loading, based on 
// database record report_key, {report_key}.template.dot, {report_key}.content.js

// DEPRECIATED - reports now driven by database (remove from object as updated)
// Map templates and context compilation to request targets
var documentHandler = {
  invoice : {
    template : dots.invoice,
    context : invoiceContext
  },
  balance : {
    template : dots.balance_sheet,
    context : balanceContext
  },
  bilan : {
    template : dots.bilan,
    context : bilanContext
  },
  grand_livre : {
    template : dots.grand_livre,
    context : grandLivreContext
  },
  employee_state : {
    template : dots.employee_state, //templating provider
    context : EmployeeStateContext // data provider
  },
  result_account : {
    template : dots.account_result, //templating provider
    context :  accountResultContext // data provider
  }
};

// Perform initial settup
initialise();

exports.serve = function (req, res, next) {
  var target = req.params.target;
  var options = {root : writePath};

  res.sendFile(target.concat('.pdf'), options, function (err, res) {
    if (err) {
      next(err);
    } else {

      // Delete (unlink) served file
      /*fs.unlink(path.join(__dirname, 'out/').concat(target, '.pdf'), function (err) {
        if (err) throw err;
      });*/
    }
  });
};

// TODO refactor 
exports.index = function (req, res, next) { 
  var indexQuery = 'SELECT * FROM `report`';

  db.exec(indexQuery)
    .then(function (reportsIndex) { 
      res.json(reportsIndex);
    })
    .catch(function (err) { next(err); })
    .done();
};

// Designed to be able to handle additional type logic; CSV, PDF
exports.listArchives = function (req, res, next) { 
  var archiveQuery = 'SELECT report_archive.*, user.first, user.last from `report_archive` LEFT JOIN user ON report_archive.user_id = user.id WHERE `report_archive`.`report_id` = ? ORDER BY report_archive.created DESC';
  var reportId = req.params.id;

  db.exec(archiveQuery, [reportId])
    .then(function (archives) { 
      res.json(archives);
    })
    .catch(function (err) { next(err); })
    .done();
};

exports.build = function (req, res, next) {
  var target = req.params.route; //contains the kind of report to build e.g : bilan, grand livre etc ...
  var renderTarget = renderPDF; //renderPDF is a function which handle the pdf generation process
  
  var definition = reportIndex[target];
  var handler = documentHandler[target]; //handler will contain a object with two property, template for structure and context for data
  var options = req.body;

  // TODO Refactor - build -> if ready -> build method
  if (moduleLoading) { 

    // FIXME Use standard error handling
    res.status(500).end('Reporting module is not ready');

    // End build propegation
    return; 
  }
  
  // FIXME No time to migrate all previous reports - ungraceful depreciation
  if (documentHandler[target] && !definition) { 
    res.status(500).end('This report has been depreciated. In order to use this report please update to the new API');
    return; 
  }

  // Module does not support the requested document
  if (!definition) {

    // FIXME Use standard error handling
    res.status(500).end('Invalid or Unknown document target');
  } else {

    console.log('create document request');
    console.log('using definition', definition);

    var context = definition.context;
  
    // Assign ID of user making report request to be used throughout archiving 
    options.user = req.session.user.id;

    context.compile(options)
    .then(renderTarget)
    .catch(next);
  }

  function renderPDF(reportData) {
    var compiledReport;
    var hash = uuid();

    var format = options.format || 'standard';
    var language = options.language || 'en';
    var configuration = buildConfiguration(hash, format);
  
    // FIXME pass key into method
    var templater = dots[definition.key];

    // Ensure templates have path data
    reportData.path = reportData.path || __dirname;
    compiledReport = templater(reportData);



    // wkhtmltopdf exceptions not handled
    // TODO Verify with wkhtmltopdf docs that the first parameter will ONLY ever return error codes
    var pdf = wkhtmltopdf(compiledReport, configuration, function (errorCode, signal, a) {
    
      if (errorCode) { 
        next(errorCode);
      } else { 
        var servePath = '/report/serve/';
        
        console.log('configuration', configuration);

        // TODO Link DB Driven report definition through to server
        // Write to archive unless option disabled
        writeArchive(definition, hash, options)
          .then(function (result) { 
            
            console.log('res', result);

            lookupArchive(result.insertId)
            .then(function (result) { 

              result.hash = servePath.concat(hash);
              res.send(result);  
            })
            .catch(function (error) { 
              next(error);
            });
          })
          .catch(function (error) { 
            next(error); 
          });
      }
    });
  }
};

// Link file PATH, options and timestamp
function writeArchive(definition, hash, options) { 
  var deferred = q.defer();
  var insertQuery = 'INSERT INTO `report_archive` (report_id, title, path, user_id) VALUES (?, ?, ?, ?)';
 
  // Default values
  var title = options.title || definition.title.concat(' ', new Date().toDateString());
  
  db.exec(insertQuery, [definition.id, title, hash, options.user])
    .then(function (result) { 
      console.log('archive written');

      deferred.resolve(result);
    })
    .catch(function (error) { 
      
      deferred.reject(error);
      // throw error;
    });

    return deferred.promise;
}

function lookupArchive(id) { 
  var deferred = q.defer();
  var archiveQuery = "SELECT report_archive.*, user.first, user.last FROM report_archive LEFT JOIN user ON report_archive.user_id = user.id WHERE report_archive.id = ?";
  
  db.exec(archiveQuery, [id])
    .then(function (result) { 
      deferred.resolve(result);
    })
    .catch(function (error) { 
      deferred.reject(error);
    });

  return deferred.promise;
}
  
// Template convention dots.{{report_key}}
function getReportTemplate(key) { 
  return dots[key]; 
}
  
// Return configuration object for wkhtmltopdf process
function buildConfiguration(hash, size) {
  var context = config[size] || config.standard;
  var hash = hash || uuid();

  context.output = writePath.concat(hash, '.pdf');
  return context;
}

function initialise() {
  
  var indexQuery = 'SELECT * FROM `report`';
  
  moduleLoading = true;

  // Ensure write folder exists - wkhtmltopdf will silently fail without this
  fs.exists(writePath, function (exists) {

    if (!exists) {
      fs.mkdir(writePath, function (err) {
        if (err) throw err;

        console.log('[controllers/report] output folder written :', writePath);
      });
    }
  });
  
  // Load initial reports index - (this can be updated in future if reports can be 
  // manually configured
  db.exec(indexQuery)
    .then(function (reports) { 
      
      // TODO Decide if reports should be indexed by ID
      // + No string matching on report building, integers matched
      // - /report/1/build/ is less semantic than /report/balance/build
      
      // Index by reprot key
      reports.forEach(function (report) {
        reportIndex[report.key] = report;

        loadReportContext(report.key, report);
      });

      moduleLoading = false;
    })
    .catch(function (err) { 
      console.error('Initialise error');
      throw err;
    })
    .done();
}

function loadReportContext(key, report) { 
  var deferred = q.defer();
  
  // Context modules loaded by convention - {{report_key}}.js
  var contextTarget = contextPath.concat(key);
 
  try { 
    var context = require(contextTarget);
    report.context = context;

  } catch (e) { 

    console.error(e);
    console.warn('Report registered in database with key [', key, '] is missing a data controller. This report will not function.');
  }
     
  return deferred.promise;
}
