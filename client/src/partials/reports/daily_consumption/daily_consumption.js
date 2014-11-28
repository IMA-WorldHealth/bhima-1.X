angular.module('bhima.controllers')
.controller('daily_consumption', [
  '$scope',
  '$translate',
  '$http',
  '$routeParams',  
  'validate',
  'messenger',
  'connect',
  'appstate',
  'util',
  function ($scope, $translate, $http, $routeParams, validate, messenger, connect, appstate, util) {
    var dependencies = {},
        session = $scope.session = {},
        code_drugs       = $scope.code_drugs = $routeParams.code_drugs,
        dateFrom       = $scope.dateFrom = $routeParams.dateFrom,
        dateTo       = $scope.dateTo = $routeParams.dateTo;

    dependencies.getDrugs = {
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
    session.From = dateFrom;
    session.To = dateTo;

    var record = connect.clean(session);
    record.dateFrom = util.sqlDate(record.dateFrom);
    record.dateTo = util.sqlDate(record.dateTo);

    $http.get('/getConsuptionDrugs/',{params : {
          'dateFrom' : record.dateFrom, 
          'dateTo' : record.dateTo
        }  
    }).
    success(function(data) {
      $scope.consumptions = data;
    });
    
    $http.get('/getItemInConsumption/',{params : {
          'dateFrom' : dateFrom, 
          'dateTo' : dateTo,
          'code' : code_drugs
        }  
    }).
    success(function(result) {
      $scope.itemInConsumptions = result;
    });

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    function reset () {
      record = connect.clean(session);
      record.dateFrom = util.sqlDate(record.dateFrom);
      record.dateTo = util.sqlDate(record.dateTo);

      $http.get('/getConsuptionDrugs/',{params : {
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

    function generateReference () {
      window.data = $scope.getDrugs.data;
      var max = Math.max.apply(Math.max, $scope.getDrugs.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }
  }  
]);
