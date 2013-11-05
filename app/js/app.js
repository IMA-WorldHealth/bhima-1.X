(function(angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var bika = angular.module('bika', ['bika.services', 'bika.controllers', 'bika.directives', 'bika.filters', 'angularTreeview', 'ngGrid', 'ui.bootstrap', 'ui.bootstrap.tabs']);
  
  function bikaconfig($routeProvider) { 
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
      controller: 'chartController',
      templateUrl: '/partials/chart/index.html'
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
    }).
    when('/cash/review/:id', {
      controller: 'cashReviewController',
      templateUrl: '/partials/cash/review/index.html' 
    });
  }  
  bika.config(bikaconfig);

})(angular);
