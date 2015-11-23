angular.module('bhima.services')
.service('CurrencyService', CurrencyService);

CurrencyService.$inject = [ '$http', '$q', 'util' ];

function CurrencyService($http, $q, util) {
  var service = this;
  var cache;

  service.read = read;

  /* ------------------------------------------------------------------------ */

  function read() {

    // if we have currencies cached, return them directly
    if (cache) { return $q.resolve(cache); }

    return $http.get('/finance/currencies')
    .then(util.unwrapHttpResponse)
    .then(function (currencies) {

      // cache currencies to avoid future HTTP lookups.
      cache = currencies;
      return cache;
    });
  }

  return service;
}
