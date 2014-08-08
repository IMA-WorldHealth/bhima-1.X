angular.module('bhima.controllers')
.controller('costCenter', [
  '$scope',
  '$location',
  '$translate',
  function ($scope, $location, $translate) {

    var configuration = $scope.configuration = {};

    configuration.operations = [
      {
        key : $translate.instant('COST_CENTER.OPERATIONS.CC'),
        link : '/cost_center/center/'
      },

      {
        key : $translate.instant('COST_CENTER.OPERATIONS.VERSEMENT'),
        link : '/cost_center/allocation/'
      },

      {
        key : $translate.instant('COST_CENTER.OPERATIONS.ASSIGN'),
        link : '/cost_center/assigning/'
      }
    ];

    $scope.loadPath = function loadPath(path) {
      $location.path(path);
    };
  }
]);
