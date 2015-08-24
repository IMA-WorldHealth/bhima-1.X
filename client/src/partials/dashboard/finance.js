angular.module('bhima.controllers')

// composes query strings nicely off a url and
// an object of potential queries.
// queries = { hasId : 0, utm_awesome: undefined } => '?hasId=1'
.service('QueryService', function () {
  var service = {};

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

  // get the top-spending debtor groups
  service.getTopDebtorGroups = function () {
    return $http.get('/analytics/debtorgroups/top');
  };

  return service;
}]);
