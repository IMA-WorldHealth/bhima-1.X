'use strict';


//FIXME: Format code correctly in seperate files/modules etc.
var bika = angular.module('bika', ['angularTreeview']);

function bikaconfig($routeProvider) { 
	$routeProvider.
	when('/budgeting', {
		controller: 'budgetController',
		templateUrl: 'partials/budgeting.html'
	}).
	when('/user', { 
		controller: 'userController',
		templateUrl: 'partials/userpermissions.html'
	}).
	when('/debtors', { 
		controller: 'debtorsController',
		templateUrl: 'partials/debtors.html'
	});
}
bika.config(bikaconfig);

var bikaConnect = function($http) { 
	console.log("bikaConnect initialised.");
	//TODO: Define API for getting data from the server - providing query data, simple table names, etc.
	this.send = function(table, columns, values) { 

	}

	this.fetch = function(table, columns, where, value) { 

		var query = { 
			e: [{t : table, c : columns}]
		}

		if(where) { 
			query.c = [{t : table, cl : where, v : value, z : '='}];
		}

		console.log("query", query);
		

		var promise = $http.get('/data/?' + JSON.stringify(query)).then(function(result) { 
			//I can now manipulate the data before returning it if needed
			return result.data;
		});
		return promise;
	}

	//Because TODO
	this.raw_fetch = function(qeury_object) { 
		var promise = $http.get('/data/?' + JSON.stringify(qeury_object)).then(function(result) { 
			return result.data;
		});
		return promise;
	}
}

bika.service('bikaConnect', ['$http', bikaConnect]);

bika.controller('appController', function($scope) { 

});

bika.controller('viewController', function($scope) { 

})

bika.controller('treeController', function($scope) { 
	$scope.treedata = 
	[
	    { "label" : "Finance", "id" : "role1", "children" : [
	        { "label" : "Budgeting", "id" : "role11", "children" : [] },
	   	    { "label" : "Accounts", "id" : "role2", "children" : [] },
	    	{ "label" : "Debtors", "id" : "role3", "children" : [] }]
	    }
	];   

	$scope.$watch( 'abc.currentNode', function( newObj, oldObj ) {
	    if( $scope.abc && angular.isObject($scope.abc.currentNode) ) {
	        console.log( 'Node Selected' );
	        console.log( $scope.abc.currentNode );
	    }
	}, false);
});

bika.controller('budgetController', function($scope) { 
	console.log("Budget loaded");
});

bika.controller('userController', function($scope, bikaConnect) { 
	console.log("userController", $scope);

	$scope.selected = null;

	bikaConnect.fetch("user", ["id", "username", "password", "first", "last", "email"]).then(function(data) { 
		$scope.model = data;
		console.log($scope.model);
	});

	bikaConnect.fetch("unit", ["id", "name", "desc"]).then(function(data) { 
		$scope.units = data;
	});

	$scope.select = function(index) { 
		console.log("Selected", index);
		$scope.selected = $scope.model[index];
	}

	$scope.isSelected = function() { 
		return !!($scope.selected);
	}

	$scope.createUser = function() { 
		$scope.selected = {};
		$scope.model.push($scope.selected);
	}

	$scope.updateUser = function() {
		console.log($scope.selected);
		console.log($scope.selected.first, $scope.selected.last, $scope.selected.email);
	}
});

bika.controller('debtorsController', function($scope, bikaConnect) { 
	console.log("Debtors initialised.");
		
	$scope.selected = null;
	
	//Populate data - maybe there's a psuedo synchronous way of doing this?
	/*bikaConnect.fetch(
		"organisation", 
		["id", "name", "account_number", "address_1", "address_2", "location_id", "payment_id", "email", "phone", "locked", "note", "contact_id", "tax_id", "max_credit"], 
		'enterprise_id', 
		101
	).then(function(data) { 
		$scope.org_model = data;
		console.log(data);
		$scope.select(0);
	});*/

	bikaConnect.raw_fetch({
	    e: [
	      {t: 'organisation', c: ['id', 'name', 'account_number', 'address_1', 'address_2', 'location_id', 'payment_id', 'email', 'phone', 'locked', 'note', 'contact_id', 'tax_id', 'max_credit']},
	      {t: 'location', c: ['city', 'region'] },
	      {t: 'payment', c: ['text']}
	    ],
	    jc: [
	      {ts: ['organisation', 'location'], c: ['location_id', 'id'], l: 'AND'},
	      {ts: ['organisation', 'payment'], c: ['payment_id', 'id'], l: 'AND'}
	    ],
	    c: [
	      {t: 'organisation', cl: 'enterprise_id', z: '=', v: 101}
	    ]
  	}).then(function(data) { 
  		$scope.org_model = data;
  		$scope.select(0);
	});

	$scope.select = function(index) { 
		console.log(index, "selected");
		console.log($scope.org_model[index]);
		$scope.selected = $scope.org_model[index];
    $scope.selectedIndex = index;
	}

	$scope.isSelected = function() { 
		if($scope.selected) { 
			return true;
		} else { 	
			return false;
		}
	}

});