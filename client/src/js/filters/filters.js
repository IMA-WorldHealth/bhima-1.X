
(function (angular) {
  'use strict';

  angular.module('bhima.filters', [])
    .filter('boolean', function() {
      return function (input) {
        return Boolean(Number(input));
      };
    })

    .filter('intlcurrency', [
      '$http',
      '$filter',
      '$sce',
      'store',
      'messenger',
      function ($http, $filter, $sce, Store, messenger) {

        var currency = new Store({
          data : [],
          identifier : 'id'
        });

        $http.get('/finance/currencies')
        .success(function (data) {
          currency.setData(data);
        })
        .error(function (error) {
          messenger.danger('An error occured:' + JSON.stringify(error));
        });

        return function (value, id) {
          value = (value || 0).toFixed(2);

          if (!angular.isDefined(id) || !angular.isDefined(currency)) {
            return $sce.trustAsHtml($filter('currency')(value));
          }

          // first, extract the decimal digits '0.xx'
          var decimalDigits = value.slice(value.indexOf('.')+1, value.indexOf('.') + 3);

          if (decimalDigits) {
            value = value.slice(0, value.indexOf('.'));
          }

          var templ = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1'+currency.get(id).separator);
          templ += '<span class="desc">' + currency.get(id).decimal + decimalDigits + '</span><span class="cur"> ' + currency.get(id).symbol +  '</span>';

          return $sce.trustAsHtml(templ);
        };
      }
    ])
    .filter('unique', function () {
      return function (items, filterOn) {
        console.log('item est : ', items, 'filteron est ', filterOn);

        if (filterOn === false) {
          return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
          var newItems = [];

          var extractValueToCompare = function (item) {
            if (angular.isObject(item) && angular.isString(filterOn)) {
              return item[filterOn];
            } else {
              return item;
            }
          };

          angular.forEach(items, function (item) {
            var isDuplicate = false;

            for (var i = 0; i < newItems.length; i++) {
              if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              newItems.push(item);
            }
          });
          items = newItems;
        }
        return items;
      };
    })
    .filter('exchange', ['appstate', 'precision', function (appstate, precision) {
      var map;

      appstate.register('exchange_rate', function (globalRates) {
        // build rate map anytime the exchange rate changes.
        globalRates.forEach(function (r) {
          map[r.foreign_currency_id] = r.rate;
        });
      });

      return function (value, currency_id) {
        value = value || 0;
        var scalar = map[currency_id] || 1;
        return map ? precision.round(scalar*value, 2) : precision.round(value, 2);
      };
    }]);

})(angular);

