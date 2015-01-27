angular.module('bhima.controllers')
.controller('distribution_record_view', [
  '$scope',
  '$timeout',
  '$routeParams',
  'appstate',
  'util',
  'validate',
  function ($scope, $timeout, $routeParams, appstate, util, validate) {
    // TODO add search (filter)
    // TODO add sortable (clickable) columns
    var dependencies = {};

    dependencies.depots = {
      required: true,
      query : {
        tables : {
          'depot' : {
            columns : ['uuid', 'text', 'reference', 'enterprise_id']
          }
        }
      }
    };
    validate.process(dependencies, ['depots']);

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
      updateTotals();
      session.searching = false;
    }

    function reset() {
      var request;

      request = {
        dateFrom : util.sqlDate(session.param.dateFrom),
        dateTo : util.sqlDate(session.param.dateTo),
        depotId : session.depot
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      session.searching = true;
      dependencies.consumption.query = '/reports/distributionPatients/?' + JSON.stringify(request);

      total.result = {};
      if ($scope.model.consumption) {
        $scope.model.consumption.data = [];
      }
      validate.refresh(dependencies, ['consumption']).then(updateSession);
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

/*    appstate.register('enterprise', function(enterprise) {
      validate.process(dependencies)
      .then(init);
    });*/

    $scope.select = select;
    $scope.reset = reset;
  }
]);
