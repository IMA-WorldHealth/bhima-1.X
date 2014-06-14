angular.module('bhima.controllers')
.controller('location', [
  '$scope',
  'connect',
  'store',
  function ($scope, connect, Store) {

    // TODO : This could be achieved with connect.req
    connect.fetch('/location/')
    .then(function (data) {
      $scope.locations = new Store({ identifier : 'uuid' });
      $scope.locations.setData(data);
    });

  }
]);
