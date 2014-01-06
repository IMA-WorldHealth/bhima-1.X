// js/directives/directive.js

(function (angular) {
  'use strict';

  angular.module('kpk.directives', [])

    .directive('ngFocus', ['$parse', function ($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr.ngFocus);
        element.bind('focus', function (event) {
          scope.$apply(function () {
            fn(scope, {$event:event});
          });
        });
      };
    }])
     
    .directive('ngBlur', ['$parse', function ($parse) {
      return function(scope, element, attr) {
        var fn = $parse(attr.ngBlur);
        element.bind('blur', function (event) {
          scope.$apply(function () {
            fn(scope, {$event:event});
          });
        });
      };
    }])

    .directive('kpkAlert', ['$compile', function ($compile) {
      return {
        restrict: 'A',
        replace: true,
        link: function ($scope, element, attrs) {
          var template = 
            '<div class="kapok-alert">' + 
              '<alert type="alert.type" close="closeAlert()">{{alert.message}}</alert>' + 
            '</div>';

        }
      };
    
    }])

    .directive('treeModel', ['$compile', 'appcache', function($compile, appcache) {
      var MODULE_NAMESPACE = 'tree';
      var cache = new appcache(MODULE_NAMESPACE);
      
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var treeId = attrs.treeId;
          var treeModel = attrs.treeModel;
          var nodeId = attrs.nodeId || 'id';
          var nodeLabel = attrs.nodeLabel || 'label';
          var nodeChildren = attrs.nodeChildren || 'children'; 
          var template = 
            '<ul>' + 
              '<li data-ng-repeat="node in ' + treeModel + '">' + 
              //FIXME: Strange mix of CSS and HTML with glyphicons - see if there's a better way
                '<i class="collapsed glyphicon glyphicon-folder-close" data-ng-show="node.' + nodeChildren + '.length && node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i> ' + 
                '<i class="expanded glyphicon glyphicon-folder-open" data-ng-show="node.' + nodeChildren + '.length && !node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i> ' + 
                '<i class="normal glyphicon glyphicon-file" data-ng-hide="node.' + nodeChildren + '.length"></i> ' + 
                '<span data-ng-class="node.selected" data-ng-click="' + treeId + '.selectNodeLabel(node)">{{node.' + nodeLabel + '}}</span>' + 
                '<div data-ng-hide="node.collapsed" data-tree-id="' + treeId + '" data-tree-model="node.' + nodeChildren + '" data-node-id=' + nodeId + ' data-node-label=' + nodeLabel + ' data-node-children=' + nodeChildren + '></div>' + 
              '</li>' + 
            '</ul>';

          //Collapse by default
          // if (scope.node) scope.node.collapsed = true;

          //Assign select/ collapse methods - should only occur once
          if (treeId && treeModel) {
            if (attrs.angularTreeview) {
              scope[treeId] = scope[treeId] || {};
              scope[treeId].selectNodeHead = scope[treeId].selectNodeHead || function (selectedNode) {
                selectedNode.collapsed = !selectedNode.collapsed;
                
                //update store 
                cache.put(selectedNode.id_unit, {collapsed: selectedNode.collapsed});
              };
              scope[treeId].selectNodeLabel = scope[treeId].selectNodeLabel || function (selectedNode) {
                if (scope[treeId].currentNode && scope[treeId].currentNode.selected) {
                  scope[treeId].currentNode.selected = undefined;
                }
                selectedNode.selected = 'selected';
                scope[treeId].currentNode = selectedNode;
              };
            }
            element.html('').append($compile(template)(scope));
          }
        }
      };
    }]);

})(angular);
