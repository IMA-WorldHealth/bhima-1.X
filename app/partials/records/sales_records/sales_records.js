angular.module('kpk.controllers')
.controller('salesRecords', [
  '$scope',
  '$routeParams',
  '$timeout',
  '$filter',
  'validate',
  function($scope, $routeParams, $timeout, $filter, validate) {
    // TODO add search (filter)
    // TODO add sortable (clickable) columns
    var defaultInvoice = ($routeParams.recordID || -1),
        dependencies = {};
    
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
        'sales' : totalSales,
        'patients' : totalPatients,
        'cost' : totalCost
      },
      result : {}
    };
    
    // $scope.$watch('session.param', formatDates, true);

    dependencies.sale = {};
    dependencies.project = {
      query : {
        tables : {
          project : {
            columns : ["id", "abbr", "name"]
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
      // session.project = model.project.data[0].id;
    
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

      formatDates();
      
      request = {
        dateFrom : session.param.dateFrom,
        dateTo : session.param.dateTo,
      };

      if (!isNaN(Number(session.project))) request.project = session.project;

      session.searching = true;
      dependencies.sale.query = '/reports/saleRecords/?' + JSON.stringify(request);

      total.result = {};
      if ($scope.model.sale) $scope.model.sale.data = [];
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
      $scope.session.param.dateTo.setDate($scope.session.param.dateTo.getDate() - 7);
      reset();
    }

    function month() { 
      $scope.session.param.dateFrom = new Date();
      $scope.session.param.dateTo = new Date();
      $scope.session.param.dateTo.setDate($scope.session.param.dateTo.getMonth() - 1);
      reset();
    }

    function updateTotals() {
      for (key in total.method) {
        total.result[key] = total.method[key]();
      }
    }

    function totalSales() {
      return $scope.model.sale.data.length;
    }

    function totalPatients() { 
      var total = 0, evaluated = {};

      $scope.model.sale.data.forEach(function (sale) { 
        if (evaluated[sale.debitor_uuid]) return;
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

    function formatDates() { 
      session.param.dateFrom = $filter('date')(session.param.dateFrom, 'yyyy-MM-dd');
      session.param.dateTo = $filter('date')(session.param.dateTo, 'yyyy-MM-dd');
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
