(function(angular) {
  'use strict';

  //FIXME: Format code correctly in seperate files/modules etc.
  var bika = angular.module('bika', ['bika.services', 'bika.controllers', 'angularTreeview', 'ngGrid', 'smartTable.table', 'bikaCellSelect', 'ui.bootstrap', 'ui.bootstrap.tabs']);
  
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
    when('/patientbilling', { 
      templateUrl: 'partials/patientbilling/index.html'
    }).
    when('/patientbilling/patient/', {
      templateUrl: 'partials/patientbilling/patient/index.html',
      controller: 'patientController'
    }).
    when('/patientbilling/organisation/', {
      templateUrl: 'partials/patientbilling/organisation/index.html',
      controller: 'organisationController'
    }).
    when('/patientbilling/config/', {
      templateUrl: 'partials/patientbilling/organisation/config.html',
      controller: 'patientbillingConfig'
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
