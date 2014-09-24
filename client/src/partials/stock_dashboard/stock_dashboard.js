angular.module('bhima.controllers')
.controller('stock_dashboard', [
  '$scope',
  '$translate',
  '$http',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $translate, $http, validate, messenger, connect, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $http.get('/getTop10Consumption/').
    success(function(data) {
      $scope.consumptions = data;
    });

  } 
]);