angular.module('bhima.controllers')
.controller('salesRecords', [
  '$scope',
  '$timeout',
  '$translate',
  'util',
  'validate',
  function ($scope, $timeout, $translate, util, validate) {
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
        'sales' : totalSales,
        'patients' : totalPatients,
        'cost' : totalCost
      },
      result : {}
    };

    /*
     * UI Grid definitions
     */
    var gridOptions = { 
      enableSorting : true,
      columnDefs : []
    };
    
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

    dependencies.user_sale = {
      query : {
        tables : {
          'sale' : { columns : ['seller_id'] },
          'user' : {columns : ['id', 'first', 'last'] }
        },
        distinct : true,
        join : ['sale.seller_id=user.id']
      }
    };

    $timeout(init, 100);

    function init() {
      validate.process(dependencies, ['project', 'user_sale']).then(loadProjects);
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

      request = {
        dateFrom : util.sqlDate(session.param.dateFrom),
        dateTo : util.sqlDate(session.param.dateTo),
      };

      if (!isNaN(Number(session.project))) {
        request.project = session.project;
      }

      if (!isNaN(Number(session.user))) {
        dependencies.user = {
          query : {
            tables : {
              'user' : {columns : ['id', 'first', 'last'] }
            },
             where : [
              'user.id=' + session.user
            ]        
          }
        };
        validate.process(dependencies, ['user'])
        .then(function (model) {
          var userData = model.user.data[0];
          $scope.userSelected = userData.first + ' - ' + userData.last;
        });          
        request.user = session.user;
      } else {
        $scope.userSelected = $translate.instant('SALERECORD.ALL_USERS');
      }

      session.searching = true;
      dependencies.sale.query = '/reports/saleRecords/?' + JSON.stringify(request);

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

    $scope.format = function format(user) {
      return [user.first, user.last].join(' - ');
    };

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

    function totalSales() {
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
        if(!b.creditId){
          return a + b.cost;  
        } else {
          return a + 0;  
        }

      }, 0);
    }

    $scope.select = select;
    $scope.reset = reset;
  }
]);
