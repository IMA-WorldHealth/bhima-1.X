angular.module('bhima.services')
.service('exchange', [
  '$timeout',
  'store',
  'appstate',
  'messenger',
  'precision',
  function ($timeout, Store, appstate, messenger, precision) {
    var called = false;

    function normalize (date) {
      return date.setHours(0,0,0,0);
    }

    function exchange (value, currency_id, date) {
      // This function exchanges data from the currency specified by currency_id to
      // the enterprise currency on a given date (default: today).
      date = date || new Date();
      date = normalize(new Date(date));
      if (!exchange.store) { return value; }

      var store = exchange.store.get(date);
      if (!store && !called) { // HACK to only show one messenger instance
        messenger.danger('No exchange rates loaded for date: ' + new Date(date));
        called = true;
        $timeout(function () { called = false; }, 50);
      }

      return precision.round(exchange.store && store && store.rateStore.get(currency_id) ? store.rateStore.get(currency_id).rate * value : value);
    }

    exchange.rate = function rate (value, currency_id, date) {
      /* jshint unused : false */
      date = date || new Date();
      date = normalize(new Date(date));
      if (!exchange.store) { return 1; }

      var store = exchange.store.get(date);
      if (!store) { messenger.danger('No exchange rates loaded for date: ' + new Date(date)); }
      return precision.round(exchange.store && store && store.rateStore.get(currency_id) ? store.rateStore.get(currency_id).rate : 1);
    };

    exchange.hasExchange = function hasExchange () {
      return !!exchange.store && !!Object.keys(exchange.store).length;
    };

    exchange.hasDailyRate = function hasDailyRate () {
      var date = normalize(new Date());
      return !!exchange.store && !!exchange.store.get(date);
    };

    appstate.register('exchange_rate', function (rates) {
      $timeout(function () { exchange.hasExchange(); }); // Force refresh

      var store = exchange.store = new Store({ identifier : 'date', data : [] });

      rates.forEach(function (rate) {
        var date = normalize(new Date(rate.date));
        if (!store.get(date)) {
          store.post({ date : date, rateStore : new Store({ data : [] }) });
          store.get(date).rateStore.post({ id : rate.enterprise_currency_id, rate : 1}); // default rate for enterprises
          store.get(date).rateStore.post({
            id : rate.foreign_currency_id,
            rate : rate.rate,
          });
        } else {
          store.get(date).rateStore.post({
            id : rate.foreign_currency_id,
            rate : rate.rate,
          });
        }
      });
    });

    return exchange;
  }
]);
