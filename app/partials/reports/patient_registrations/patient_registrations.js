angular.module('kpk.controllers')
.controller('reportPatientRegistrations', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  function ($scope, connect, appstate, messenger, $filter) {
    $scope.state = {};
    $scope.dates = {};

    function dateWatcher () {
      $scope.state.dateFrom = $filter('date')($scope.dates.dateFrom, 'yyyy-MM-dd');
      $scope.state.dateTo = $filter('date')($scope.dates.dateTo, 'yyyy-MM-dd');
    }

    function stateWatcher () {
      $scope.dates.dateFrom = new Date($scope.state.dateFrom);
      $scope.dates.dateTo = new Date($scope.state.dateTo);
    }

    $scope.$watch('dates', dateWatcher, true);
    $scope.$watch('state', stateWatcher, true);

    $scope.day = function day () {
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();
      $scope.search();
    };

    $scope.week = function week () {
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();
      $scope.dates.dateFrom.setDate($scope.dates.dateTo.getDate() - 7);
      $scope.search();
    };

    $scope.month = function month () {
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();
      $scope.dates.dateFrom.setMonth($scope.dates.dateTo.getMonth() - 1);
      $scope.search();
    };

    $scope.search = function search () {
      // must add a day to pick it up from sql
      var dateConvert = $scope.dates.dateTo;
      dateConvert.setDate(dateConvert.getDate() + 1);
      dateWatcher();
      connect.fetch([
        '/rt/p',
        $scope.enterprise.id,
        $scope.state.dateFrom,
        $scope.state.dateTo
      ].join('/'))
      .success(function (model) {
        $scope.patients = model;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();
      $scope.day();
    });


  }
]);
