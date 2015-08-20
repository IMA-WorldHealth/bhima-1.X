angular.module('bhima.controllers')

.service('QueryService', function () {
  var service = {};

  // composes query strings nicely off a url and
  // an object of potential queries.
  // queries = { hasId : 0, utm_awesome: undefined } => '?hasId=1'
  service.compose = function (url, queries) {
    var value, params = [];

    // append the querystring to the url
    url += '?';

    // loop through the queries, and if they are defined,
    // append them to the params object
    // NOTE - values can be arrays, strings, or numbers
    Object.keys(queries).forEach(function (key) {
      value = queries[key];
      if (angular.isDefined(value)) {
        params.push(key + '=' + value.toString());
      }
    });

    url += params.join('&');

    return url;
  };

  return service;
})


// Finance DashBoard Service
// Performs the HTTP queries for the financial dashboard controller
.service('FinanceDashboardService', ['$http', 'QueryService', function ($http, QS) {

  var service = {};

  service.getCashBoxes = function () {
    return $http.get('/analytics/cashboxes');
  };

  service.getCurrencies = function () {
    return $http.get('/finance/currencies');
  };

  service.getCashBoxBalance = function (boxId, currencyId, hasPostingJournal) {
    var stub = '/analytics/cashboxes/' + boxId + '/balance',
        url = QS.compose(stub, { currencyId : currencyId, hasPostingJournal : hasPostingJournal  });

    return $http.get(url);
  };

  service.getCashBoxHistory = function (boxId, currencyId, hasPostingJournal, grouping) {
    var stub = '/analytics/cashboxes/' + boxId + '/history',
        url = QS.compose(stub, {
          currencyId : currencyId,
          hasPostingJournal : hasPostingJournal,
          grouping : grouping
        });

    return $http.get(url);
  };

  return service;

}])

.controller('FinanceDashboardController', ['FinanceDashboardService', 'appcache', function (Finance, AppCache) {
  var self = this;

  // defaults
  // TODO - should be loaded from AppCache
  self.hasPostingJournal = 1;
  self.currencyId = 1;
  self.cashBoxGrouping = 'day';

  // data for the cashbox chart
  self.cashBoxChart = {
    data : [],
    labels : []
  };

  // get the available cashboxes
  Finance.getCashBoxes()
  .then(function (response) {
    console.log('CashBoxes:', response.data);
    self.cashboxes = response.data;

    // load the default cash balance
    // TODO - this should be dependent on localstorage
    self.getCashBalance(self.cashboxes[0].id);
  });

  // load available currencies
  Finance.getCurrencies()
  .then(function (response) {
    console.log('Currencies', response.data);
    self.currencies = response.data;
  });

  // load the balance data for a single account
  self.getCashBalance = function (id) {
    console.log('Loading cash balance:', id);
    Finance.getCashBoxBalance(id, self.currencyId, self.hasPostingJournal)
    .then(function (response) {
      console.log('CashBoxBalance:', response.data);
      self.cashBoxChart.data = [ response.data.debit, response.data.credit];
      self.cashBoxChart.labels = ['Debit', 'Credit'];
    });
  };

  // load the analytics history of the given cashbox
  self.getCashHistory = function (id) {
    console.log('Loading cash history:', id);
    Finance.getCashBoxHistory(id, self.currencyId, self.hasPostingJournal, self.cashBoxGrouping)
    .then(function (response) {
      console.log('CashBoxHistory', response.data);
      self.cashBoxHistory = response.data;
    });
  };

  self.refresh = function () {
    console.log('Called refresh!');
  };

}]);
