(function (angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var kpk = angular.module('kpk', ['kpk.controllers', 'kpk.services', 'kpk.directives', 'kpk.filters', 'ngRoute', 'ui.bootstrap', 'pascalprecht.translate']);
  
  function kpkconfig($routeProvider) { 
    //TODO: Dynamic routes loaded from unit database?
    $routeProvider.
    when('/budgeting/:accountID?', {
      controller: 'budgetController',
      templateUrl: 'partials/budget/budget.html'
    }).
    when('/permission', { 
      controller: 'userController',
      templateUrl: 'partials/user_permission/permissions.html'
    }).
    when('/enterprise', { 
      controller: 'enterpriseController',
      templateUrl: 'partials/enterprise/enterprise.html'
    }).
    when('/posting_journal', {
      controller: 'journal',
      templateUrl:'partials/journal/journal.html'
    }).
    when('/fiscal', {
      controller: 'fiscalController',
      templateUrl: 'partials/fiscal/fiscal.html'
    }).
    when('/patient', { 
      controller: 'patientRegistration',
      templateUrl: 'partials/patient_registration/patient.html'
    }).
    when('/debitor/debitor_group', {
      controller : 'debitorGroup',
      templateUrl: 'partials/debitor/debitor_group.html'
    }).
    when('/accounts', {
      controller: 'accountController',
      templateUrl: '/partials/accounts/accounts.html'
    }).
    when('/inventory', {
      controller: 'inventoryController',
      templateUrl: '/partials/inventory/inventory.html'
    }).
    when('/inventory/view', {
      controller : 'inventoryViewCtrl',
      templateUrl:'/partials/inventory/view.html'
    }).
    when('/inventory/register', {
      controller: 'inventoryRegisterController',
      templateUrl: '/partials/inventory/register/register.html'
    }).
    when('/patient_records/:patientID?', { 
      controller: 'patientRecords', 
      templateUrl: '/partials/records/patient_records/patient_records.html'
    }).
    when('/sales/:debtorID?/:inventoryID?', { 
      controller: 'sales',
      templateUrl: '/partials/sales/sales.html'
    }).
    when('/sale_records/:recordID?', { 
      controller: 'salesRecords',
      templateUrl: '/partials/records/sales_records/sales_records.html'
    }).
    when('/cash', {
      controller: 'cashController',
      templateUrl: '/partials/cash/cash.html'
    })
    .when('/creditors', {
      controller: 'creditorsController',
      templateUrl: '/partials/creditor/creditor.html'
    }).
    when('/creditors/creditor_group', {
      controller: 'creditorGroupCtrl',
      templateUrl: 'partials/creditor/group/creditor_group.html'
    }).
    when('/inventory/purchase', {
      controller: 'purchaseOrderController',
      templateUrl: 'partials/purchase_order/purchase.html'
    }).
    when('/purchase_records/:purchaseID?', {
      controller: 'purchaseRecordsController',
      templateUrl: 'partials/records/purchase_order_records/purchase_records.html'
    }).
    when('/inventory/price_list', {
      controller: 'priceListController',
      templateUrl: 'partials/pricelist/pricelist.html'
    }).
    when('/exchange_rate', {
      controller : 'exchangeRateController',
      templateUrl: 'partials/exchange_rate/exchange_rate.html'
    }).
    when('/currency', {
      controller : 'currency',
      templateUrl: 'partials/currency/currency.html' 
    }).
    when('/create_account', {
      controller: 'manageAccount',
      templateUrl: 'partials/accounts/create_account/create.html'
    }).
    when('/reports/finance', { 
      controller: 'reportFinance',
      templateUrl: 'partials/reports/finance/finance_report.html'
    }).
    when('/reports/transaction_report', { 
      controller: 'reportTransactionController',
      templateUrl: 'partials/reports/transaction_report/transaction_report.html'
    }).
    when('/reports/ledger/general_ledger', {
      controller: 'reportGeneralLedgerCtrl',
      templateUrl: '/partials/reports/ledger/general_ledger.html'
    }).
    when('/reports/summary', {
      controller: 'summaryController',
      templateUrl: 'partials/reports/summary/summary.html'
    }).
    when('/reports/account_balance/', {
      controller: 'reportAccountBalanceCtrl',
      templateUrl: 'partials/reports/account_balance/account_balance.html'
    }).
    when('/reports/debitor_aging/', {
      controller: 'reportDebitorAgingCtrl',
      templateUrl: 'partials/reports/debitor_aging/debitor_aging.html'
    }).
    when('/reports/account_statement/', {
      controller: 'reportAccountStatementCtrl',
      templateUrl: 'partials/reports/account_statement/account_statement.html'
    }).
    when('/reports/income_expensive/', {
      controller: 'reportIncomeExpensiveCtrl',
      templateUrl: 'partials/reports/income_expensive/income_expensive.html'
    })
    .when('/location', {
      controller : 'locationCtrl',
      templateUrl: 'partials/location/location.html'
    })
    .when('/print', {
      templateUrl: 'partials/print/test.html'
    })
    .when('/settings/:route?', { 
      controller: 'settingsController',
      templateUrl: 'partials/settings/settings.html'
    })
    /*
    .when('/convention', { 
      controller: 'conventionController',
      templateUrl: 'partials/convention/convention.html'
    })
    */
    .when('/patient_group_assign', { 
      controller: 'AssignPatientGroupController',
      templateUrl: 'partials/patient_group_assign/patient_group_assign.html'
    })
    .when('/reports/chart_of_accounts/', {
      controller: 'accountsReport',
      templateUrl: 'partials/reports/chart_of_accounts/chart.html'
    }).
    when('/invoice/:originId/:invoiceId', { 
      controller: 'invoice', 
      templateUrl: 'partials/invoice/invoice.html'
    }).
    when('/credit_note/:invoiceId?/', { 
      controller: 'creditNote',
      templateUrl: 'partials/credit_note/credit_note.html'
    }).
    when('/cost_center', { 
      controller: 'costCenter',
      templateUrl: 'partials/cost_center/cost_center.html'
    }).
    when('/cost_center/principal_center/', {
      controller: 'principalAnalysisCenter',
      templateUrl: 'partials/cost_center/principal_center/principal_analysis_center.html'
    }).
    when('/patient_group', {
      controller: 'patientGroupCtrl',
      templateUrl: 'partials/patient_group/patient_group.html' 
    })
    .when('/group_invoice/:id?', {
      controller : 'groupInvoice',
      templateUrl : 'partials/group_invoice/group_invoice.html' 
    });
  }  

  function translateConfig($translateProvider) { 
    //TODO Review how translations should be split - functionality, unit, etc.
    //TODO Review i18n and determine if this it the right solution
    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/',
      suffix: '.json'
    });

    //TODO Try and assign the previous sessions language key here
    $translateProvider.preferredLanguage('en');
  }

  kpk.config(kpkconfig);
  kpk.config(translateConfig);
})(angular);
