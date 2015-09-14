angular.module('bhima.services')
.service('StockDataService', [
  'validate', '$http', '$q', 'connect', StockDataService
]);

function StockDataService(validate, $http, $q, connect) {
  var service = this;
  var dependencies = {};

  service.getMonthCount         = getMonthCount;
  service.getMonthlyConsumption = getMonthlyConsumption;
  service.getDelaiLivraison     = getDelaiLivraison;
  service.getIntervalleCommande = getIntervalleCommande;
  service.getStockSecurity      = getStockSecurity;
  service.getExpirationRisk     = getExpirationRisk;
  service.getStockMin           = getStockMin;
  service.getStockMax           = getStockMax;
  service.getStockMonth         = getStockMonth;
  service.getStock              = getStock;
  service.getStockToCommand     = getStockToCommand;

  service.getConsumption        = getConsumption;
  service.getRecentDonations    = getRecentDonations;
  service.getStockAlerts        = getStockAlerts;

  /* ------------------------------------------------------------------------ */

  function getConsumption(limit) {
    return $http.get('/consumption?limit=' + limit);
  }

  function getStockAlerts() {
    return $http.get('/stockalerts');
  }

  // returns consumption
  function getMonthCount(uuid) {
    var def = $q.defer();
    var url = '/getNombreMoisStockControl/' + uuid;

    $http.get(url)
    .then(function (response) {
      var nb = (response.data.nb > 6) ? 6 : response.data.nb;
      def.resolve(nb);
    });

    return def.promise;
  }

  function getMonthlyConsumption(uuid) {
    var def = $q.defer();
    dependencies.consumptions = {};
    getMonthCount(uuid)
    .then(function (nb) {
      dependencies.consumptions.query = '/monthlyConsumptions/' + uuid + '/' + nb;
      validate.process(dependencies, ['consumptions'])
      .then(function (data) {
        var nb_consumption = (data.consumptions.data.length) ? data.consumptions.data[0].quantity : 0;
        nb_consumption = (nb > 0) ? nb_consumption / nb : 0;
        def.resolve(nb_consumption);
      });
    });

    return def.promise;
  }

  function getDelaiLivraison(uuid) {
    var def = $q.defer();
    dependencies.dl = {};
    dependencies.dl.query = '/getDelaiLivraison/' + uuid;

    validate.process(dependencies, ['dl'])
    .then(function (data) {
      var dl = (data.dl.data.dl) ? data.dl.data.dl : 1;
      def.resolve(dl);
    });
    return def.promise;
  }

  function getRecentDonations(limit) {
    return $http.get('/donations?limit='+limit);
  }

  function getIntervalleCommande(uuid) {
      var def = $q.defer();
      dependencies.commandes = {};
      dependencies.commandes.query = '/getCommandes/'+uuid;

      validate.process(dependencies, ['commandes'])
      .then(function (data) {
          var commandes = data.commandes.data;
          var dates = [], sMonth = 0, sAvg = 0;

          if (commandes.length) {
              commandes.forEach(function (item) {
                dates.push(new Date(item.date_commande));
              });
              if (dates.length > 1) {
                  dates.sort(function (x, y) {
                    var d1 = new Date(x).setHours(0,0,0,0);
                    var d2 = new Date(y).setHours(0,0,0,0);
                    if ( d2 - d1 > 0) {
                      return 1;
                    } else if (d2 - d1 < 0) {
                      return -1;
                    } else {
                      return 0;
                    }
                  });

                  for (var i = 1 ; i < dates.length ; i++) {
                    sMonth += DateDiff.inMonths(dates[i], dates[i-1]);
                  }

                  if (sMonth === 0) {
                    // Si on a deux ou plusieurs commande mais au meme jour => sMonth = 0
                    sAvg = 1;
                  } else {
                    sAvg = sMonth / (dates.length - 1);
                  }

              } else {
               sAvg = 1;
              }
          } else {
            sAvg = 0;
          }

        def.resolve(sAvg);
      });

      var DateDiff = {
          inDays: function(d1, d2) {
              var t2 = d2.getTime();
              var t1 = d1.getTime();
              return parseInt((t2-t1)/(24*3600*1000));
          },
          inWeeks: function(d1, d2) {
              var t2 = d2.getTime();
              var t1 = d1.getTime();

              return parseInt((t2-t1)/(24*3600*1000*7));
          },
          inMonths: function(d1, d2) {
              var d1Y = d1.getFullYear();
              var d2Y = d2.getFullYear();
              var d1M = d1.getMonth();
              var d2M = d2.getMonth();

              return (d2M+12*d2Y)-(d1M+12*d1Y);
          },
          inYears: function(d1, d2) {
              return d2.getFullYear()-d1.getFullYear();
          }
      };

      return def.promise;
  }

  function getStockSecurity (uuid) {
      var def = $q.defer();

      getMonthlyConsumption(uuid)
      .then(function (cm) {
          getDelaiLivraison(uuid)
          .then(function (dl) {
              def.resolve(cm * dl);
          });
      });
      return def.promise;
  }

  function getExpirationRisk (uuid) {
      var def = $q.defer();
      dependencies.monthsBeforeExpiration = {};
      dependencies.monthsBeforeExpiration.query = '/getMonthsBeforeExpiration/' + uuid;

      validate.process(dependencies, ['monthsBeforeExpiration'])
      .then(function (data) {
          def.resolve(data);
      });
      return def.promise;
  }

  function getStockMin (uuid) {
      var def = $q.defer();
      getStockSecurity(uuid)
      .then(function (ss) {
          def.resolve(ss*2);
      });
      return def.promise;
  }

  function getStockMax(uuid) {
      var def = $q.defer();
      getMonthlyConsumption(uuid)
      .then(function (ms) {
          getIntervalleCommande(uuid)
          .then(function (ic) {
              getStockMin(uuid)
              .then(function (sm) {
                  var sM = (ms * ic) + sm;
                  def.resolve(sM);
              });
          });
      });
      return def.promise;
  }

  function getStock (uuid) {
      var def = $q.defer();
      dependencies = {};
      dependencies.allConsumptions = {
          query : {
              tables : {
                  consumption : { columns : ['quantity']},
                  stock : { columns : ['inventory_uuid']}
              },
              join : ['consumption.tracking_number=stock.tracking_number'],
              where : ['stock.inventory_uuid=' + uuid ]
          }
      };

      dependencies.allReversing = {
          query : {
              tables : {
                  consumption : { columns : ['quantity']},
                  consumption_reversing : { columns : ['consumption_uuid']},
                  stock : { columns : ['inventory_uuid']}
              },
              join : ['consumption.tracking_number=stock.tracking_number','consumption.uuid=consumption_reversing.consumption_uuid'],
              where : ['stock.inventory_uuid=' + uuid ]
          }
      };

      dependencies.stock = {
          query : {
              tables : {
                  stock : {columns : ['quantity']}
              },
              where : ['stock.inventory_uuid=' + uuid ]
          }
      };

      validate.process(dependencies, ['allConsumptions', 'allReversing', 'stock'])
      .then(function (data) {
          var allCons = data.allConsumptions.data;
          var allReversing = data.allReversing.data;
          var consumption = (data.allConsumptions.data.length) ? getConsumptionCount(data.allConsumptions.data) : 0;
          var consumptionReversing = (data.allReversing.data.length) ? getConsumptionCount(data.allReversing.data) : 0;
          var stock = (data.stock.data.length) ? getStockCount(data.stock.data) : 0;
          def.resolve(stock - consumption + consumptionReversing);
      });

      function getConsumptionCount (tab) {
          return tab.reduce(function (x, y) {
              return x + y.quantity;
          }, 0);
      }

      function getStockCount (tab) {
          return tab.reduce(function (x, y) {
              return x + y.quantity;
          }, 0);
      }
      return def.promise;
  }

  function getStockMonth (uuid) {
      var def = $q.defer();
      getStock(uuid)
      .then(function (s) {
          getMonthlyConsumption(uuid)
          .then(function (cm) {
              var stock_month = (cm > 0) ? s / cm : 0;
              def.resolve(stock_month);
          });
      });
      return def.promise;
  }

  function getStockToCommand (uuid) {
      var def = $q.defer();
      getStockMax(uuid)
      .then(function (sM) {
          getStock(uuid)
          .then(function (s) {
              var q = sM - s;
              q = (q > 0 ) ? q : 0;
              def.resolve(q);
          });
      });
      return def.promise;
  }
}
