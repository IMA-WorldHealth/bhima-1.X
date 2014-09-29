angular.module('bhima.controllers')
.controller('util', [
  'EVENTS',
  '$scope',
  '$rootScope',
  '$location',
  'appauth',
  function(EVENTS, $scope, $rootScope, $location, appauth) {
    // Controls the visibility and actions of the utilities
    // on the application's sidebar

    $scope.openSettings = function () {
      var last = $location.path();
      $location.path('/settings/').search('url', last);
    };

    $scope.logout = function () {
      appauth.logout()
      .then(function () {
        console.log('[LOGOUT]');
        $rootScope.$broadcast(EVENTS.auth.logoutSuccess);
        $location.path('/login');
      })
      .finally();
    };
  }
]);
