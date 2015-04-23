angular.module('bhima.controllers')
.controller('purchase.menu', [
  '$scope',
  '$location',
  '$translate',
  function ($scope, $location, $translate) {

    var configuration = $scope.configuration = {};

    configuration.operations = [
      {
        key : $translate.instant('PURCHASE_MENU.PUCHASE_CREATION'),
        link : '/purchase/create/'
      },

      {
        key : $translate.instant('PURCHASE_MENU.VIEW'),
        link : '/purchase/view/'
      }
    ];

    $scope.loadPath = function loadPath(path) {
      $location.path(path);
    };
  }
]);
