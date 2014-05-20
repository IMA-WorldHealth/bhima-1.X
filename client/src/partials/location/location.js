angular.module('bhima.controllers')
.controller('locationCtrl', [
  '$scope',
  'connect',
  'messenger',
  'store',
  function ($scope, connect, messenger, Store) {

    connect.fetch('/location/')
    .success(function (data) {
      $scope.locations = new Store({ identifier : 'uuid' });
      $scope.locations.setData(data);
    })
    .error(function (err) {
      messenger.danger('Failed to load location data.' + err);
    });

  }
]);
