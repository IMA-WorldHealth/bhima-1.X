angular.module('bhima.controllers')
.controller('distribution_service_record', [
  '$scope',
  '$timeout',
  '$routeParams',
  'util',
  'validate',
  function ($scope, $timeout, $routeParams, util, validate) {
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
        'totalItems' : totalItems
      },
      result : {}
    };

    var depotId = $routeParams.depotId;

    dependencies.sale = {};
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
        depotId : depotId
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      session.searching = true;
      dependencies.sale.query = '/reports/distributionServices/?' + JSON.stringify(request);

      total.result = {};
      if ($scope.model.sale) {
        $scope.model.sale.data = [];
      }
      validate.refresh(dependencies, ['sale']).then(updateSession);
    }

    function today() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      // $scope.session.param.dateTo.setDate($scope.session.param.dateTo.getDate() - 1);
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

    function totalItems() {
      return $scope.model.sale.data.length;
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
