angular.module('bhima.controllers')
.controller('cotisation_payment', [
  '$scope',
  '$translate',
  '$http',
  '$routeParams',
  'connect',  
  'validate',
  'appstate',
  'util',
  function ($scope, $translate, $http, $routeParams, connect, validate, appstate, util) {
    var dependencies = {},
        session = $scope.session = {},
        total = $scope.total = 0,
        sum_due = $scope.sum_due = 0,
        sum_paid = $scope.sum_paid = 0,
        state = $scope.state;

    dependencies.getPeriods = {
      query : {
        identifier : 'id',
        tables : {
          'paiement_period' : { 
            columns : ['id', 'label', 'dateFrom', 'dateTo']
          }
        }
      }
    };

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    };

    function reset () {
      var record = connect.clean(session);
      dependencies.periods = {
        query : {
          identifier : 'id',
          tables : {
            'paiement_period' : { 
              columns : ['id', 'label', 'dateFrom', 'dateTo']
            }
          },
          where : ['paiement_period.id=' + record.period_id]
        }
      };
      validate.process(dependencies, ['periods'])
      .then(function (model) {
        var period = $scope.period =model.periods.data[0];
      });

      appstate.register('enterprise', function (enterprise) {
        $scope.enterprise = enterprise;
        validate.process(dependencies)
        .then(startup);
      });

      connect.fetch('/reports/cotisation_payment/?id=' + record.period_id)
      .then(function (data) {
        console.log(data);
        $scope.Reports = data;
        console.log('la monnaie',$scope.enterprise.currency_id);
        
        data.forEach(function (item) {
          $scope.total += item.value;
          if (!item.posted){
            item.amount_paid = 0;
            $scope.sum_due += item.value;
            console.log('La somme Due ',$scope.sum_due);            
          } else {
            item.amount_paid = item.value;
            $scope.sum_paid += item.value;
          }          
        });

      });
      $scope.state = 'generate';
    }

    $scope.print = function print() {
      window.print();
    };

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

   function reconfigure () {
      $scope.state = null;
      session.period_id = null;
    }

    $scope.reset = reset;
    function generateReference () {
      window.data = $scope.getPeriods.data;
      var max = Math.max.apply(Math.max, $scope.getPeriods.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    } 
    $scope.reconfigure = reconfigure;
  } 
]);

