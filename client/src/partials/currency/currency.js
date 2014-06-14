angular.module('bhima.controllers')
.controller('currency', [
  '$scope',
  'connect',
  'validate',
  'messenger',
  function ($scope, connect, validate, messenger) {
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


    function setUpModels (models) {
      angular.extend($scope, models);
    }

    validate.process(dependencies).then(setUpModels);

    // 'new' namespace

    $scope.new = function () {
      $scope.action = 'new';
      $scope.newCurrency = {};
      $scope.resetNew();
    };

    $scope.submitNew = function () {
      if ($scope.newForm.$invalid) {
        return messenger.danger('You have invalid form fields');
      }
      connect.basicPut('currency', [connect.clean($scope.newCurrency)])
      .then(function (res) {
        $scope.action = '';
        $scope.newCurrency.id = res.data.insertId;
        $scope.currendy.post($scope.newCurrency);
      });
    };

    $scope.resetNew = function () {
      $scope.newCurrency = {};
    };

    // remove currency
    $scope.remove = function (id) {
      connect.basicDelete('currency', id)
      .then(function () {
        $scope.currency.remove(id);
      });
    };

    // 'edit' namespace

    $scope.edit = function (id) {
      $scope.action = 'edit';
      $scope.editCurrency = angular.copy($scope.currency.get(id));
      $scope.edit_id = id;
    };

    $scope.submitEdit = function () {
      if ($scope.editForm.$invalid) {
        return messenger.danger('You have invalid form fields.');
      }
      connect.basicPost('currency', [connect.clean($scope.editCurrency)])
      .then(function () {
        $scope.action = '';
      });
    };

    $scope.resetEdit = function () {
      $scope.editCurrency = {};
      $scope.editCurrency = angular.copy($scope.currency.get($scope.edit_id));
    };

  }
]);
