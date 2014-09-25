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
        session = $scope.session = {};

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
	  console.log(data);      
      $scope.orderpayed = data;
    });


    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'OrdersWatingPayment'
        }  
    }).
    success(function(data) {
	  console.log(data);      
      $scope.OrdersWatingPayment = data;
    });

    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'OrdersReceived'
        }  
    }).
    success(function(data) {
	  console.log(data);      
      $scope.OrdersReceived = data;
    });


    $http.get('/getPurchaseOrders/',{params : {
          'request' : 'InWatingReception'
        }  
    }).
    success(function(data) {
	  console.log(data);      
      $scope.InWatingReception = data;
    });

  } 
]);