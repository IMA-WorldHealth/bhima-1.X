angular.module('bhima.controllers')
.controller('tree', [
  '$scope',
  '$rootScope',
  '$location',
  '$translate',
  'appcache',
  'connect',
  function($scope, $rootScope, $location, $translate, AppCache, connect) {

    // TODO
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
      /* jshint unused : false */
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

    // when the translation changes, sort the data in
    // the tree nodes
    $rootScope.$on('$translateChangeSuccess', function () {
      sortTreeNodes($scope.treeData);
    });


    // alphabetically sort tree nodes
    function sortTreeNodes(data) {

      data.sort(function (a, b) {
        return $translate.instant(a.key) > $translate.instant(b.key) ? 1 : -1;
      });

      // for each node, recursively sort children 
      // if they exist
      data.forEach(function (node) {
        if (angular.isDefined(node.children)) {
          sortTreeNodes(node.children);
        }
      });
    }

    function init () {
      connect.fetch('/tree')
      .then(function (data) {

        // sort the tree nodes alphabetically
        sortTreeNodes(data);

        // expose to view
        $scope.treeData = data;
        loadTreeOptions();
      });
    }

    init();
  }
]);
