angular.module('kpk.controllers')
.controller('reportPatientRegistrations', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  function ($scope, validate, connect, appstate, messenger, $filter) {
    var session = $scope.session = {};
    var dependencies = {};
    $scope.selected = null;
    
    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ["id", "abbr", "name"]
          }
        }
      }
    };

    $scope.options = [
      {
        label : 'CASH_PAYMENTS.DAY',
        fn : day,
      },
      {
        label : 'CASH_PAYMENTS.WEEK',
        fn : week,
      },
      {
        label : 'CASH_PAYMENTS.MONTH',
        fn : month
      }
    ];

    function day () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      reset();
    }

    function week () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(session.dateTo.getDate() - 7);
      reset();
    }

    function month () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setMonth(session.dateTo.getMonth() - 1);
      reset();
    }

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function search (selection) {
      session.selected = selection.label;
      selection.fn();
    }

    function reset (p) {
      var req, url;

      // toggle off active
      session.active = !p;

      formatDates();

      req = {
        dateFrom : session.dateFrom,
        dateTo : session.dateTo
      };

      url = '/reports/patients/?id=' + $scope.project.id;
      url += '&start=' + req.dateFrom;
      url += '&end=' + req.dateTo;

      connect.fetch(url)
      .success(function (model) {
        $scope.patients = model;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    }

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

    function handleErrors (err) {
      messenger.danger('An error occured.');
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(function (models) {
        $scope.projects = models.projects;
        $scope.allProjectIds =
          models.projects.data.reduce(function (a,b) { return a + ',' + b.id ; }, "")
          .substr(1);
        session.project = models.projects.data[0].id;
        search($scope.options[0]);
      })
      .catch(handleErrors);
    });

    $scope.search = search;
    $scope.reset = reset;
  }
]);
