angular.module('bhima.controllers')
.controller('inventoryUnit', [
  '$scope',
  '$modalInstance',
  'connect',
  'unitStore',
  'messenger',
  function ($scope, $modalInstance, connect, unitStore, messenger) {
    var unit = $scope.unit = {};
    $scope.units = unitStore.data;

    $scope.submit = function () {
      if (!unit.text) { return messenger.warn('No text field!'); }
      // process
      var text = unit.text.toLowerCase();
      text = text[0].toUpperCase() + text.slice(1);
      unit.text = text;
      connect.basicPut('inventory_unit', [connect.clean(unit)])
      .then(function (result) {
        messenger.success('Posted new unit successfully');
        unit.id = result.data.insertId;
        $modalInstance.close(unit);
      }, function (error) {
        messenger.danger('Error posting new unit type: '+error);
        $modalInstance.dismiss();
      });
    };

    $scope.discard = function () {
      $modalInstance.dismiss();
    };
  }
]);
