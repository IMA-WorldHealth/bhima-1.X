angular.module('bhima.controllers')
.controller('cotisation_payment', [
  '$scope',
  '$translate',
  '$http',
  '$routeParams',
  'connect',  
  'validate',
  'exchange',
  'appstate',
  'util',
  function ($scope, $translate, $http, $routeParams, connect, validate, exchange, appstate, util) {
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

      connect.fetch('/reports/cotisation_payment/?id=' + record.period_id)
      .then(function (data) {
        $scope.Reports = data;
        
        data.forEach(function (item) {
          var itemCurrency = 0;
          if($scope.enterprise.currency_id !== item.currency_id){
            itemCurrency = item.value / exchange.rate(item.value, item.currency_id,new Date());  
          } else {
            itemCurrency = item.value;
          }

          $scope.total += itemCurrency;


          if (!item.posted){
            item.amount_paid = 0;
            $scope.sum_due += itemCurrency;          
          } else {
            item.amount_paid = item.value;
            $scope.sum_paid += itemCurrency;
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
      session.currency = $scope.enterprise.currency_id;
      validate.process(dependencies)
      .then(startup);
    });

   function reconfigure () {
      $scope.state = null;
      session.period_id = null;
    }

    function convert () {
      var sumTotal = 0,
        sumDue = 0,
        sumPaie = 0,
        item = 0;

      $scope.Reports.forEach(function (payment) {
        if($scope.enterprise.currency_id !== item.currency_id){
          item = payment.value / exchange.rate(payment.value, payment.currency_id,new Date());  
        } else {
          item = payment.value;
        }
        sumTotal += item;
        if (!payment.posted){
          sumDue += item;          
        } else {
          sumPaie += item;
        }          
      });

      if($scope.enterprise.currency_id !== session.currency){
        $scope.total = sumTotal * exchange.rate(sumTotal, session.currency,new Date());  
        $scope.sum_due = sumDue * exchange.rate(sumDue, session.currency,new Date());  
        $scope.sum_paid = sumPaie * exchange.rate(sumPaie, session.currency,new Date());  
      } else {        
        $scope.total = sumTotal;  
        $scope.sum_due = sumDue;  
        $scope.sum_paid = sumPaie;  
      }  
    }

    $scope.convert = convert;
    $scope.reset = reset;
    function generateReference () {
      window.data = $scope.getPeriods.data;
      var max = Math.max.apply(Math.max, $scope.getPeriods.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    } 
    $scope.reconfigure = reconfigure;
  } 
]);

