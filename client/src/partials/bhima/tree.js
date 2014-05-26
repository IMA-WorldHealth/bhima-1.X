angular.module('bhima.controllers')
.controller('tree', [
  '$scope',
  '$location',
  'appcache',
  'connect',
  function($scope, $location, AppCache, connect) {

    // TODO:
    //   Theoretically, the users and permissions depend on an
    //   enterprise, so do we need it or not?
    var moduleNamespace = 'tree', applicationNamespace = 'application';
    var cache = new AppCache(moduleNamespace);
    var applicationCache = new AppCache(applicationNamespace);
    var originLocation, collapsedModel = [];

    $scope.treeData = [];

    loadTreeOptions();

    function loadTreeOptions() {
      cache.fetchAll()
      .then(function(res) {
        collapsedModel = res;
        formatElementGroup($scope.treeData);
        selectTreeNode($scope.treeData, originLocation);
      });
    }

    function formatElementGroup(group) {
      if (!group) {
        return;
      }

      return group.map(function (element) {
        collapsedModel.some(function (item) {
          if (item.key === element.unit_id) {
            element.collapsed = item.collapsed;
            return true;
          }
        });
        return element;
      });
    }

    $scope.$watch('navtree.currentNode', function () {
      if ($scope.navtree && angular.isObject($scope.navtree.currentNode)) {
        var path = $scope.navtree.currentNode.path;
        if (path) { $location.path(path); }
      }
    }, true);

    $scope.$on('$locationChangeStart', function (e, n_url) {
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
        var sanitiseLocation = locationPath ? locationPath.replace(/\//g, '') : '';

        if (sanitiseElement === sanitiseLocation) {
          $scope.navtree.selectNodeLabel(element);
        }
        if (element.has_children) { selectTreeNode(element.children, locationPath); }
      });
    }

    (function init () {
      connect.fetch('/tree')
      .then(function (data) {
        $scope.treeData = data; // FIX: new connect.fetch() api
        // $scope.treeData = res.data;
        loadTreeOptions();
      });
    })();
  }
]);
