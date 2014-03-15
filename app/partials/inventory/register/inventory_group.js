angular.module('kpk.controllers')
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
