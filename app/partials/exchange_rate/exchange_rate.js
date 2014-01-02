angular.module('kpk.controllers')
.controller('exchangeRateController', function ($scope, $q, connect) {
  var imports = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      swap = $scope.swap = {},
      stores = {};

  swap.to = {};
  swap.from = {};

  imports.currency = {
    tables : { 'currency' : { columns: ['id', 'name', 'symbol', 'note']}}
  };

  function initialize () {
    connect.req(imports.currency)
    .then(function (res) {
      stores.currency = res;
      models.currency = res.data;
    }, function (err) {
      console.log('error:', error);
    });
    console.log('models.currency:', models.currency);
  }

  function filterOptions (opts) {
    return opts.id !== swap.from.id;
  }
  
  $scope.submit = function () {
    // transform to MySQL date
    var date = new Date(),
        updated = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay();
    var data = {
      from_currency : swap.from.id,
      to_currency : swap.to.id,
      rate : swap.rate,
      updated : updated
    };

    connect.basicPut('exchange_rate', [data]).then(function (result) {
      console.log("posted with result:", result);
    });
  };

  function valid () {
    var t = swap.to,
        f = swap.from;
    return !(!!t.id && !!f.id && !!swap.rate);
  }

  function formatCurrency (curr) {
    return [curr.symbol, '|', curr.name].join(' '); 
  }

  $scope.$watch('flags', function () {
    console.log('flags changed:', flags);
    if (stores.currency && flags.from_currency_id !== undefined) {
      if (flags.to_currency_id) $scope.swap.to = stores.currency.get(flags.to_currency_id);
      $scope.swap.from = stores.currency.get(flags.from_currency_id);
    }
    console.log('from:', swap.from);
    console.log('to:', swap.to);
  }, true);

  
  $scope.filterOptions = filterOptions;
  $scope.formatCurrency = formatCurrency;
  $scope.valid = valid;

  // start the controller
  initialize();

});
