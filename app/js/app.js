(function(angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var kpk = angular.module('kpk', ['kpk.controllers', 'kpk.services', 'kpk.directives', 'kpk.filters', 'angularTreeview', 'ui.bootstrap', 'ui.bootstrap.tabs']);
  
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
      templateUrl:'partials/postingjournal/index.html'
    }).
    when('/partials/transaction', { 
      controller: 'transactionController',
      templateUrl: 'partials/transaction/transaction.html'
    }).
    when('/fiscal', {
      controller: 'fiscalController',
      templateUrl: 'partials/fiscal.html'
    }).
    when('/patient', { 
      controller: 'patientRegController',
      templateUrl: 'partials/patient.html'
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
      templateUrl: '/partials/sales.html'
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
      templateUrl: 'partials/purchase_records.html'
    }).
    when('/price_list', {
      controller: 'priceListController',
      templateUrl: 'partials/pricelist/index.html'
    });
  }  
  kpk.config(kpkconfig);

})(angular);
