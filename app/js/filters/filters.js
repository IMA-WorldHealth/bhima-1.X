angular.module('bika.filters', [])
  .filter('boolean', function() {
    return function (input) {
      // HOLY CRAP THIS IS A COMPLICATED FILTER
      return Boolean(Number(input));
    };
  });
