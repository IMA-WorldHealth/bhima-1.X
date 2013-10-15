
(function(angular) { 
  'use strict';

  angular.module('bikaCellSelect', []).directive('bikaSelect', function() {

    var template = "<select></select>";

    return {
      restrict: "A",
      require: "^smartTable",
      template: template,
      replace: true,
      scope: {},
      link: function(scope, element, attrs, ctrl) {

        console.log('scope:', scope);
        console.log('element:', element);
        console.log('attrs:', attrs);
        console.log('ctrl:', ctrl);
      }
    };
  });

})(angular);
