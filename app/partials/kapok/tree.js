angular.module('kpk.controllers')
.controller('treeController', [
  '$scope',
  '$q',
  '$location',
  'appcache',
  'connect',
function($scope, $q, $location, AppCache, connect) {    
  // TODOs:
  //   Theoretically, the users and permissions depend on an
  //   enterprise, so do we need it or not?
  'use strict';
  
  var MODULE_NAMESPACE = 'tree'; 
  var cache = new AppCache(MODULE_NAMESPACE);
  var collapsed_model = [];

  $scope.treeData = [];

  function loadTreeOptions() { 
    cache.fetchAll().then(function(res) { 
      collapsed_model = res;
      formatElementGroup($scope.treeData);
    });
  }

  function formatElementGroup (group) {
    if (!group) return;
    return group.map(function (element) {
      collapsed_model.some(function(item, index) { 
        if(item.key === element.id_unit) { 
          element.collapsed = item.collapsed; 
          return true;
        } 
      });
      return element;
    });
  }
  
  $scope.$watch('navtree.currentNode', function( newObj, oldObj ) {
    console.log('TREEDATA:', $scope.treeData);
    if ($scope.navtree && angular.isObject($scope.navtree.currentNode)) {
      var path = $scope.navtree.currentNode.p_url;
      if (path) $location.path(path);
    }
  }, true);


  (function init () {
    connect.fetch('/tree')
    .then(function(res) { 
      $scope.treeData = res.data;
      loadTreeOptions();
    });
  })();
}]);
