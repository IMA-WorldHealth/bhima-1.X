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
        code_drugs       = $scope.code_drugs = $routeParams.code_drugs,
        dateFrom       = $scope.dateFrom = $routeParams.dateFrom,
        dateTo       = $scope.dateTo = $routeParams.dateTo;

/*    dependencies.getDrugs = {
      query : {
        identifier : 'id',
        tables : {
          'inventory' : { columns : ['uuid', 'code', 'text'] }
        },
        where: ['inventory.code=' + code_drugs]
      }
    };
*/
/*    session.dateFrom = new Date();
    session.dateTo = new Date();
    session.From = dateFrom;
    session.To = dateTo;*/

/*    var record = connect.clean(session);
    record.dateFrom = util.sqlDate(record.dateFrom);
    record.dateTo = util.sqlDate(record.dateTo);
*/
    $http.get('/getStockEntry/').
    success(function(data) {
      data.forEach(function (item2) {
        //Niveau en Stock
        stockControler.getStock(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Command  " + val);
          item2.total = val;
        });

        stockControler.getDelaiLivraison(item2.inventory_uuid)
        .then(function (val) {
          console.log("Le delai de livraison " + val);
        });

        stockControler.getIntervalleCommande(item2.inventory_uuid)
        .then(function (val) {
          console.log("Intervalle de Commande " + val);
        });

        stockControler.getMonthlyConsumption(item2.inventory_uuid)
        .then(function (val) {
          item2.consumption_avg = val;
        });

            //Obtention du stock de securite
        stockControler.getStockSecurity(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Securite " + val);
          item2.consumption_security = val;
        });

        //Obtention du stock de Minimum 
        stockControler.getStockMin(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Minimum  " + val);
          item2.consumption_min = val;
        });

        // Obtention du stock Max
        stockControler.getStockMax(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Maximum  " + val);
          item2.consumption_max = val;
        });            

        // Mois Stock
        stockControler.getStockMonth(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Mois Stock  " + val);
          item2.consumption_mstock = val;
        });

        stockControler.getStockToCommand(item2.inventory_uuid)
        .then(function (val) {
          //console.log("Command  " + val);
          item2.consumption_command = val;
        });                        
      });  
      $scope.consumptions = data;
    });
/*
    $http.get('/getStockConsumption/').
    success(function(data) {
      for (item in $scope.stocks){
        console.log("Quantity Data2");
        var stock = $scope.stocks[item];

        data.forEach(function (item2) {
          if(item2.inventory_uuid === stock.inventory_uuid) {
            //console.log("Voici inventory UUID : "+ stock.inventory_uuid);
            item2.total = stock.quantity - item2.quantity;
            
            //Obtention de la consomation moyenne mensuel
            stockControler.getMonthlyConsumption(stock.inventory_uuid)
            .then(function (val) {
              //console.log("La consommation " + val);
              item2.consumption_avg = val;
            });

            //Obtention du stock de securite
            stockControler.getStockSecurity(stock.inventory_uuid)
            .then(function (val) {
              //console.log("Securite " + val);
              item2.consumption_security = val;
            });

            //Obtention du stock de Minimum 
            stockControler.getStockMin(stock.inventory_uuid)
            .then(function (val) {
              //console.log("Minimum  " + val);
              item2.consumption_min = val;
            });

            // Obtention du stock Max
            stockControler.getStockMax(stock.inventory_uuid)
            .then(function (val) {
              //console.log("Maximum  " + val);
              item2.consumption_max = val;
            });            

            // Mois Stock
            stockControler.getStockMonth(stock.inventory_uuid)
            .then(function (val) {
              //console.log("Mois Stock  " + val);
              item2.consumption_mstock = val;
            });

            stockControler.getStockToCommand(stock.inventory_uuid)
            .then(function (val) {
              //console.log("Command  " + val);
              item2.consumption_command = val;
            });                        
          }                  
        });
      }
      $scope.consumptions = data;
    });
*/
    /****************************************************/

    /*********************************************************************/
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
