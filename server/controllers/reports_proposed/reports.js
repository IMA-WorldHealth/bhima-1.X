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
var dots                    = require('dot');
var templates = dots.process({path : [path.join(__dirname, 'templates/')]});

// Support legacy reports - this should be removed as soon as possible
var legacyTemplates = dots.process({path : path.join(__dirname, 'templates/prototype_legacy')});

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

// DEPRECIATED - reports now driven by database (remove from object as updated)
// Map templates and context compilation to request targets
var documentHandler = {
  invoice : {
    template : legacyTemplates.invoice,
    context : invoiceContext
  },
  balance : {
    template : legacyTemplates.balance_sheet,
    context : balanceContext
  },
  bilan : {
    template : legacyTemplates.bilan,
    context : bilanContext
  },
  grand_livre : {
    template : legacyTemplates.grand_livre,
    context : grandLivreContext
  },
  employee_state : {
    template : legacyTemplates.employee_state, //templating provider
    context : EmployeeStateContext // data provider
  },
  result_account : {
    template : legacyTemplates.account_result, //templating provider
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
  var options = req.body;

  // TODO Remove given all depreciated reports upgraded or removed
  var supportingLegacy = false;

  if (moduleLoading) { 

    // FIXME Use standard error handling
    res.status(500).end('Reporting module is not ready');

    // End build propegation
    return; 
  }
  
  // Depreciated report exists - support this to be removed as soon as possible
  if (!definition && documentHandler[target]) { 
  
    console.log('Report [', target, '] has been depreciated and should be updated to use the new report API');
    definition = documentHandler[target];
    supportingLegacy = true;
  }

  // Module does not support the requested document
  if (!definition) {

    // FIXME Use standard error handling
    res.status(500).end('Invalid or Unknown document target');
  } else {
    
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
    
    var headerHeading = reportData.heading || '';
  
    // TODO Flag on and off groups with client definitions
    configuration['headerRight'] =  headerHeading.concat(' [page]/[toPage]');
    configuration['noHeaderLine'] = true;
    configuration['headerFontName'] = 'Tinos';
    configuration['marginTop'] = '5mm';

    var templater; 

    // TODO Remove legacy support 
    if (supportingLegacy) { 
      templater = definition.template;
    } else { 

      // Not supporting legacy report - template can be derived directly according to the new API
      templater = templates[definition.key];
    }
  
    // Ensure templates have path data
    reportData.path = reportData.path || __dirname;
    compiledReport = templater(reportData);
  
    // TODO Verify with wkhtmltopdf docs that the first parameter will ONLY ever return error codes
    var pdf = wkhtmltopdf(compiledReport, configuration, function (errorCode, signal, a) {
    
      if (errorCode) { 
        next(errorCode);
      } else { 
        var servePath = '/report/serve/';
        
        // TODO Remove legacy support 
        if (supportingLegacy) { 
          
          // Legacy reports (prototypes) have no archive records in the database
          res.send(servePath.concat(hash));
        } else { 

          
          // TODO Link DB Driven report definition through to server
          // Write to archive unless option disabled
          writeArchive(definition, hash, options)
            .then(function (result) { 
              
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
  return templates[key]; 
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
    
    console.log('loading data module', key);

  } catch (e) { 

    console.error(e);
    console.warn('Report registered in database with key [', key, '] is missing a data controller. This report will not function.');
  }
     
  return deferred.promise;
}
