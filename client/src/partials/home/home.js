angular.module('bhima.controllers')
.controller('home', [
  '$scope',
  '$translate',
  'appstate',
  'validate',
  'exchange',
  function ($scope, $translate, appstate, validate, exchange) {
  	var session = $scope.session = {},
  			dependencies = {};

  	dependencies.register = {
      query : 'user_session'
    };

  	dependencies.user = {
      query : {
      	tables : {
      		user : { columns : ['first', 'last'] }
      	}
      }
    };

    dependencies.units = {
      query : {
      	tables : {
      		'unit' : { columns : ['id', 'name', 'key', 'parent', 'url', 'path'] },
      		'permission' : { columns : ['id::permission_id'] }
      	},
      	join : ['unit.id=permission.unit_id']
      }
    };

    function init (model) {
    	angular.extend($scope, model);
    	session.date = new Date();
    	session.exchangeRate = exchange.hasDailyRate() ? '1 $ = ' + exchange.rate(100, 1, session.date) + ' Fc' : $translate.instant('HOME.UNDEFINED');

    	handleTreeNavigation();
    	handleTreeUrl();
    	handleSortAlphabetically();
    	handleUserInfo();
    }

    function handleTreeNavigation () {
    	if ($scope.units.data.length) {
    		session.parentNode = $scope.units.data.filter(function (unit) {
    			return unit.parent === 0;
    		});

    		session.treeNavigation = [];

    		session.parentNode.forEach(function (node, indexNode) {
    			session.treeNavigation.push({ parent : node, children : [] });
    			var tempChildren = [];
    			$scope.units.data.forEach(function (unit) {
    				if (unit.parent === node.id) {
    					tempChildren.push(unit);
    				}
	    		});
    			session.treeNavigation[indexNode].children = tempChildren;
    		});
    	}
    }

    function handleTreeUrl () {
    	session.treeNavigation.forEach(function (node) {
    		node.children.forEach(function (unit) {
    			unit.path = unit.path[unit.path.length -1] != '/' ? unit.path + '/' : unit.path;
    		});
    	});
    }

    function handleUserInfo () {
    	session.user = $scope.user.data[0];
    }

    function handleSortAlphabetically () {
    	session.treeNavigation.sort(parentComparison);

    	session.treeNavigation.forEach(function (node) {
    		node.children.sort(childrenComparison);
    	});

			function parentComparison (a, b) {
				return ( t(a.parent.key) < t(b.parent.key) ) ? -1 : ( t(a.parent.key) > t(b.parent.key) ) ? 1 : 0 ;
			}

			function childrenComparison (a, b) {
				return ( t(a.key) < t(b.key) ) ? -1 : ( t(a.key) > t(b.key) ) ? 1 : 0 ;
			}

			function t(text) {
				var v = $translate.instant(text).toLowerCase();
				return v;
			}
    }

    function treePermission (model) {
    	angular.extend($scope, model);
    	dependencies.units.where = ['permission.user_id=' + $scope.register.data.id];
    	dependencies.user.where = ['user.id=' + $scope.register.data.id];       
	    validate.process(dependencies)
	    .then(init);
    }

    appstate.register('project', function (project) {
      $scope.project = project;   
      validate.process(dependencies)
      .then(treePermission);   
    });

  }
]);