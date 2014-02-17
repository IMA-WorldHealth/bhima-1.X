angular.module('kpk.controllers')
.controller('tree', [
  '$scope',
  '$q',
  '$location',
  'appcache',
  'connect',
  function($scope, $q, $location, AppCache, connect) {
    // TODO:
    //   Theoretically, the users and permissions depend on an
    //   enterprise, so do we need it or not?
  
    var moduleNamespace = 'tree', applicationNamespace = 'application';
    var cache = new AppCache(moduleNamespace), applicationCache = new AppCache(applicationNamespace);
    var originLocation, collapsed_model = [];

    $scope.treeData = [];

    function loadTreeOptions() {
      cache.fetchAll()
      .then(function(res) {
        collapsed_model = res;
        formatElementGroup($scope.treeData);
        selectTreeNode($scope.treeData, originLocation);
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
      if ($scope.navtree && angular.isObject($scope.navtree.currentNode)) {
        var path = $scope.navtree.currentNode.path;
        if (path) $location.path(path);
      }
    }, true);
 
    $scope.$on('$locationChangeStart', function(e, n_url) {
      var target = n_url.split('/#')[1];
     
      originLocation = target;
      if(target) {
        applicationCache.put('location', {path: target});
        selectTreeNode($scope.treeData, target);
      }
    });

    function selectTreeNode(list, locationPath) {
      list.some(function (element) {
        var sanitiseElement = element.path.replace(/\//g, '');
        var sanitiseLocation = locationPath.replace(/\//g, '');
   
        if(sanitiseElement === sanitiseLocation) {
          $scope.navtree.selectNodeLabel(element);
        }
        if(element.has_children) selectTreeNode(element.children, locationPath);
      });
    }

    (function init () {
      connect.fetch('/tree')
      .then(function(res) {
        $scope.treeData = res.data;
        loadTreeOptions();
      });
    })();
  }
]);
