angular.module('kpk.controllers')
.controller('inventoryGroup', [
  '$scope',
  '$modalInstance',
  'connect',
  'groupStore',
  'accountModel',
  'messenger',
  function ($scope, $modalInstance, connect, groupStore, accountModel, messenger) {
    $scope.group = {};

    $scope.accounts = accountModel;

    $scope.submit = function () {

      var clean = connect.clean($scope.group);
      connect.basicPut('inventory_group', [connect.clean(clean)])
      .then(function (result) {
        clean.id = result.data.insertId;
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
