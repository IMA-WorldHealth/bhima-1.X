angular.module('kpk.controllers')
.controller('currency', [
  '$scope',
  'connect',
  'validate',
  'messenger',
function ($scope, connect, validate, messenger) {
  'use strict';

  var dependencies = {};

  dependencies.currency = {
    required : true,
    query : {
      tables : {
        'currency' : {
          columns : ['id', 'name', 'symbol', 'note', 'separator', 'decimal']
        }
      } 
    } 
  };

  validate.process(dependencies).then(setUpModels);

  function setUpModels (models) {
    for (var k in models) $scope[k] = models[k];
  }

  // 'new' namespace

  $scope.new = function () {
    $scope.action = 'new';
    $scope.newCurrency = {};
    $scope.resetNew();
  };

  $scope.submitNew = function () {
    if ($scope.newForm.$invalid) 
      return messenger.danger('You have invalid form fields');
    connect.basicPut('currency', [connect.clean($scope.newCurrency)])
    .success(function (res) {
      $scope.action = '';
      $scope.newCurrency.id = res.data.insertId;
      $scope.currendy.post($scope.newCurrency); 
    })
    .catch(function (err) {
      messenger.danger('Error in posting new currency.');
    });
  };

  $scope.resetNew = function () {
    $scope.newCurrency = {};
  };

  // remove currency
  $scope.remove = function (id) {
    connect.basicDelete('currency', id)
    .success(function (res) {
      $scope.currency.remove(id);
    }) 
    .catch(function (err) {
      messenger.danger('Error trying to remove currency (id: '+id+')'); 
    });
  };

  // 'edit' namespace

  $scope.edit = function (id) {
    $scope.action = 'edit';
    $scope.editCurrency = angular.copy($scope.currency.get(id));
    $scope.edit_id = id;
  };

  $scope.submitEdit = function () {
    if ($scope.editForm.$invalid)
      return messenger.danger('You have invalid form fields.');
    connect.basicPost('currency', [connect.clean($scope.editCurrency)])
    .success(function (res) { 
      $scope.action = '';
    })
    .catch(function (err) {
      messenger.danger('Error in updating currency values.');
    });
  };

  $scope.resetEdit = function () {
    $scope.editCurrency = {};
    $scope.editCurrency = angular.copy($scope.currency.get($scope.edit_id));
  };

}]);
