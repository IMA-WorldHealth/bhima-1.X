angular.module('kpk.controllers')
.controller('exchangeRateController', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'appstate',
  'validate',
function ($scope, $q, connect, messenger, appstate, validate) {
  'use strict';

  var dependencies = {};

  dependencies.currency = {
    required : true,
    query : {
      tables : {
        'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']
        }
      }
    } 
  };

  dependencies.rates = {
    query : {
      tables : { 
        'exchange_rate' : {
          'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
        }
      }
    }
  };

  appstate.register('enterprise', function (enterprise) {
    $scope.enterprise = enterprise;
    // run everything
    validate.process(dependencies).then(run, handleError);
  });


  function handleError (err) {
    console.log('error is being called as well.');
    messenger.danger('An error occured' + JSON.stringify(err)); 
  }

  function run (models) {
    for (var k in models) $scope[k] = models[k];


    $scope.today = new Date().toISOString().slice(0, 10);
    $scope.showCalculator = false;

    $scope.newRate = {};
  }

  $scope.$watch('rates.data', function () {
    if (!$scope.rates) return;
    $scope.currentRates = $scope.rates.data.filter(function (rate) {
      return new Date(rate.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    });
  }, true);

  $scope.submit = function () {
    if (!valid()) messenger.warning('<b>Warning</b>Not all required fields are filled in.');
    var data = {
      enterprise_currency_id : $scope.enterprise.currency_id,
      foreign_currency_id : $scope.newRate.foreign_currency_id,
      rate : $scope.newRate.rate,
      date : $scope.today
    };

    connect.basicPut('exchange_rate', [data])
    .then(function (result) {
      // set global exchange rate
      appstate.set('exchange_rate', data);
      // add to store
      data.id = result.data.insertId;
      $scope.rates.post(data);
      // reset rate
      $scope.newRate = {};
    }, function (error) {
      messenger.danger('Failed to post new exchange rate. Error: '+ error);
    });
  };

  $scope.filterOptions = function (currency) {
    return currency.id !== $scope.enterprise.currency_id;
  };

  function valid () {
    return angular.isDefined($scope.newRate.foreign_currency_id) &&
      angular.isDefined($scope.newRate.rate);
  }

}]);
