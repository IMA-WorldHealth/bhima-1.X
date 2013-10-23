(function (angular) {
  'use strict';

  angular.module('bika.directives', [])
    .directive('chkbox', function () {
      return {
        restrict: "AE",
        template: '<input type="checkbox" ng-model="checked">',
        replace: true,
        scope: {
          model: '=model'  // Two-way bound
        },
        link: function(scope, element, attr, ctrl) {

          scope.checked = Boolean(scope.model);
          scope.$watch('checked', function() {
            scope.model = (scope.checked) ? 1 : 0;
          }); 
        }
      };
    });
})(angular);
