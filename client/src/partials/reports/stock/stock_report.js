angular.module('bhima.controllers')
.controller('stock_report', [
  '$scope',
  '$q',
  '$http',
  '$window',
  'stockControler',
  function ($scope, $q, $http, $window, stockControler) {
    var session = $scope.session = {};

    session.timestamp = new Date();

    stockParProduit();

    $scope.print = function print() {
      $window.print();
    };
    
    function stockParProduit () {
      // Calcul l'etat du stock par rapport a tous les produits dans le stock
      var def = $q.defer(),
          stock_inventory = [];

      // A FIXE : $http.get instead connect because cannot get distinct data with connect
      $http.get('/getDistinctInventories/')
      .success(function (inventories) {
        session.total = inventories.length;
        inventories.forEach(function (item) {
          var inventory = {};

          stockControler.getStock(item.inventory_uuid)
          .then(function (data) { inventory.stock = data;})
          .then(stockControler.getStockMin(item.inventory_uuid)
                .then(function (data) { inventory.stock_min = data; })
                .then(stockControler.getStockSecurity(item.inventory_uuid)
                      .then(function (data) { inventory.stock_security = data;})
                      .then(stockControler.getStockMax(item.inventory_uuid)
                            .then(function (data) { 
                              inventory.stock_max = data; 
                              inventory.uuid = item.inventory_uuid;
                              inventory.code = item.code;
                              inventory.text = item.text;
                              stock_inventory.push(inventory);

                              $scope.stock_inventory = stock_inventory;
                            })
                          )
                      )
                );

        });

      });
    }

    function sum(a, b) {
      return a + b.quantity;
    }

  }
]);
