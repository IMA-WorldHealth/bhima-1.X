angular.module('kpk.controllers')
.controller('exchangeRateController', function ($scope, $q, connect, messenger, appstate) {
  'use strict';

  var imports = {},
      stores = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap  = $scope.swap = {},
      data = $scope.data = {};

  $scope.enterprise = imports.enterprise = appstate.get('enterprise');
  var foreign_currency = $scope.data.foreign_currency = {};

  imports.currency = {tables : { 'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']}}};
  imports.exchange = {tables : { 'exchange_rate' : { 'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']}}};

  flags.current_exchange_rate = false;
  flags.visible = false;

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
      enterprise_currency_id : imports.enterprise.currency_id,
      foreign_currency_id : $scope.data.foreign_currency.id,
      rate : swap.rate,
      date : date 
    }]).then(function (result) {
      messenger.push({ type: 'success', msg: 'Added new exchange rate with id: ' + result.data.insertId});
      run();
    }, function (error) {
      messenger.push({type: 'danger', msg: 'Failed to post new exchange rate. Error: '+ error});
    });
  }

  function filterOptions (opts) {
    return opts.id !== imports.enterprise.currency_id;
  }

  function valid () {
    return angular.isDefined(foreign_currency.id) && angular.isDefined(swap.rate);
  }

  function getCurrency (id) {
    return stores.currency ? stores.currency.get(id) : {};
  }

  function formatCurrency (id) {
    return stores.currency && angular.isDefined(stores.currency.get(id)) ? stores.currency.get(id).name : '';
  }

  $scope.filterOptions = filterOptions;
  $scope.formatCurrency = formatCurrency;
  $scope.valid = valid;
  $scope.submit = submit;
  $scope.getCurrency = getCurrency;

  // start the controller
  run();

});
