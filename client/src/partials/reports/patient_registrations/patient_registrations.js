angular.module('bhima.controllers')
.controller('reportPatientRegistrations', [
  '$scope',
  '$filter',
  '$translate',
  'validate',
  'connect',
  'appstate',
  function ($scope, $filter, $translate, validate, connect, appstate) {
    var session = $scope.session = { count : {} };
    var dependencies = {};
    $scope.selected = null;

    dependencies.projects = {
      query : {
        tables : {
          'project' : {
            columns : ['id', 'abbr', 'name']
          }
        }
      }
    };

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

    function search (selection) {
      session.selected = selection;
      selection.fn();
    }

    function reset (p) {
      var req, url;
      session.searching = true;

      // toggle off active
      session.active = !p;

      req = {
        dateFrom : $filter('date')(session.dateFrom, 'yyyy-MM-dd'),
        dateTo : $filter('date')(session.dateTo, 'yyyy-MM-dd')
      };

      console.log('session.project', session.project);

      url = '/reports/patients/?id=' + session.project;
      url += '&start=' + req.dateFrom;
      url += '&end=' + req.dateTo;

      connect.fetch(url)
      .then(function (model) {
        $scope.patients = model;
        session.searching = false;
      });
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(function (models) {
        $scope.projects = models.projects;
        var allProjectIds =
          models.projects.data.reduce(function (a,b) { return a + ',' + b.id ; }, '')
          .substr(1);
        $scope.projects.post({
          id : allProjectIds,
          name : $translate.instant('CASH_PAYMENTS.ALL_PROJECTS')
        });
        session.project = project.id;
        search($scope.options[0]);
      });
    });

    $scope.$watch('patients', function () {
      if (!$scope.patients) { return; }
      session.count.male = 0;
      session.count.female = 0;
      $scope.patients.forEach(function (p) {
        session.count[p.sex === 'M' ? 'male' : 'female' ] += 1;
      });
    });

    $scope.search = search;
    $scope.reset = reset;
  }
]);
