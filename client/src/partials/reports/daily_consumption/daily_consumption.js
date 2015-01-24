angular.module('bhima.controllers')
.controller('daily_consumption', [
  '$scope',
  '$http',
  '$routeParams',
  'validate',
  'messenger',
  'connect',
  'appstate',
  'util',
  function ($scope, $http, $routeParams, validate, messenger, connect, appstate, util) {
    var dependencies = {},
        session = $scope.session = {},
        code_drugs = $scope.code_drugs,
        dateFrom = $scope.dateFrom,
        dateTo = $scope.dateTo,
        state = $scope.state;

    dependencies.drugs = {
      query : {
        identifier : 'id',
        tables : {
          'inventory' : { columns : ['uuid', 'code', 'text'] }
        },
        where: ['inventory.code=' + code_drugs]
      }
    };

    session.dateFrom = new Date();
    session.dateTo = new Date();

    // $http.get('/getConsumptionDrugs/',{params : {
    //       'dateFrom' : record.dateFrom,
    //       'dateTo' : record.dateTo
    //     }
    // }).
    // success(function(data) {
    //   $scope.consumptions = data;
    // });

    // $http.get('/getItemInConsumption/',{params : {
    //       'dateFrom' : dateFrom,
    //       'dateTo' : dateTo,
    //       'code' : code_drugs
    //     }
    // }).
    // success(function(result) {
    //   $scope.itemInConsumptions = result;
    // });

    function startup (models) {
      angular.extend($scope, models);
    }

    function generate () {
      $http.get(
        '/getConsumptionDrugs/',
        {params : {'dateFrom' : util.sqlDate(session.dateFrom), 'dateTo' : util.sqlDate(session.dateTo)}}
      ).success(function(data) {
        $scope.consumptions = data;
        $scope.state = 'generate';
      });
    }

    function reconfigure () {
      $scope.state = null;
      session.fiscal_year_id = null;
      session.period_id = null;
    }

    function printReport () {
      print();
    }

    function generateItem (code) {
      $http.get(
        '/getItemInConsumption/',
        {params : {'dateFrom' : util.sqlDate(session.dateFrom), 'dateTo' : util.sqlDate(session.dateTo), 'code' : code}}
      ).success(function(result) {
        $scope.itemInConsumptions = result;
        $scope.state = 'generateItem';
      });
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.generate = generate;
    $scope.reconfigure = reconfigure;
    $scope.printReport = printReport;
    $scope.generateItem = generateItem;
  }
]);
