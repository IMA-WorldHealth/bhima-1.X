angular.module('bhima.controllers')
.controller('stock_store', [
  '$scope',
  '$timeout',
  '$routeParams',
  '$q',
  'util',
  'validate',
  'connect',
  function ($scope, $timeout, $routeParams, $q, util, validate, connect) {
    // TODO add search (filter)
    // TODO add sortable (clickable) columns
    var dependencies = {};
    $scope.timestamp = new Date();

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

    dependencies.consumption = {};
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
      $scope.uncompletedList = model;
      consumption = model.consumption.data;
      consumption.forEach(function (cons) {
        connect.fetch('/reports/stockComplete/?tracking_number=' + cons.tracking_number + '&depot_uuid=' + depotId)
        .then(function (data) {
          cons.current -= data[0].consumed;
        });

      });
      updateTotals();
      session.searching = false;
    }

    function reset() {
      var request;

      request = {
        depotId : depotId
      };

    dependencies.store = {
      required: true,
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference', 'enterprise_id']
          }
        },
        where : ['depot.uuid=' + depotId]
      }
    };
    validate.process(dependencies, ['store'])
    .then(function (model) {
      var dataDepot = model.store.data[0];
      $scope.depotSelected = dataDepot.text;
    });       



      session.searching = true;
      dependencies.consumption.query = '/reports/stockStore/?' + JSON.stringify(request);

      total.result = {};
      if ($scope.model.consumption) {
        $scope.model.consumption.data = [];
      }
      validate.refresh(dependencies, ['consumption'])
      .then(updateSession);
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

    function totalItems() {
      return $scope.model.consumption.data.length;
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);