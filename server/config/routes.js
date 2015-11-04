/**
* Application Routing
*
* Initialise link between server paths and controller logic
*
* TODO Pass authenticate and authorize middleware down through
* controllers, allowing for modules to subscribe to different
* levels of authority
*
* TODO createPurchase, createSale, are all almost
* identicale modules - they should all be encapsulated as one
* module. For Example finance.createSale, finance.createPurchase
*/

// Require application controllers
var data            = require('../controllers/data');
var locations       = require('../controllers/location');

var createPurchase  = require('../controllers/createPurchase');
var createSale      = require('../controllers/createSale');

var consumptionLoss = require('../controllers/consumptionLoss');
var trialbalance    = require('../controllers/trialbalance');
var journal         = require('../controllers/journal');
var ledger          = require('../controllers/ledger');
var fiscal          = require('../controllers/fiscal');
var report          = require('../controllers/report');
var tree            = require('../controllers/tree');
var compileReport   = require('../controllers/reports_proposed/reports.js');
var snis            = require('../controllers/snis');
var extra           = require('../controllers/extraPayment');
var gl              = require('../controllers/ledgers/general');
var finance         = require('../controllers/finance');
var accounts        = require('../controllers/accounts');
var auth            = require('../controllers/auth'),
    projects        = require('../controllers/projects'),
    users           = require('../controllers/users'),
    analytics       = require('../controllers/analytics'),
    stock           = require('../controllers/stock'),
    purchase        = require('../controllers/purchase'),
    inventory       = require('../controllers/inventory'),
    patient         = require('../controllers/patient'),
    depot           = require('../controllers/depot'),
    budget          = require('../controllers/budget'),
    financeServices = require('../controllers/categorised/financeServices'),
    depreciatedInventory = require('../controllers/categorised/inventory_depreciate'),
    depreciatedReports = require('../controllers/categorised/reports_depreciate'),
    employees       = require('../controllers/categorised/employees'),
    caution         = require('../controllers/categorised/caution'),
    errors          = require('../controllers/categorised/errors'),
    taxPayment      = require('../controllers/taxPayment'),
    payroll         = require('../controllers/categorised/payroll'),
    donations       = require('../controllers/donations'),
    subsidies       = require('../controllers/categorised/subsidies');

var patient         = require('../controllers/patient');

// Middleware for handle uploaded file
var multipart       = require('connect-multiparty');

exports.initialise = function (app) {
  console.log('[config/routes] Configure routes');

  // exposed to the outside without authentication
  app.get('/languages', users.getLanguages);
  app.get('/projects', projects.getProjects);

  app.post('/login', auth.login);
  app.get('/logout', auth.logout);

  // application data
  app.post('/data/', data.create);
  app.get('/data/', data.read);
  app.put('/data/', data.update);
  app.delete('/data/:table/:column/:value', data.deleteRecord);

  // location routes
  // -> /location/:scope(list || lookup)/:target(village || sector || province)/:id(optional)
  app.get('/location/villages', locations.allVillages);
  app.get('/location/sectors', locations.allSectors);
  app.get('/location/provinces', locations.allProvinces);
  app.get('/location/village/:uuid', locations.lookupVillage);
  app.get('/location/sector/:uuid', locations.lookupSector);
  app.get('/location/province/:uuid', locations.lookupProvince);
  app.get('/location/detail/:uuid', locations.lookupDetail);

  // -> Add :route
  app.post('/report/build/:route', compileReport.build);
  app.get('/report/serve/:target', compileReport.serve);

  app.post('/purchase', createPurchase.execute);
  app.post('/sale/', createSale.execute);
  app.post('/consumption_loss/', consumptionLoss.execute);

  // trial balance routes
  app.post('/journal/trialbalance', trialbalance.postTrialBalance);
  app.post('/journal/togeneralledger', trialbalance.postToGeneralLedger); // TODO : rename?

  app.get('/journal/:table/:id', journal.lookupTable);
  
  // TODO Transition to journal API (this route should be /journal)
  app.get('/journal_list/', journal.transactions);
  
  
  // ledger routes
  // TODO : needs renaming
  app.get('/ledgers/debitor/:id', ledger.compileDebtorLedger);
  app.get('/ledgers/debitor_group/:id', ledger.compileGroupLedger);
  app.get('/ledgers/employee_invoice/:id', ledger.compileEmployeeLedger);
  app.get('/ledgers/distributableSale/:id', ledger.compileSaleLedger);

  /* fiscal year controller */

  app.get('/fiscal', fiscal.getFiscalYears);
  app.post('/fiscal/create', fiscal.createFiscalYear);

  app.get('/reports/:route/', report.buildReport);

  app.get('/tree', tree.generate);

  // snis controller
  app.get('/snis/getAllReports', snis.getAllReports);
  app.get('/snis/getReport/:id', snis.getReport);
  app.post('/snis/createReport', snis.createReport);
  app.delete('/snis/deleteReport/:id', snis.deleteReport);
  app.post('/snis/populateReport', snis.populateReport);
 
  /**
   * refactor-categorisation
   *
   * @todo test all routes below to ensure no broken links
   */
  
  // Financial services - cost/ profit centers, services etc. 
  app.get('/services/', financeServices.listServices);
  app.get('/available_cost_center/', financeServices.availableCostCenters);
  app.get('/available_profit_center/', financeServices.availableProfitCenters);
  app.get('/cost/:id_project/:cc_id', financeServices.costCenterCost);
  app.get('/profit/:id_project/:pc_id', financeServices.profitCenterCost);
  app.get('/costCenterAccount/:id_enterprise/:cost_center_id', financeServices.costCenterAccount);
  app.get('/profitCenterAccount/:id_enterprise/:profit_center_id', financeServices.profitCenterAccount);
  app.get('/removeFromCostCenter/:tab', financeServices.removeFromCostCenter);
  app.get('/removeFromProfitCenter/:tab', financeServices.removeFromProfitCenter);
  app.get('/auxiliairyCenterAccount/:id_enterprise/:auxiliairy_center_id', financeServices.auxCenterAccount);
 
  // DEPRECIATED Inventory routes - these should be removed as soon as possible
  // FIXME Depreciate routes
  app.get('/lot/:inventory_uuid', depreciatedInventory.getInventoryLot);
  app.get('/stockIn/:depot_uuid/:df/:dt', depreciatedInventory.stockIn);
  app.get('/inv_in_depot/:depot_uuid', depreciatedInventory.inventoryByDepot);
  app.get('/getExpiredTimes/', depreciatedInventory.listExpiredTimes);
  app.get('/getStockEntry/', depreciatedInventory.listStockEntry);
  app.get('/getStockConsumption/', depreciatedInventory.listStockConsumption);
  app.get('/monthlyConsumptions/:inventory_uuid/:nb', depreciatedInventory.listMonthlyConsumption);
  app.get('/getConsumptionTrackingNumber/', depreciatedInventory.listConsumptionByTrackingNumber);
  app.get('/getMonthsBeforeExpiration/:id', depreciatedInventory.formatLotsForExpiration);
  app.get('/stockIntegration/', depreciatedInventory.getStockIntegration);

  // Employee management 
  app.get('/employee_list/', employees.list);
  app.get('/hollyday_list/:pp/:employee_id', employees.listHolidays);
  app.get('/getCheckHollyday/', employees.checkHoliday);
  app.get('/getCheckOffday/', employees.checkOffday);
 
  app.get('/visit/:patientId', patient.logVisit);
  app.get('/caution/:debitor_uuid/:project_id', caution.debtor);
  
  app.get('/errorcodes', errors.listCodes);
  
  app.get('/getAccount6', accounts.listIncomeAccounts);
  app.get('/getAccount7/', accounts.listExpenseAccounts);
  app.get('/getClassSolde/:account_class/:fiscal_year', accounts.getClassSolde);
  app.get('/getTypeSolde/:fiscal_year/:account_type_id/:is_charge', accounts.getTypeSolde);
  

  app.get('available_payment_period/', taxPayment.availablePaymentPeriod);
  app.post('/payTax/', taxPayment.submit);
  app.put('/setTaxPayment/', taxPayment.setTaxPayment);
  
  app.get('/cost_periodic/:id_project/:cc_id/:start/:end', financeServices.costByPeriod);
  app.get('/profit_periodic/:id_project/:pc_id/:start/:end', financeServices.profitByPeriod);
 
  // TODO Remove or upgrade (model in database) every report from report_depreciate
  app.get('/getDistinctInventories/', depreciatedReports.listDistinctInventory);
  app.get('/getReportPayroll/', depreciatedReports.buildPayrollReport);
 
  // Payroll 
  app.get('/getDataPaiement/', payroll.listPaiementData);
  app.get('/getEmployeePayment/:id', payroll.listPaymentByEmployee);
  app.get('/getEnterprisePayment/:employee_id', payroll.listPaymentByEnterprise);
  app.post('/payCotisation/', payroll.payCotisation);
  app.post('/posting_promesse_payment/', payroll.payPromesse);
  app.post('/posting_promesse_cotisation/', payroll.payPromesseCotisation);
  app.post('/posting_promesse_tax/', payroll.payPromesseTax);
  app.put('/setCotisationPayment/', payroll.setCotisationPayment);
  app.get('/getEmployeeCotisationPayment/:id', payroll.listEmployeeCotisationPayments);
  app.get('/taxe_ipr_currency/', payroll.listTaxCurrency);
  
  app.post('/posting_donation/', donations.post);
  
  app.get('/getSubsidies/', subsidies.list);

  /*  Inventory and Stock Managment */
  app.get('/inventory/metadata', inventory.getInventoryItems);
  app.get('/inventory/:uuid/metadata', inventory.getInventoryItemsById);

  app.get('/inventory/consumption', inventory.getInventoryConsumption);
  app.get('/inventory/:uuid/consumption', inventory.getInventoryConsumptionById);

  app.get('/inventory/leadtimes', inventory.getInventoryLeadTimes);
  app.get('/inventory/:uuid/leadtimes', inventory.getInventoryLeadTimesById);

  app.get('/inventory/stock', inventory.getInventoryStockLevels);
  app.get('/inventory/:uuid/stock', inventory.getInventoryStockLevelsById);

  app.get('/inventory/expirations', inventory.getInventoryExpirations);
  app.get('/inventory/:uuid/expirations', inventory.getInventoryExpirationsById);

  app.get('/inventory/lots', inventory.getInventoryLots);
  app.get('/inventory/:uuid/lots', inventory.getInventoryLotsById);

  app.get('/inventory/status', inventory.getInventoryStatus);
  app.get('/inventory/:uuid/status', inventory.getInventoryStatusById);

  app.get('/inventory/donations', inventory.getInventoryDonations);
  app.get('/inventory/:uuid/donations', inventory.getInventoryDonationsById);

  /* Depot Management */

  app.get('/depots', depot.getDepots);
  app.get('/depots/:uuid', depot.getDepotsById);

  app.get('/depots/:depotId/distributions', depot.getDistributions);
  app.get('/depots/:depotId/distributions/:uuid', depot.getDistributionsById);

  // over-loaded distributions route handles patients, services, and more
  app.post('/depots/:depotId/distributions', depot.createDistributions);

  // get the lots of a particular inventory item in the depot
  // TODO -- should this be renamed? /stock? /lots?
  app.get('/depots/:depotId/inventory', depot.getAvailableLots);
  app.get('/depots/:depotId/inventory/:uuid', depot.getAvailableLotsByInventoryId);

  app.get('/depots/:depotId/expired', depot.getExpiredLots);
  app.get('/depots/:depotId/expirations', depot.getStockExpirations);

  /* continuing on ... */

  // stock API
  app.get('/donations', stock.getRecentDonations);

  // TODO - make a purchase order controller
  app.get('/purchaseorders', purchase.getPurchaseOrders);

  app.post('/posting_fiscal_resultat/', fiscal.fiscalYearResultat);

  // Extra Payement
  app.post('/extraPayment/', extra.handleExtraPayment);

  // general ledger controller
  // transitioning to a more traditional angular application architecture
  app.get('/ledgers/general', gl.route);

  // finance controller
  app.get('/finance/debtors', finance.getDebtors);
  app.get('/finance/creditors', finance.getCreditors);
  app.get('/finance/currencies', finance.getCurrencies);
  app.get('/finance/profitcenters', finance.getProfitCenters);
  app.get('/finance/costcenters', finance.getCostCenters);
  app.post('/finance/journalvoucher', finance.postJournalVoucher);

  // accounts controller
  app.get('/accounts', accounts.getAccounts);
  app.get('/InExAccounts/:id_enterprise/', accounts.listInExAccounts);
  app.get('/availableAccounts/:id_enterprise/', accounts.listEnterpriseAccounts);
  app.get('/availableAccounts_profit/:id_enterprise/', accounts.listEnterpriseProfitAccounts);

  // search stuff
  app.get('/patient/:uuid', patient.searchUuid);
  app.get('/patient/search/fuzzy/:match', patient.searchFuzzy);
  app.get('/patient/search/reference/:reference', patient.searchReference);

  // analytics for financial dashboard
  // cash flow analytics
  app.get('/analytics/cashboxes', analytics.cashflow.getCashBoxes);
  app.get('/analytics/cashboxes/:id/balance', analytics.cashflow.getCashBoxBalance);
  app.get('/analytics/cashboxes/:id/history', analytics.cashflow.getCashBoxHistory);

  // debtor analytics
  app.get('/analytics/debtorgroups/top', analytics.cashflow.getTopDebtorGroups);
  app.get('/analytics/debtors/top', analytics.cashflow.getTopDebtors);

  // users controller
  app.post('/users', users.createUser);
  app.put('/users/:id', users.updateUser);
  app.get('/users', users.getUsers);
  app.delete('/users/:id', users.removeUser);
  app.get('/editsession/authenticate/:pin', users.authenticatePin);

  // budget controller
  app.post('/budget/upload', multipart({ uploadDir: 'client/upload'}), budget.upload);
  app.post('/budget/update', budget.update);
};
