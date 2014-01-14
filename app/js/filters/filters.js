
(function (angular) {
  'use strict'; 

  angular.module('kpk.filters', [])
    .filter('boolean', function() {
      return function (input) {
        return Boolean(Number(input));
      };
    })

    .filter('intlcurrency', function ($filter) {
      return function (value, type) {
        value = (value || '0').toString();
        var formatted = '';
        switch (type) {
          default :
            formatted = $filter('currency')(value);
            break;
          case 'FC':
            formatted = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
            formatted += '<span class="desc">,00</span><span class="cur">FC</span>';
            break;
          case 'EUR':
            formatted = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
            formatted = formatted + '<span class="desc">,00</span><span class="cur">€</span>';
            break;
        }
        return formatted;
      };
    });
    
})(angular);

