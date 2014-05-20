
(function (angular) {
  'use strict';

  angular.module('bhima.filters', [])
    .filter('boolean', function() {
      return function (input) {
        return Boolean(Number(input));
      };
    })

    .filter('intlcurrency', [
      '$filter',
      '$sce',
      'messenger',
      'validate',
      'precision',
      function ($filter, $sce, messenger, validate, precision) {
        var dependencies = {},
            currency;

        dependencies.currency = {
          required : true,
          query : {
            tables : {
              'currency' : {
                columns: ['id', 'symbol', 'name', 'note', 'decimal', 'separator']
              }
            }
          }
        };

        validate.process(dependencies)
        .then(function (models) {
          currency = models.currency;
        }, function  (err) {
          messenger.danger('An error occured:' + JSON.stringify(err));
        });

        return function (value, id) {
          value = (value || 0).toFixed(2);

          if (!angular.isDefined(id) || !angular.isDefined(currency)) {
            return $sce.trustAsHtml($filter('currency')(value));
          }

          // first, extract the decimal digits '0.xx'
          var decimalDigits = value.slice(value.indexOf('.')+1, value.indexOf('.') + 3);

          if (decimalDigits)
            value = value.slice(0, value.indexOf('.'));
          var templ = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1"+currency.get(id).separator);
          templ += '<span class="desc">' + currency.get(id).decimal + decimalDigits + '</span><span class="cur"> ' + currency.get(id).symbol +  '</span>';

          return $sce.trustAsHtml(templ);
        };
      }
    ])
   
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

