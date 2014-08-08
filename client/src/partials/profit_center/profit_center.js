angular.module('bhima.controllers')
.controller('profitCenter', [
  '$scope',
  '$location',
  '$translate',
  function ($scope, $location, $translate) {

    var configuration = $scope.configuration = {};

    configuration.operations = [
      {
        key : $translate.instant('PROFIT_CENTER.OPERATIONS.CC'),
        link : '/profit_center/center/'
      },

      {
        key : $translate.instant('PROFIT_CENTER.OPERATIONS.VERSEMENT'),
        link : '/profit_center/allocation/'
      }
    ];

    $scope.loadPath = function loadPath(path) {
      $location.path(path);
    };
  }
]);
