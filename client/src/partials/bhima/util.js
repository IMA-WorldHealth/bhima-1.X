angular.module('bhima.controllers')
.controller('util', [
  '$scope',
  '$location',
  function($scope, $location) {
    ////
    // summary: 
    //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
    /////

    $scope.openSettings = function () {
      var last = $location.path();
      $location.path('/settings/').search('url', last);
    };

  }
]);
