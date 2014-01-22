
(function (angular) {
  'use strict'; 

  angular.module('kpk.filters', [])
    .filter('boolean', function() {
      return function (input) {
        return Boolean(Number(input));
      };
    })

    .filter('intlcurrency', function ($filter, $sce, connect) {
      
      var currency;

      connect.req({ tables : { 'currency' : { columns: ['id', 'symbol', 'name', 'note', 'decimal', 'separator'] }}})
      .then(function (store) {
        currency = store;
      });

      return function (value, id) {
        // This should be re-written to do cool things.
        value = (value || 0).toString();

        if (!id || !currency) return $sce.trustAsHtml($filter('currency')(value));

        // first, extract the decimal digits '0.xx'
        var decimalDigits = ~value.indexOf('.') ? value.slice(value.indexOf('.')+1, value.indexOf('.') + 3) : '00';
        if (decimalDigits) value = value.slice(0, value.indexOf('.'));
        var templ = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1"+currency.get(id).separator);
        templ += '<span class="desc">' + currency.get(id).decimal + decimalDigits + '</span><span class="cur"> ' + currency.get(id).symbol +  '</span>';

        return $sce.trustAsHtml(templ);
      };
    });

    
})(angular);

