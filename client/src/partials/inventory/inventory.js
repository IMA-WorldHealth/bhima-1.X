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
        path : 'register'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.UPDATE_ITEM',
        path : 'update_item'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.CONFIG_GROUPS',
        path : 'groups'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.CONFIG_TYPES',
        path : 'types'
      },
      {
        ico : 'glyphicon-list-alt',
        key : 'INVENTORY.MAIN.VIEW',
        path : 'view'
      },
      {
        ico : 'glyphicon-print',
        key : 'INVENTORY.MAIN.PRINT_MANIFEST',
        path : 'manifest'
      },
    ];

    $scope.loadPath = function loadPath(item) {
      $location.path($location.path() + '/' + item.path);
    };
  }
]);
