angular.module('bhima.controllers')
.controller('auxillaryRecords', [
  '$scope',
  '$timeout',
  'util',
  'validate',
  'connect',
  function ($scope, $timeout, util, validate, connect) {
    // TODO add search (filter)
    // TODO add sortable (clickable) columns
    var dependencies = {};

    var period = $scope.period = [
      {
        key : 'CASH_PAYMENTS.DAY',
        method : today
      },
      {
        key : 'CASH_PAYMENTS.WEEK',
        method : week
      },
      {
        key : 'CASH_PAYMENTS.MONTH',
        method : month
      }
    ];

    var session = $scope.session = {
      param : {},
      searching : true
    };

    var total = $scope.total = {
      method : {
        'cash' : totalCash,
        'patients' : totalPatients,
        'cost' : totalCost
      },
      result : {}
    };

    dependencies.cash = {};
    dependencies.project = {
      query : {
        tables : {
          project : {
            columns : ['id', 'abbr', 'name']
          }
        }
      }
    };

    $timeout(init, 100);

    function init() {
      validate.process(dependencies, ['project']).then(loadProjects);
    }

    function loadProjects(model) {
      $scope.model = model;
      // TODO Determine best way to wait for page load before requesting data
      select(period[0]);
    }

    function select(period) {
      session.selected = period;
      period.method();
    }

    function updateSession(model) {
      $scope.model = model;
      updateTotals();
      session.searching = false;
    }

    function reset() {
      var request;

      request = {
        dateFrom : util.sqlDate(session.param.dateFrom),
        dateTo : util.sqlDate(session.param.dateTo),
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      console.log('session.project', session.project);
      console.log('request.project', request.project);
      console.log('session.selected', session.selected);

      session.searching = true;
      var url = '/reports/payments/?id=%project%&start=%start%&end=%end%'
      .replace('%project%', session.selected.id)
      .replace('%start%', request.dateFrom)
      .replace('%end%', request.dateTo);

      connect.fetch(url)
      .then(function (model) {
        console.log('le model est :', model);
        // if (!model) { return; }
        // $scope.payments = model;
        // $timeout(function () {
        //   convert();
        //   session.searching = false;
        // });
      });


      // total.result = {};
      // if ($scope.model.sale) {
      //   $scope.model.sale.data = [];
      // }
      // validate.refresh(dependencies, ['sale']).then(updateSession);
    }

    function today() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      reset();
    }

    function week() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate($scope.session.param.dateTo.getDate() - $scope.session.param.dateTo.getDay());

      reset();
    }

    function month() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate(1);
      reset();
    }

    function updateTotals() {
      for (var key in total.method) {
        total.result[key] = total.method[key]();
      }
    }

    function totalCash() {
      return $scope.model.sale.data.length;
    }

    function totalPatients() {
      var total = 0, evaluated = {};

      $scope.model.sale.data.forEach(function (sale) {
        if (evaluated[sale.debitor_uuid]) { return; }
        total++;
        evaluated[sale.debitor_uuid] = true;
      });

      return total;
    }

    function totalCost() {
      return $scope.model.sale.data.reduce(function (a, b) {
        return a + b.cost;
      }, 0);
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
