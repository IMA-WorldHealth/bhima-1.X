(function(angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var kpk = angular.module('kpk', ['kpk.controllers', 'kpk.services', 'kpk.directives', 'kpk.filters', 'angularTreeview', 'ui.bootstrap', 'ui.bootstrap.tabs', 'pascalprecht.translate']);
  
  function kpkconfig($routeProvider) { 
    //TODO: Dynamic routes loaded from unit database?
    $routeProvider.
    when('/budgeting', {
      controller: 'budgetController',
      templateUrl: 'partials/budgeting.html'
    }).
    when('/permission', { 
      controller: 'userController',
      templateUrl: 'partials/permission/permissions.html'
    }).
    when('/posting_journal', {
      controller: 'journalController',
      templateUrl:'partials/journal/journal.html'
    }).
    when('/partials/transaction', { 
      controller: 'transactionController',
      templateUrl: 'partials/transaction/transaction.html'  
    }).
    when('/fiscal', {
      controller: 'fiscalController',
      templateUrl: 'partials/fiscal/fiscal.html'
    }).
    when('/patient', { 
      controller: 'patientRegController',
      templateUrl: 'partials/patient_registration/patient.html'
    }).
    when('/accounts', {
      controller: 'accountController',
      templateUrl: '/partials/accounts/index.html'
    }).
    when('/inventory', {
      controller: 'inventoryController',
      templateUrl: '/partials/inventory/index.html'
    }).
    when('/patient_records/:patientID', { 
      controller: 'patientSearchController', 
      templateUrl: '/partials/patient_search.html'
    }).
    when('/sales', { 
      controller: 'salesController',
      templateUrl: '/partials/sales/sales.html'
    }).
    when('/sale_records/:recordID', { 
      controller: 'salesRecordsController',
      templateUrl: '/partials/sales_records.html'
    }).
    when('/inventory/register', {
      controller: 'inventoryRegisterController',
      templateUrl: '/partials/inventory/register/index.html'
    }).
    when('/cash', {
      controller: 'cashController',
      templateUrl: '/partials/cash/index.html'
    }).when('/creditors', {
      controller: 'creditorsController',
      templateUrl: '/partials/creditor/index.html'
    }).
    when('/cash/review/:id', {
      controller: 'cashReviewController',
      templateUrl: '/partials/cash/review/index.html' 
    }).
    when('/inventory/purchase', {
      controller: 'purchaseOrderController',
      templateUrl: 'partials/inventory_invoice/index.html'
    }).
    when('/purchase_records/:purchaseID', {
      controller: 'purchaseRecordsController',
      templateUrl: 'partials/records/purchase_order_records/purchase_records.html'
    }).
    when('/price_list', {
      controller: 'priceListController',
      templateUrl: 'partials/pricelist/index.html'
    }).
    when('/exchange_rate/', {
      controller : 'exchangeRateController',
      templateUrl: 'partials/currency/currency.html'
    }).
    when('/create_account', {
      controller: 'createAccountController',
      templateUrl: 'partials/create_account.html'
    });
  }  

  function translateConfig($translateProvider) { 
    //TODO Configurations loaded from files on the server (pointed to by database?)
    //TODO Review how translations should be split - functionality, unit, etc.
    //TODO Review i18n and determine if this it the right solution
    $translateProvider.translations('en', {
      //Accounting terminology
      POSTING_JOURNAL: "posting journal",
      TRANSACTION: "transaction",
      ACCOUNT: "account",
      TRIAL_BALANCE: "trial balance",
      GENERAL_LEDGER: "general ledger",
      DEBIT: "debit",
      CREDIT: "credit",
      FISCAL_YEAR: "fiscal year",

      //Application functions
      CONFIGURE: "configure",
      PRINT: "print",
      CREATE: "create",

      //Generic database
      ID: "id",
      DATE: "date",
      DESCRIPTION: "description",

      //Titles
      MANAGEMENT: "management",

      //Journal database
      DOC_NO: "doc no.",
      DEB_CRED_ACCOUNT: "debitor/creditor account",
      DEB_CRED_TYPE: "debitor/creditor type",
      INV_PO_NO: "inv/PO no."
    });

    $translateProvider.translations('fr', {
      //Accounting terminology
      POSTING_JOURNAL: "journal d'Affichage",
      TRANSACTION: "opération",
      ACCOUNT: "compte",
      TRIAL_BALANCE: "balance de vérification",
      GENERAL_LEDGER: "grand livre général",
      DEBIT: "débit",
      CREDIT: "crédit",

      //Application functions
      CONFIGURE: "configurer",
      PRINT: "imprimer"
    });

    $translateProvider.preferredLanguage('en');
  }

  kpk.config(kpkconfig);
  kpk.config(translateConfig);
})(angular);
