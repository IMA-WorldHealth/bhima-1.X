(function (angular) {
	'use strict';

	angular.module('angularTreeview', []).directive('treeModel', ['$compile', function($compile) {
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
							'<i class="collapsed glyphicon glyphicon-folder-close" data-ng-show="node.' + nodeChildren + '.length && node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i>' + 
							'<i class="expanded glyphicon glyphicon-folder-open" data-ng-show="node.' + nodeChildren + '.length && !node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i>' + 
							'<i class="normal glyphicon glyphicon-file" data-ng-hide="node.' + nodeChildren + '.length"></i> ' + 
							'<span data-ng-class="node.selected" data-ng-click="' + treeId + '.selectNodeLabel(node)">{{node.' + nodeLabel + '}}</span>' + 
							'<div data-ng-hide="node.collapsed" data-tree-id="' + treeId + '" data-tree-model="node.' + nodeChildren + '" data-node-id=' + nodeId + ' data-node-label=' + nodeLabel + ' data-node-children=' + nodeChildren + '></div>' + 
						'</li>' + 
					'</ul>';  


				if(treeId && treeModel) {
					if(ttrs.angularTreeview) {
						scope[treeId] = scope[treeId] || {};
						scope[treeId].selectNodeHead = scope[treeId].selectNodeHead || function(selectedNode){
							selectedNode.collapsed = !selectedNode.collapsed;
						};
						scope[treeId].selectNodeLabel = scope[treeId].selectNodeLabel || function(selectedNode){
							if(scope[treeId].currentNode && scope[treeId].currentNode.selected) {
								scope[treeId].currentNode.selected = undefined;
							}
							selectedNode.selected = 'selected'
							scope[treeId].currentNode = selectedNode;
						};
					}
					element.html('').append($compile(template)(scope));
				}
			}
		};
	}]);
})(angular);
