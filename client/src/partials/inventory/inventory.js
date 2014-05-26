angular.module('bhima.controllers')
.controller('inventory', [
  '$scope',
  '$location',
  function ($scope, $location) {
    var config;

    config = $scope.config = [
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.ADD_ITEM',
        path : '/inventory/register'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.UPDATE_ITEM',
        path : '/inventory/update_stock'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.CONFIG_GROUPS',
        path : '/inventory/groups'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.CONFIG_TYPES',
        path : '/inventory/types'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.VIEW',
        path : '/inventory/view'
      },
      {
        ico : 'glyphicon-print',
        key : 'INVENTORY.MAIN.PRINT_MANIFEST',
        path : '/inventory/manifest'
      },
    ];

    $scope.loadPath = function loadPath(item) {
      console.log(item);
      console.log($location.path());
      $location.path(item.path);
    };
  }
]);
