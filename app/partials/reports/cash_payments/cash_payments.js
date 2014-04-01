angular.module('kpk.controllers')
.controller('reportCashPayments', [
  '$scope',
  '$timeout',
  'connect',
  'appstate',
  'validate',
  'messenger',
  '$filter',
  'exchange',
  function ($scope, $timeout, connect, appstate, validate, messenger, $filter, exchange) {
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

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
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

      url = '/reports/payments/?id=%project%&start=%start%&end=%end%'
      .replace('%project%', session.project)
      .replace('%start%', req.dateFrom)
      .replace('%end%', req.dateTo);

      connect.fetch(url)
      .success(function (model) {
        $scope.payments = model;
        $timeout(function () {
          convert();
        }, exchange.hasExchange() ? 0 : 100);
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
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
          models.projects.data.reduce(function (a,b) { return a + ',' + b.id ; }, "")
          .substr(1);
        search($scope.options[0]);
      })
      .catch(function (error) { messenger.danger('An error occurred : ' + JSON.stringify(error)); });
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

    $scope.search = search;
    $scope.reset = reset;
    $scope.convert = convert;
  }
]);
