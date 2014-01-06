angular.module('kpk.controllers')
.controller('treeController', function($scope, $q, $location, appcache, connect) {    
  // TODOs:
  //   Theoretically, the users and permissions depend on an
  //   enterprise, so do we need it or not?
  'use strict';
  
  var MODULE_NAMESPACE = 'tree'; 
  var cache = new appcache(MODULE_NAMESPACE);

  $scope.treeData = [];

  function formatElementGroup (group) {
    // recursively format elements
    if (!group) return;
    return group.map(function (element) {
      // element.has_children
      // element.collapsed = true;
      
      if(element.has_children) {
        cache.fetch(element.id_unit).then(function(res) { if(res) element.collapsed = res.collapsed; });
      }
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
    
    cache.fetchAll().then(function(res) { 
      console.log('all got', res);
    });

    connect.basicGet('/tree')
    .then(function (res) { 
      $scope.treeData = formatElementGroup(res.data);
    });
  })();

});
