angular.module('bhima.controllers')
.controller('payroll', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'connect',
  '$location',
  'util',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, connect, $location, util) {
    var dependencies = {}, session = $scope.session = {};
    var cashbox, cashboxReference = $routeParams.cashbox;
   
  }
]);
