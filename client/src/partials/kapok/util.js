angular.module('kpk.controllers')
.controller('util', [
  '$scope',
  '$translate',
  'appcache',
  'messenger',
  '$location',
  function($scope, $translate, appcache, messenger, $location) {
    ////
    // summary: 
    //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
    /////

    $scope.openSettings = function () {
      var last = $location.path();
      $location.path('/settings/').search('q', last);
    };

  }
]);
