// this module is responsible for controlling printing

angular.module('kpk.controllers')
.controller('printerCtrl', function ($scope,  printer) {
  'use strict';

  $scope.notifier = printer;
  $scope.close = printer.close;

  $scope.$watch('notifier', function () {
    $scope.printer = printer.data;
    console.log("CHANGE: ", $scope.notifier);
  }, true);

});
