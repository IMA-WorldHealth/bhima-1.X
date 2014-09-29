// Controllers 
var data = require('./../controllers/data');

// TODO createPurchase, createSale etc. could be combined in one module named finance 
// finance.createSale
var createPurchase = require ('./../controllers/createPurchase');
var createSale = require('./../controllers/createSale');

var serviceDist = require('./../controllers/serviceDist');
var consumptionLoss = require('./../controllers/consumptionLoss');
var trialbalance = require('./../controllers/trialbalance');
var journal = require('./../controllers/journal');
var ledger = require('./../controllers/ledger');
var fiscal = require('./../controllers/fiscal');
var report = require('./../controllers/report');
var tree = require('./../controllers/tree');

var uncategorised = require('./../controllers/uncategorised');


/**
 * Initialise link between server paths and controller logic
 *
 * TODO Pass authenticate and authorize middleware down through 
 * controllers, allowing for modules to subscribe to different 
 * levels of authority
*/
exports.initialise = function (app) { 
  console.log('[routes.js] Initialise routes');

  app.post('/data/', data.create);
  app.get('/data/', data.read);
  app.put('/data/', data.update);
  app.delete('/data/:table/:column/:value', data.deleteRecord);

  // TODO All of these methods should be operations on a module
  // /i.e finance.createSale
  app.post('/purchase', createPurchase.execute);
  app.post('/sale/', createSale.execute);
  app.post('/service_dist/', serviceDist.execute);
  app.post('/consumption_loss/', consumptionLoss.execute);
 
  app.get('/trialbalance/initialize', trialbalance.initialiseTrialBalance);
  app.get('/trialbalance/submit/:key/', trialbalance.submitTrialBalance);
  
  app.get('/journal/:table/:id', journal.lookupTable);
  
  app.get('/ledgers/debitor/:id', ledger.compileDebtorLedger);
  app.get('/ledgers/debitor_group/:id', ledger.compileGroupLedger);
  app.get('/ledgers/distributableSale/:id', ledger.compileSaleLedger);

  app.get('/fiscal/:enterprise/:startDate/:endDate/:description', fiscal.writeYear);

  app.get('/reports/:route/', report.buildReport);

  app.get('/tree', tree.generate);

  // TODO These routes all belong somewhere 
  app.get('/services/', uncategorised.services);
  app.get('/available_cost_center/', uncategorised.availableCenters);
  app.get('/employee_list/', uncategorised.listEmployees);
  app.get('/journal_list/', uncategorised.listJournal);
  app.get('/hollyday_list/:pp/:employee_id', uncategorised.listHolidays);
  app.get('/available_profit_center/', uncategorised.listAvailableProfitCenters);
  app.get('/currentProject', uncategorised.currentProject);
  app.get('/user_session', uncategorised.userSession);
  app.get('/pcash_transfer_summers', uncategorised.pcashTransferSummers);
  app.get('/editsession/authenticate/:pin', uncategorised.authenticatePin);
  app.get('/max/:id/:table/:join?', uncategorised.lookupMaxTableId);
  app.get('/InExAccounts/:id_enterprise/', uncategorised.listInExAccounts);
  app.get('/availableAccounts/:id_enterprise/', uncategorised.listEnterpriseAccounts);
  app.get('/availableAccounts_profit/:id_enterprise/', uncategorised.listEnterpriseProfitAccounts);
  app.get('/cost/:id_project/:cc_id', uncategorised.costCenterCost);
  app.get('/profit/:id_project/:service_id', uncategorised.processProfitCenter);
  app.get('/costCenterAccount/:id_enterprise/:cost_center_id', uncategorised.costCenterAccount);
  app.get('/profitCenterAccount/:id_enterprise/:profit_center_id', uncategorised.profitCenterAccount);
  app.get('/removeFromCostCenter/:tab', uncategorised.removeFromCostCenter);
  app.get('/removeFromProfitCenter/:tab', uncategorised.removeFromProfitCenter);
  app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', uncategorised.auxCenterAccount);
  app.get('/getCheckHollyday/', uncategorised.checkHoliday);
  app.get('/getCheckOffday/', uncategorised.checkOffday);
};

//Temporary (for C + V) 
/*
var db = require('./../lib/db');
var parser = require('./../lib/parser');
var journal = require('./journal');
var uuid = require('./../lib/guid');
*/


