angular.module('kpk.controllers')
.controller('exchangeRateController', function ($scope, $q, connect, appstate) {
  'use strict';

  var imports = {},
      stores = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap = $scope.swap = {};

  imports.enterprise = appstate.get('enterprise');
  imports.currency = {tables : { 'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']}}};
  imports.exchange = {tables : { 'exchange_rate' : { 'columns' : ['id', 'currency_1', 'currency_2', 'rate', 'date']}}};

  swap.currency1 = {};
  swap.currency2 = {};

  function run () {
    var dependencies = ['currency', 'exchange'];
    console.log(appstate);

    $q.all([
      connect.req(imports.currency),
      connect.req(imports.exchange)
    ]).then(function (array) {
      array.forEach(function (depends, idx) {
        stores[dependencies[idx]] = depends;
        models[dependencies[idx]] = depends.data;
      });
    }, function (error) {
      console.log('error:', error);
    });
  }

  function filterOptions (opts) {
    return opts.id !== swap.currency1.id;
  }
  
  function submit () {
    // transform to MySQL date
    var date = new Date(),
        formattedDate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay();

    console.log(swap.rate);

    connect.basicPut('exchange_rate', [{
      currency_1 : swap.currency1.id,
      currency_2: swap.currency2.id,
      rate : swap.rate,
      date : formattedDate 
    }]).then(function (result) {
      console.log('posted with result:', result);
      run();
    }, function (error) {
      console.log('error', error);
    });
  }

  function valid () {
    var t = swap.currency2,
        f = swap.currency1;
    return !(!!t.id && !!f.id && !!swap.rate);
  }

  function formatCurrency (curr) {
    return [curr.symbol, '|', curr.name].join(' '); 
  }

  function formatExchangeCurrency (id) {
    return stores.currency ? stores.currency.get(id).symbol : id; 
  }
  
  $scope.filterOptions = filterOptions;
  $scope.formatCurrency = formatCurrency;
  $scope.valid = valid;
  $scope.submit = submit;
  $scope.formatExchangeCurrency = formatExchangeCurrency;

  // start the controller
  run();

});
