angular.module('kpk.controllers')
.controller('reportCashPayments', [
  '$scope',
  'connect',
  'appstate',
  'validate',
  'messenger',
  '$filter',
  function ($scope, connect, appstate, validate, messenger, $filter) {
    $scope.state = {};
    $scope.dates = {};

    var dependencies = {};
    dependencies.projects = {
      required: true,
      query : {
        tables : {
          'project' : {
            columns : ['id', 'abbr']
          }
        }
      }
    };

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
      var url, dateConvert = $scope.dates.dateTo;
      dateConvert.setDate(dateConvert.getDate() + 1);
      dateWatcher();

      url = '/reports/payments/?id=' + $scope.enterprise.id;
      url += '&start=' + $scope.state.dateFrom;
      url += '&end=' + $scope.state.dateTo;
      connect.fetch(url)
      .success(function (model) {
        $scope.payments = model;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      $scope.dates.dateFrom = new Date();
      $scope.dates.dateTo = new Date();

      // default to searching today
      $scope.day();
      validate.process(dependencies)
      .then(function (models) {
        for (var k in models) { $scope[k] = models[k]; }
      })
      .catch(function (error) {
        messenger.danger(error);
      });
    });


    function sum(a, b) {
      return a + b.cost;
    }

    $scope.sumPayments = function () {
      return $scope.payments ? $scope.payments.reduce(sum, 0) : 0;
    };

  }
]);
