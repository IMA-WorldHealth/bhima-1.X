angular.module('kpk.controllers')
.controller('conventionSale', [
  '$scope',
  '$routeParams',
  'connect',
  'validate',
  'appstate',
  'messenger',
function ($scope, $routeParams, connect, validate, appstate, messenger) {
  'use strict';

  var dependencies = {};
  $scope.data = {};
  $scope.found = false;

  dependencies.invoices = {
    required: true,
    query : {
      tables : {
        'sale' : {
          columns : ['id', 'cost', 'debitor_id', 'discount', 'invoice_date', 'note']
        },
        'debitor' : {
          columns: ['group_id', 'convention_id', 'text'] 
        },
        'debitor_group' : {
          columns : ['account_id'] 
        }
      },
      join : ['sale.debitor_id=debitor.id', 'debitor.group_id=debitor_group.id']
    }
  };

  dependencies.conventions = {
    required: true,
    query : {
      tables : {
        'convention'  : {
          columns: ['id', 'name', 'account_id']
        },
        'account' : {
          columns: ['account_txt']
        }
      },
      join : ['convention.account_id=account.id']
    }
  };

  // get enterprise 
  appstate.register('enterprise', function (enterprise) {
    dependencies.invoices.query.where = 
      //['sale.enterprise_id=' + enterprise.id, 'AND', 'sale.posted=0'];
      ['sale.enterprise_id=' + enterprise.id];
    validate.process(dependencies).then(setUpModels);
  });


  function setUpModels (models) {
    for (var k in models) $scope[k] = models[k];
    $scope.edit = {};
  }

  $scope.search = function () {
    $scope.found = false; 
  };

  $scope.found = function () {
    $scope.found = true;
    $scope.action = 'pay';
  };

  $scope.payAll = function () {
    $scope.action = 'payAll'; 
  };

  $scope.payPart = function () {
    $scope.action = 'payPart';
    $scope.edit.date = new Date();
    //$scope.edit = $scope.data.invoice
  };

  $scope.selectConvention = function () {
    $scope.action = 'selectConvention'; 
    $scope.original_id = $scope.data.invoice.convention_id;
  };

  $scope.saveConvention = function () {
    $scope.action = 'default'; 
  };

  $scope.resetConvention = function () {
    $scope.data.invoice.convention_id = $scope.original_id; 
    $scope.action = 'default'; 
  };

  $scope.pay = function () {
    $scope.action = 'pay'; 
  };

}]);
