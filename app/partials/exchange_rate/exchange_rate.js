angular.module('kpk.controllers').controller('exchangeRateController', function ($scope, connect) {
  var currency;

  currency = {
    tables : {
      'currency' : {
        columns: ["id", "name", "symbol", "note", "current_rate", "last_rate", "updated"]
      }
    }
  };

  var model, store, from, to;
  from = $scope.from = {};
  to = $scope.to = {};
  $scope.form = {};
  connect.req(currency).then(function (response) {
    store = response;
    $scope.currencies = response.data;
    to.data = angular.copy(response.data);
    from.data = angular.copy(response.data);
  });

  $scope.filter = function (v) {
    return v.id !== from.currency_id;
  };
  
  $scope.updateTo = function () {
    to.symbol = store.get(to.currency_id).symbol;
  };

  $scope.updateFrom = function () {
    from.symbol = store.get(from.currency_id).symbol;
  };

  $scope.getToSymbol = function () {
    var data = (store && store.get(from.currency_id)) ? store.get(from.currency_id) : {};
    return (data.id === to.currency_id) ? "" : to.symbol; 
  };
  
  $scope.submit = function () {
    // transform to MySQL date
    var date = new Date();
    var updated = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay();
    var data = {
      id: from.currency_id,
      current_rate: from.current_rate,
      last_rate : store.get(from.currency_id).current_rate,
      updated: updated 
    };
    connect.basicPost('currency', [data], ['id']);
  };

  $scope.valid = function () {
    // OMG
    return !(!!to.currency_id && !!from.currency_id && !!from.current_rate);
  };

  $scope.label = function (curr) {
    return [curr.symbol, '|', curr.name].join(' '); 
  };

});