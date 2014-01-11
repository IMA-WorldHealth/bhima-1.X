angular.module('kpk.controllers')
.controller('exchangeRateController', function ($scope, $q, connect, messenger, appstate) {
  'use strict';

  var imports = {},
      stores = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap = $scope.swap = {};

  imports.enterprise = appstate.get('enterprise');
  imports.currency = {tables : { 'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']}}};
  imports.exchange = {tables : { 'exchange_rate' : { 'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']}}};

  flags.current_exchange_rate = false;
  swap.currency1 = {};
  swap.currency2 = {};

  function run () {
    var dependencies = ['currency', 'exchange'];

    $q.all([
      connect.req(imports.currency),
      connect.req(imports.exchange)
    ]).then(function (array) {
      array.forEach(function (depends, idx) {
        stores[dependencies[idx]] = depends;
        models[dependencies[idx]] = depends.data;
      });
      models.enterprise = imports.enterprise;
      if (imports.enterprise.currency_id) swap.currency1 = stores.currency.get(imports.enterprise.currency_id);
      // calculate today's exchange rate
      models.exchange.forEach(function (e) {
        if (new Date(e.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) {
          flags.current_exchange_rate = true;
          swap.current_exchange_rate = e;
        }
      });
    }, function (error) {
      messenger.danger('Could not load currency information:' + error);
    });
  }

  function submit () {
    // transform to MySQL date
    var date = new Date().toISOString().slice(0, 10).replace('T', ' ');

    connect.basicPut('exchange_rate', [{
      enterprise_currency_id : swap.currency1.id,
      foreign_currency_id : swap.currency2.id,
      rate : swap.rate,
      date : date 
    }]).then(function (result) {
      messenger.push({ type: 'success', msg: 'Added new currency with id: ' + result.data.insertId});
      run();
    }, function (error) {
      messenger.push({type: 'danger', msg: 'Failed to post new exchange rate. Error: '+ error});
    });
  }

  function filterOptions (opts) {
    return opts.id !== swap.currency1.id;
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
    return stores.currency && angular.isDefined(id) ? stores.currency.get(id).symbol : id; 
  }
  
  $scope.filterOptions = filterOptions;
  $scope.formatCurrency = formatCurrency;
  $scope.formatExchangeCurrency = formatExchangeCurrency;
  $scope.valid = valid;
  $scope.submit = submit;

  // start the controller
  run();

});
