angular.module('bhima.controllers')
.controller('distribution_record_view', [
  '$scope',
  '$timeout',
  '$routeParams',
  'appstate',
  'util',
  'validate',
  function ($scope, $timeout, $routeParams, appstate, util, validate) {
    var dependencies = {},
        state = $scope.state,
        session = $scope.session = { param : {}, searching : true };

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

    var total = $scope.total = {
      method : {
        'totalItems' : totalItems
      },
      result : {}
    };

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
     
    dependencies.project = {
      query : {
        tables : {
          project : {
            columns : ['id', 'abbr', 'name']
          }
        }
      }
    };

    dependencies.consumption = {};

    validate.process(dependencies, ['depots']);
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

      dependencies.store = {
        required: true,
        query : {
          tables : {
            'depot' : {
              columns : ['uuid', 'text', 'reference', 'enterprise_id']
            }
          },
          where : ['depot.uuid=' + session.depot]
        }
      };
      validate.process(dependencies, ['store'])
      .then(function (model) {
        var dataDepot = model.store.data[0];
        $scope.depotSelected = dataDepot.text;
      }); 

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
    }

    function week() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate($scope.session.param.dateTo.getDate() - $scope.session.param.dateTo.getDay());
    }

    function month() {
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateFrom.setDate(1);
    }

    function updateTotals() {
      for (var key in total.method) {
        total.result[key] = total.method[key]();
      }
    }

    function totalItems() {
      return $scope.model.consumption.data.length;
    }

    function generate() {
      reset();
      $scope.state = 'generate';
    }

    function reconfigure() {
      $scope.state = null;
    }

    function printReport() {
      print();
    }

    $scope.select = select;
    $scope.reset = reset;
    $scope.generate = generate;
    $scope.reconfigure = reconfigure;
    $scope.printReport = printReport;
  }
]);