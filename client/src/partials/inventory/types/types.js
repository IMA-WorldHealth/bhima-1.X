angular.module('bhima.controllers')
.controller('inventory.types', [
  '$scope',
  'validate',
  'connect',
  function ($scope, validate, connect) {
    var dependencies = {};

    dependencies.types = {
      query : {
        tables : {
          'inventory_type' : {
            columns : ['id', 'text']
          }
        }
      }
    };

    function startup (models) {
      angular.extend($scope, models);
    }

    validate.process(dependencies)
    .then(startup);

    $scope.edit = function edit (type) {
      $scope.action = 'edit';
      $scope.e = type;
      $scope.e_copy = angular.copy(type);
    };

    $scope.resetEdit = function resetEdit () {
      $scope.e = angular.copy($scope.e_copy);
    };

    $scope.submitEdit = function submitEdit () {
      connect.basicPost('inventory_type', [connect.clean($scope.e)], ['id'])
      .then(function (res) {
        $scope.action = '';
      });
    };

    $scope.new = function newItem () {
      $scope.action = 'new';
      $scope.n = {};
    };

    $scope.resetNew = function resetNew () {
      $scope.n = {};
    };

    $scope.submitNew = function submitNew () {
      connect.basicPut('inventory_type', [connect.clean($scope.n)])
      .then(function (res) {
        console.log('[Data]', res);
        $scope.types.post({id : res.data.insertId, text : $scope.n.text });
        $scope.action = '';
      });
    };

  }
]);
