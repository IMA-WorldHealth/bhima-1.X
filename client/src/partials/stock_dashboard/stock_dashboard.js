angular.module('bhima.controllers')
.controller('stock_dashboard', [
  '$scope',
  '$translate',
  '$http',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $translate, $http, validate, messenger, connect, appstate) {
    var dependencies = {},
        session = $scope.session = {},
        expiredTotal = $scope.expiredTotal = {};

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $http.get('/getTop10Consumption/').
    success(function(data) {
      $scope.consumptions = data;
    });

    $http.get('/getTop10Donor/').
    success(function(data) {
      $scope.donors = data;
    });

    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'OrdersPayed'
        }  
    }).
    success(function(data) {
	    //console.log(data);      
      $scope.orderpayed = data;
    });


    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'OrdersWatingPayment'
        }  
    }).
    success(function(data) {
	    //console.log(data);      
      $scope.OrdersWatingPayment = data;
    });

    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'OrdersReceived'
        }  
    }).
    success(function(data) {
	    //console.log(data);      
      $scope.OrdersReceived = data;
    });


    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'InWatingReception'
        }  
    }).
    success(function(data) {
	    //console.log(data);      
      $scope.InWatingReception = data;
    });

    /* Consumption By tracking_number */
    $http.get('/getConsumptionTrackingNumber/').
    success(function(data) {
      //console.log(data);      
      $scope.TrackingNumbers = data;
    });

    /* For Expiring date */
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'expired'
        }  
    }).
    success(function(data) {
      //console.log(data);      
      $scope.expired = data;
      $scope.nbExpired = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired -= 1;
            }
          } 
        }
      }
    });

    // Expire dans 30 jours
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'expiredDellai',
          'inf'     : '0',
          'sup'     : '30'
        }  
    }).
    success(function(data) {      
      $scope.expired30 = data;
      $scope.nbExpired30 = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired30 -= 1;
            }
          } 
        }
      }
    });

    // Expire dans 30 90 jours
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'expiredDellai',
          'inf'     : '30',
          'sup'     : '90'
        }  
    }).
    success(function(data) {      
      $scope.expired3090 = data;
      $scope.nbExpired3090 = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired3090 -= 1;
            }
          } 
        }
      }
    });

    // Expire dans 90 180 jours
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'expiredDellai',
          'inf'     : '90',
          'sup'     : '180'
        }  
    }).
    success(function(data) {      
      $scope.expired180 = data;
      $scope.nbExpired180 = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired180 -= 1;
            }
          } 
        }
      }
    });

    // Expire dans 180 365 jours
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'expiredDellai',
          'inf'     : '180',
          'sup'     : '365'
        }  
    }).
    success(function(data) {      
      $scope.expired365 = data;
      $scope.nbExpired365 = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired365 -= 1;
            }
          } 
        }
      }
    });

    // Expire dans 1 year jours
    $http.get('/getExpiredTimes/',{params : {
          'request' : 'oneYear'
        }  
    }).
    success(function(data) {      
      $scope.expired1 = data;
      $scope.nbExpired1 = data.length;
      for (item in $scope.TrackingNumbers){
        var TrackingNumber = $scope.TrackingNumbers[item];
        for(item2 in data){
          var data2 = data[item2];
          if(data2.tracking_number === TrackingNumber.tracking_number){
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if(diffQuantity <= 0){
              $scope.nbExpired1 -= 1;
            }
          } 
        }
      }
    });
    // STOCK PAR PRODUITS
    $http.get('/getStockEntry/').
    success(function(data) {
      $scope.enterStocks = data;
    });

    $http.get('/getStockConsumption/').
    success(function(data) {
      var stocksOut = 0,
        stocksIn = 0;

      for (item in $scope.enterStocks){
        var stock = $scope.enterStocks[item];
        for(item2 in data){
          var data2 = data[item2],
              diff;
          if(data2.inventory_uuid === stock.inventory_uuid){
            //console.log(data2.text+" inventory- "+stock.text);
            //console.log(stock.quantity+" - "+data2.quantity);
            diff = stock.quantity - data2.quantity;
            if(diff === 0){
              stocksOut++;
              console.log("Finis " + stocksOut);
            } else if (diff > 0){
              stocksIn++;
              console.log("En stock " + stocksIn);
            }
          }
        }
      }
      $scope.stocksOut = stocksOut;
      $scope.stocksIn = stocksIn;
      $scope.OutStocks = data;
    });

    

  } 
]);