angular.module('bhima.controllers')
.controller('inventory.groups', [
  '$scope',
  'validate',
  'connect',
  'uuid',
  function ($scope, validate, connect, uuid) {
    console.log('Hello from inventory.groups');
    var dependencies = {};

    dependencies.groups = {
      query : {
        tables : {
          'inventory_group' : {
            columns : ['uuid', 'name', 'code', 'sales_account', 'cogs_account', 'stock_account', 'tax_account']
          }
        }
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        }
      }
    };

    function startup (models) {
      models.accounts.data.forEach(function (accnt) {
        accnt.account_number =  String(accnt.account_number);
      });
      angular.extend($scope, models);
    }

    validate.process(dependencies)
    .then(startup);

    $scope.add = function add() {
      $scope.group = { uuid : uuid() };
      $scope.action = 'add';
    };

    $scope.edit = function edit(group) {
      $scope.group = group;
      $scope.action = 'edit';
      $scope.copy = angular.copy(group);
    };

    $scope.submitAdd = function submitAdd() {
      var data = connect.clean($scope.group);

      connect.basicPut('inventory_group', [data])
      .then(function () {
        $scope.action = '';
        $scope.groups.post(data);
      });
    };

    $scope.submitEdit = function submitEdit() {
      var data = connect.clean($scope.group);

      connect.basicPost('inventory_group', [data], [uuid])
      .then(function () {
        $scope.action = '';
        $scope.groups.put(data);
      });
    };

    $scope.discard = function discard() {
      $scope.group = { uuid : uuid() };
    };

    $scope.discardEdit = function discardEdit() {
      $scope.group = angular.copy($scope.copy);
    };

  }
]);
