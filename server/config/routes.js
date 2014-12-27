/**
 * Application Routing 
 *   
 * Initialise link between server paths and controller logic
 *
 * TODO Pass authenticate and authorize middleware down through 
 * controllers, allowing for modules to subscribe to different 
 * levels of authority
 *
 * TODO createPurhcase, createSale, serviceDist are all almost
 * identicale modules - they should all be encapsulated as one 
 * module. For Example finance.createSale, finance.createPurchase
 */

// Require application controllers
var data            = require('./../controllers/data');
var location        = require('./../controllers/location');

var createPurchase  = require('./../controllers/createPurchase');
var createSale      = require('./../controllers/createSale');

var serviceDist     = require('./../controllers/serviceDist');
var consumptionLoss = require('./../controllers/consumptionLoss');
var trialbalance    = require('./../controllers/trialbalance');
var journal         = require('./../controllers/journal');
var ledger          = require('./../controllers/ledger');
var fiscal          = require('./../controllers/fiscal');
var report          = require('./../controllers/report');
var tree            = require('./../controllers/tree');

var uncategorised   = require('./../controllers/uncategorised');

var compileReport   = require('./../controllers/reports_proposed/reports.js');

exports.initialise = function (app) { 
  console.log('[config/routes] Configure routes');
  
  app.get('/', uncategorised.exposeRoot);

  // Application data
  app.post('/data/', data.create);
  app.get('/data/', data.read);
  app.put('/data/', data.update);
  app.delete('/data/:table/:column/:value', data.deleteRecord);
  
  // Locations 
  // -> /location/:scope(list || lookup)/:target(village || sector || province)/:id(optional)
  app.get('/location/villages', location.allVillages);
  app.get('/location/sectors', location.allSectors);
  app.get('/location/provinces', location.allProvinces);
  app.get('/location/village/:uuid', location.lookupVillage);
  app.get('/location/sector/:uuid', location.lookupSector);
  app.get('/location/province/:uuid', location.lookupProvince);
  app.get('/location/detail/:uuid', location.lookupDetail);
  
  app.get('/proof/of/concept/report/', compileReport.build);
  app.get('/proof/of/concept/report/serve/:target', compileReport.serve);
  
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
  app.get('/profit/:id_project/:pc_id', uncategorised.processProfitCenter);
  app.get('/costCenterAccount/:id_enterprise/:cost_center_id', uncategorised.costCenterAccount);
  app.get('/profitCenterAccount/:id_enterprise/:profit_center_id', uncategorised.profitCenterAccount);
  app.get('/removeFromCostCenter/:tab', uncategorised.removeFromCostCenter);
  app.get('/removeFromProfitCenter/:tab', uncategorised.removeFromProfitCenter);
  app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', uncategorised.auxCenterAccount);
  app.get('/getCheckHollyday/', uncategorised.checkHoliday);
  app.get('/getCheckOffday/', uncategorised.checkOffday);
  app.get('/visit/:patientId', uncategorised.logVisit);
  app.get('/caution/:debitor_uuid/:project_id', uncategorised.cautionDebtor);
  app.get('/account_balance/:id', uncategorised.accountBalance);
  app.get('/synthetic/:goal/:project_id?', uncategorised.syntheticGoal);
  app.get('/period/:date', uncategorised.getPeriodByDate);
  app.get('/lot/:inventory_uuid', uncategorised.getInventoryLot);
  app.get('/max_trans/:projectId', uncategorised.maxTransactionByProject);
  app.get('/print/journal', uncategorised.printJournal);
  app.get('/stockIn/:depot_uuid/:df/:dt', uncategorised.stockIn);
  app.get('/expiring/:depot_uuid/:df/:dt', uncategorised.stockExpiringByDepot);
  app.get('/expiring_complete/:tracking_number/:depot_uuid', uncategorised.stockExpiringComplete);
  app.get('/serv_dist_stock/:depot_uuid', uncategorised.distributeStockDepot);
  app.get('/inv_in_depot/:depot_uuid', uncategorised.inventoryByDepot);
  app.get('/inventory/depot/:depot/*', uncategorised.routeDepotQuery);
  app.get('/inventory/drug/:code', uncategorised.routeDrugQuery);  
  app.get('/errorcodes', uncategorised.listErrorCodes);
  app.get('/getAccount6', uncategorised.listIncomeAccounts);
  app.get('/available_payment_period/', uncategorised.availablePaymentPeriod);
  app.get('/getConsumptionDrugs/', uncategorised.listConsumptionDrugs);
  app.get('/getItemInConsumption/', uncategorised.listItemByConsumption);
  app.get('/getTop10Consumption/', uncategorised.listTopConsumption);
  app.get('/getPurchaseOrders/', uncategorised.listPurchaseOrders);
  app.get('/getTop10Donor/', uncategorised.listTopDonors);
  app.get('/getConsumptionTrackingNumber/', uncategorised.listConsumptionByTrackingNumber);
  app.get('/getExpiredTimes/', uncategorised.listExpiredTimes);
  app.get('/getStockEntry/', uncategorised.listStockEntry);
  app.get('/getStockConsumption/', uncategorised.listStockConsumption);
  app.get('/getNombreMoisStockControl/:inventory_uuid', uncategorised.frenchEnglishRoute);
  app.get('/monthlyConsumptions/:inventory_uuid/:nb', uncategorised.listMonthlyConsumption);
  app.get('/getDelaiLivraison/:id', uncategorised.frenchRoute);
  app.get('/getCommandes/:id', uncategorised.listCommandes);
  app.get('/getMonthsBeforeExpiration/:id', uncategorised.formatLotsForExpiration);

  // Added since route structure development 
  app.post('/payTax/', uncategorised.submitTaxPayment);
  app.post('/posting_donation/', uncategorised.submitDonation);

  app.put('/setTaxPayment/', uncategorised.setTaxPayment);

  app.get('/cost_periodic/:id_project/:cc_id/:start/:end', uncategorised.costByPeriod);
  app.get('/profit_periodic/:id_project/:pc_id/:start/:end', uncategorised.profitByPeriod);
  app.get('/getAccount7/', uncategorised.listExpenseAccounts);
  app.get('/taxe_ipr_currency/', uncategorised.listTaxCurrency);
  app.get('/getReportPayroll/', uncategorised.buildPayrollReport);
  app.get('/getDataPaiement/', uncategorised.listPaiementData);
  app.get('/getDataRubrics/', uncategorised.listRubricsData);
  app.get('/getDataTaxes/', uncategorised.listTaxesData);
  app.get('/getEmployeePayment/:id', uncategorised.listPaymentByEmployee);
  app.get('/getDistinctInventories/', uncategorised.listDistinctInventory);
  app.get('/getEnterprisePayment/:employee_id', uncategorised.listPaymentByEnterprise);
  app.get('/getPeriodeFiscalYear/', uncategorised.lookupPeriod);
  app.get('/getExploitationAccount/', uncategorised.listExploitationAccount);

  // Added since server structure <--> v1 merge
  app.post('/payCotisation/', uncategorised.payCotisation);
  app.post('/posting_promesse_payment/', uncategorised.payPromesse);
  
  app.put('/setCotisationPayment/', uncategorised.setCotisationPayment);

  app.get('/getEmployeeCotisationPayment/:id', uncategorised.listEmployeeCotisationPayments);
  
};
