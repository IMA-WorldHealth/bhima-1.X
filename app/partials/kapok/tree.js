angular.module('kpk.controllers')
.controller('treeController', function($scope, $q, $location, appcache, connect) {    
  // TODOs:
  //   appcache is not used.  Theoretically, the users and permissions depend on an
  //   enterprise, so do we need it or not?
  'use strict';

  $scope.treeData = [];

  function formatElementGroup (group) {
    // recursively format elements
    if (!group) return;
    return group.map(function (element) {
      element.label = element.name;
      element.children = formatElementGroup(element.children);
      return element;
    });
  }

  $scope.$watch('navtree.currentNode', function( newObj, oldObj ) {
    if ($scope.navtree && angular.isObject($scope.navtree.currentNode)) {
      var path = $scope.navtree.currentNode.p_url;
      if (path) $location.path(path);
    }
  }, true);

  (function init () {
    // Load the Tree!
    connect.basicGet('/tree')
    .then(function (res) { 
      $scope.treeData = formatElementGroup(res.data);
    });
  })();

});
