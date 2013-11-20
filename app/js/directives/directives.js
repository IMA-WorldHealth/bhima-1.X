// js/directives/directive.js

(function (angular) {
  angular.module('kpk.directives', [])
    .directive('vScroller', function () {
      return {
        restrict: "A",
        template: "<tbody data-ng-repeat='row in view' ng-transclude style='width:100%;'></tbody>", 
        transclude: true,
        replace: false,
        scope: {
          as: "@",
          vsModel: "=",
          vsInitNumber: "@"
        },
        controller: function ($scope, $element, $attrs) {
          console.log("v-scroller controller fn");
          var top = $element[0]; 
          var init = $attrs.vsInitNumber;
          $scope.view = [];
          $scope.model = [];
          $scope.label = $attrs.vsAs;

          $scope.renderRows = function () {
            var i = 0;
            do {
              if ($scope.model.length < 1) { break; }
              $scope.view.push($scope.model.shift()); 
              i++;
            } while (i < init);
          };

          $scope.init = function () {
            $scope.model = angular.copy($scope.vsModel);
            $scope.renderRows();
          };
        },
        link: function ($scope, $element, $attrs) {
          console.log("v-scroller link fn");
          var top = $element[0];

          $scope.$watch('vsModel', function() {
            if ($scope.vsModel) {
              $scope.ready = true;
              $scope.init();
            }
          }); 

          $element.bind('scroll', function () {
            $scope.$apply($scope.renderRows());
          });
        }
      };
    })

    .directive('ngFocus', ['$parse', function($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr['ngFocus']);
        element.bind('focus', function(event) {
          scope.$apply(function() {
            fn(scope, {$event:event});
          });
        });
      };
    }])
     
    .directive('ngBlur', ['$parse', function($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr['ngBlur']);
        element.bind('blur', function(event) {
          scope.$apply(function() {
            fn(scope, {$event:event});
          });
        });
      };
    }]);

})(angular);
