angular.module('bhima.controllers')
.controller('StockDashboardController', StockDashboardController);

StockDashboardController.$inject = [
  '$scope', '$http', '$q', 'validate', 'StockDataService'
];

function StockDashboardController($scope, $http, $q, validate, DataService) {
  var vm = this;

  // bind view values
  vm.purchaseorders = {};

  // startup the module
  loadPurchaseDetails();
  loadConsumptionDetails();
  loadRecentDonations();
  loadExpirationDetails();
  loadStockAlerts();

  /* ----------------------------------------------------------------------- */

  // startup
  // stockParProduit();

  // get the top most consumed items
  function loadConsumptionDetails() {
    DataService.getConsumption(10)
    .then(function (response) {
      vm.consumption = response.data;
    });
  }

  // load stock alerts
  function loadStockAlerts() {
    DataService.getStockAlerts()
    .then(function (response) {
      vm.alerts = response.data;
    });
  }

  /*
  * Loads the most recent donations into the dashboard
  */
  function loadRecentDonations() {
    // TODO -- make this number configurable
    DataService.getRecentDonations(10)
    .then(function (response) {
      vm.donations = response.data;
    });
  }

  // Load information about purchases orders based on their statuses.
  // We are getting orders that
  //  1) have not been approved
  //  2) have been paid but not fulfilled
  //  3) are in transit
  //  4) have been paid and delivered
  function loadPurchaseDetails() {
    var target = '/purchaseorders?status=',
        statuses;

    statuses = [
      'pending',
      'paid',
      'shipped',
      'delivered'
    ];

    $q.all(statuses.map(function (status) {
      return $http.get(target + status);
    }))
    .then(function (array) {
      vm.purchaseorders.pending   = array[0].data[0].count;
      vm.purchaseorders.paid      = array[1].data[0].count;
      vm.purchaseorders.shipped   = array[2].data[0].count;
      vm.purchaseorders.delivered = array[3].data[0].count;
    });
  }


  /* Consumption By tracking_number */
  $http.get('/getConsumptionTrackingNumber/').
  success(function (data) {
    $scope.TrackingNumbers = data;
  });


  function loadExpirationDetails() {
    /* For Expiring date */
    $http.get('/getExpiredTimes/', {params : {
          'request' : 'expired'
        }
    }).
    success(function (data) {
      $scope.expired = data;
      $scope.nbExpired = data.length;
      for (var item in $scope.TrackingNumbers) {
        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired -= 1;
            }
          }
        }
      }
    });

    // Expire dans 30 jours
    $http.get('/getExpiredTimes/', {params : {
          'request' : 'expiredDellai',
          'inf'     : '0',
          'sup'     : '30'
        }
    }).
    success(function (data) {
      $scope.expired30 = data;
      $scope.nbExpired30 = data.length;
      for (var item in $scope.TrackingNumbers) {
        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired30 -= 1;
            }
          }
        }
      }
    });

    // Expire dans 30 90 jours
    $http.get('/getExpiredTimes/', {params : {
          'request' : 'expiredDellai',
          'inf'     : '30',
          'sup'     : '90'
        }
    }).
    success(function (data) {
      $scope.expired3090 = data;
      $scope.nbExpired3090 = data.length;
      for (var item in $scope.TrackingNumbers) {
        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired3090 -= 1;
            }
          }
        }
      }
    });

    // Expire dans 90 180 jours
    $http.get('/getExpiredTimes/', {params : {
          'request' : 'expiredDellai',
          'inf'     : '90',
          'sup'     : '180'
        }
    }).
    success(function (data) {
      $scope.expired180 = data;
      $scope.nbExpired180 = data.length;
      for (var item in $scope.TrackingNumbers) {

        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired180 -= 1;
            }
          }
        }
      }
    });

    // Expire dans 180 365 jours
    $http.get('/getExpiredTimes/', {
      params : {
      'request' : 'expiredDellai',
      'inf'     : '180',
      'sup'     : '365'
      }
    }).
    success(function (data) {
      $scope.expired365 = data;
      $scope.nbExpired365 = data.length;
      for (var item in $scope.TrackingNumbers) {

        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired365 -= 1;
            }
          }
        }
      }
    });

    // Expire dans 1 year jours
    $http.get('/getExpiredTimes/', {
      params : {
      'request' : 'oneYear'
    }
    })
    .success(function (data) {
      $scope.expired1 = data;
      $scope.nbExpired1 = data.length;
      for (var item in $scope.TrackingNumbers) {
        var TrackingNumber = $scope.TrackingNumbers[item];
        for (var item2 in data) {
          var data2 = data[item2];
          if (data2.tracking_number === TrackingNumber.tracking_number) {
            var diffQuantity = data2.quantity - TrackingNumber.quantity;
            if (diffQuantity <= 0) {
              $scope.nbExpired1 -= 1;
            }
          }
        }
      }
    });
  }

  // STOCK PAR PRODUITS
  $http.get('/getStockEntry/').
  success(function (data) {
    $scope.enterStocks = data;
  });

  $http.get('/getStockConsumption/').
  success(function (data) {
    var stocksOut = 0,
        stocksIn = 0;


    for (var item in $scope.enterStocks) {
      var stock = $scope.enterStocks[item];
      for (var item2 in data) {
        var data2 = data[item2],
            diff;
        if (data2.inventory_uuid === stock.inventory_uuid) {
          diff = stock.quantity - data2.quantity;
          if (diff === 0) {
            stocksOut++;
          } else if (diff > 0) {
            stocksIn++;
          }
        }
      }
    }
    $scope.stocksOut = stocksOut;
    $scope.stocksIn = stocksIn;
    $scope.OutStocks = data;
  });
}
