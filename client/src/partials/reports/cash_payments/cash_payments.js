angular.module('bhima.controllers')
.controller('reportCashPayments', [
  '$scope',
  '$timeout',
  'connect',
  'appstate',
  'validate',
  '$filter',
  'exchange',
  function ($scope, $timeout, connect, appstate, validate, $filter, exchange) {
    var session = $scope.session = {};
    $scope.selected = null;

    var dependencies = {};
    dependencies.projects = {
      required: true,
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


    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
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

    function formatDates () {
      session.dateFrom = $filter('date')(session.dateFrom, 'yyyy-MM-dd');
      session.dateTo = $filter('date')(session.dateTo, 'yyyy-MM-dd');
    }

    function search (selection) {
      session.selected = selection.label;
      selection.fn();
    }

    function reset (p) {
      session.searching = true;
      var req, url;

      // toggle off active
      session.active = !p;

      formatDates();

      req = {
        dateFrom : session.dateFrom,
        dateTo : session.dateTo
      };

      url = '/reports/payments/?id=%project%&start=%start%&end=%end%'
      .replace('%project%', session.project)
      .replace('%start%', req.dateFrom)
      .replace('%end%', req.dateTo);

      connect.fetch(url)
      .then(function (model) {
        if (!model) { return; }
        $scope.payments = model;
        $timeout(function () {
          convert();
          session.searching = false;
        }, exchange.hasExchange() ? 0 : 100);
      });

    }

    appstate.register('project', function (project) {
      session.project = project.id;
      validate.process(dependencies)
      .then(function (models) {
        $scope.projects = models.projects;
        $scope.currencies = models.currencies;
        session.currency = $scope.currencies.data[0].id;
        $scope.allProjectIds =
          models.projects.data.reduce(function (a,b) { return a + ',' + b.id ; }, '')
          .substr(1);
        search($scope.options[0]);
      });
    });

    function convert () {
      var s = 0;
      $scope.payments.forEach(function (payment) {
        if (payment.currency_id === session.currency) {
          s += payment.cost;
        } else {
          s += payment.cost / exchange.rate(payment.cost, payment.currency_id, payment.date);
        }
      });
      session.sum = s;
    }

    $scope.$watch('payments', function () {
      if (!$scope.payments) { return; }
      var unique = [];
      $scope.payments.forEach(function (payment) {
        if (unique.indexOf(payment.deb_cred_uuid) < 0) {
          unique.push(payment.deb_cred_uuid);
        }
      });

      session.unique_debitors = unique.length;
    }, true);

    $scope.search = search;
    $scope.reset = reset;
    $scope.convert = convert;
  }
]);
