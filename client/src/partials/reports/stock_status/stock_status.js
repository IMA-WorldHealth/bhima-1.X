angular.module('bhima.controllers')
.controller('stock_status', [
  '$scope',
  '$http',
  'StockDataService',
  function ($scope, $http, StockDataService) {
    var session = $scope.session = {};

    $scope.consumptions = {};
    session.date = new Date();

    if (document.readyState === 'complete') {

      $http.get('/getStockEntry/')
      .success(function(data) {

        data.forEach(function (item2) {

          StockDataService.getStock(item2.inventory_uuid)
          .then(function (val) {
            item2.total = Math.round(val);
          });

          StockDataService.getDelaiLivraison(item2.inventory_uuid)
          .then(function (val) {
          });

          StockDataService.getIntervalleCommande(item2.inventory_uuid)
          .then(function (val) {
          });

          StockDataService.getMonthlyConsumption(item2.inventory_uuid)
          .then(function (val) {
            item2.consumption_avg = Math.round(val);
          });

          StockDataService.getStockSecurity(item2.inventory_uuid)
          .then(function (val) {
            item2.consumption_security = Math.round(val);
          });

          StockDataService.getStockMin(item2.inventory_uuid)
          .then(function (val) {
            item2.consumption_min = Math.round(val);
          });

          StockDataService.getStockMax(item2.inventory_uuid)
          .then(function (val) {
            item2.consumption_max = Math.round(val);
          })
          .then(function() {
            var mstock = (item2.consumption_avg > 0) ? item2.total / item2.consumption_avg : 0,
                command = (item2.consumption_max - item2.total > 0 ) ? item2.consumption_max - item2.total : 0 ;

            item2.consumption_mstock = Math.floor(mstock);
            item2.consumption_command = Math.round(command);
          });

        });

        $scope.consumptions = data;
      });
    }
  }
]);
