angular.module('kpk.controllers')
.controller('report.prices', [
  '$scope',
  '$window',
  'connect',
  'messenger',
  'appstate',
  function ($scope, $window, connect, messenger, appstate) {

    $scope.timestamp = new Date();

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;

      connect.fetch('reports/prices/')
      .success(function (data) {
        for (var k in data) {
          data[k].code = Number(data[k].code);
        }
        $scope.groups = data;
      })
      .error(function (error) {
        messenger.danger('An error occured.' + JSON.stringify(error));
      })
      .finally();
    });

    $scope.print = function print () {
      $window.print();
    };

  }
]);
