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
      session.dateFrom.setDate(session.dateTo.getDate() - session.dateTo.getDay());
      reset();
    }

    function month () {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      session.dateFrom.setDate(1);
      reset();
    }

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function search (selection) {
      session.selected = selection;
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

      if (!session.project) {session.project = $scope.allProjectIds; }

      url = '/reports/patients/?id=' + session.project;
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
        session.project = project.id;
        search($scope.options[0]);
      })
      .catch(handleErrors);
    });

    $scope.search = search;
    $scope.reset = reset;
  }
]);
