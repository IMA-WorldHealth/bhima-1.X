angular.module('bhima.controllers')
.controller('stock_status', [
  '$scope',
  '$translate',
  '$http',
  '$routeParams',  
  'validate',
  'messenger',
  'connect',
  'appstate',
  'util',
  'stockControler',
  function ($scope, $translate, $http, $routeParams, validate, messenger, connect, appstate, util, stockControler) {
    var dependencies = {},
        session = $scope.session = {},
        code_drugs       = $scope.code_drugs = $routeParams.code_drugs;


    $http.get('/getStockEntry/').
    success(function(data) {
      data.forEach(function (item2) {
        console.log(item2);
        stockControler.getStock(item2.inventory_uuid)
        .then(function (val) {
          item2.total = val;
        });

        stockControler.getDelaiLivraison(item2.inventory_uuid)
        .then(function (val) {
        });

        stockControler.getIntervalleCommande(item2.inventory_uuid)
        .then(function (val) {
        });

        stockControler.getMonthlyConsumption(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_avg = val;
        });

        stockControler.getStockSecurity(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_security = val;
        });

        stockControler.getStockMin(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_min = val;
        });

        // Obtention du stock Max
        stockControler.getStockMax(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_max = val;
        });            

        stockControler.getStockMonth(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_mstock = val;
        });

        stockControler.getStockToCommand(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_command = val;
        });                        
      });  
      $scope.consumptions = data;
    });

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

/*    function reset () {
      record = connect.clean(session);
      record.dateFrom = util.sqlDate(record.dateFrom);
      record.dateTo = util.sqlDate(record.dateTo);

      $http.get('/getStockSituation/',{params : {
            'dateFrom' : record.dateFrom, 
            'dateTo' : record.dateTo
          }  
      }).
      success(function(data) {
        console.log(data.length);
        $scope.consumptions = data;
      });      
    }

    $scope.reset = reset;
*/
/*    function generateReference () {
      window.data = $scope.getDrugs.data;
      var max = Math.max.apply(Math.max, $scope.getDrugs.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }*/
  }  
]);
