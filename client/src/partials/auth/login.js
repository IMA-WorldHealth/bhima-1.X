angular.module('bhima.controllers')
.controller('auth.login', [
  '$scope',
  '$rootScope',
  'appauth',
  'EVENTS',
  function ($scope, $rootScope, appauth, EVENTS) {

    var credentials = $scope.credentials = {};

    $scope.login = function () {
      appauth.login(credentials)
      .then(function (session) {
        $rootScope.$broadcast(EVENTS.auth.loginSuccess);
        $scope.setUser(session.user);
      })
      .catch(function () {
        $rootScope.$broadcast(EVENTS.auth.loginFailed);
      });
    };
  }
]);
