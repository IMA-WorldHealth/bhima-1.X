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
    when('/partials/permission', { 
      controller: 'userController',
      templateUrl: 'partials/permission/permissions.html'
    }). // FIXME: Take out patient billing routes to local routes
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
    when('/accounts', {
      controller: 'chartController',
      templateUrl: '/partials/chart/index.html'
    });
  }  
  bika.config(bikaconfig);

})(angular);
