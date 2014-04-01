angular.module('kpk.controllers')
.controller('reportCashPayments', [
  '$scope',
  'connect',
  'appstate',
  'validate',
  'messenger',
  '$filter',
  function ($scope, connect, appstate, validate, messenger, $filter) {
    var session = $scope.session = {};
    $scope.selected = null;

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

      if (!isNaN(Number(session.project))) { req.project = session.project; }

      url = '/reports/payments/?id=%project%&start=%start%&end=%end%'
      .replace('%project%', req.project)
      .replace('%start%', req.dateFrom)
      .replace('%end%', req.dateTo);

      connect.fetch(url)
      .success(function (model) {
        $scope.payments = model;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });

    }

    appstate.register('project', function (project) {
      session.project = project.id;
      search($scope.options[0]);
    });

    function sum(a, b) {
      return a + b.cost;
    }

    $scope.sumPayments = function () {
      return $scope.payments ? $scope.payments.reduce(sum, 0) : 0;
    };

    $scope.search = search;
    $scope.reset = reset;
  }
]);
