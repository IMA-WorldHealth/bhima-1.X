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
    when('/essaie', { 
      controller: 'userController',
      templateUrl: 'partials/vente/essaie.html'
    }). when('/p', {
      controller: 'addController',
      templateUrl:'partials/transaction/transactionform.html'
    }).// FIXME: Take out patient billing routes to local routes
        // Maybe use angular-router?
    when('/billing', { 
      templateUrl: 'partials/billing/index.html'
    }).
    when('/billing/patient/', {
      templateUrl: 'partials/billing/patient/index.html',
      controller: 'patientController'
    }).
    when('/billing/groups/', {
      templateUrl: 'partials/billing/groups/index.html',
      controller: 'billingGroupsController'
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
    });
  }  
  bika.config(bikaconfig);

})(angular);
