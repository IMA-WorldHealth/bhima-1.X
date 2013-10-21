(function(angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var bika = angular.module('bika', ['bika.services', 'bika.controllers', 'angularTreeview', 'ngGrid', 'smartTable.table', 'bikaCellSelect', 'ui.bootstrap']);
  
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
    }).
    when('/partials/transaction', { 
      controller: 'transactionController',
      templateUrl: 'partials/transaction/transaction.html'
    }).
    when('/debitors', { 
      controller: 'debtorsController',
      templateUrl: 'partials/debtors.html'
    }).
    when('/fiscal', {
      controller: 'fiscalController',
      templateUrl: 'partials/fiscal.html'
    }).
    when('/accounts', {
      controller: 'chartController',
      templateUrl: 'partials/chartofaccounts.html'
    }).
    when('/connect', {
      controller: 'connectController',
      templateUrl: 'partials/connect.html'
    }). // for Socket Test
    when('/socket', {
      controller: 'socketController',
      templateUrl: 'partials/socket.html'
    });
  }  
  bika.config(bikaconfig);

})(angular);
