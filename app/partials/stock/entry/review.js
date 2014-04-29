angular.module('kpk.controllers')
.controller('stock.review', [
  '$scope',
  '$location',
  'appstate',
  'connect',
  function ($scope, $location, appstate, connect) {
    var session = $scope.session = {};

    appstate.register('project', function (project) {
      $scope.project = project;
      angular.extend(session, appstate.get('stock.lots'));
      console.log('session', session);
    });

  }
]);
