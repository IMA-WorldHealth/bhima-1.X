angular.module('bhima.controllers')
.controller('inventoryGroup', [
  '$scope',
  '$modalInstance',
  'connect',
  'groupStore',
  'accountModel',
  'messenger',
  'uuid',
  function ($scope, $modalInstance, connect, groupStore, accountModel, messenger, uuid) {
    $scope.group = {};

    accountModel.forEach(function (account) {
      account.account_number = String(account.account_number);
    });

    $scope.accounts = accountModel;

    $scope.submit = function () {
      var clean = connect.clean($scope.group);
      clean.uuid = uuid();
      connect.basicPut('inventory_group', [connect.clean(clean)])
      .then(function (result) {
        $modalInstance.close(clean);
      }, function (error) {
        messenger.danger('Error creating new group' + error);
      });
    };

    $scope.discard = function () {
      $modalInstance.dismiss();
    };
  }
]);
