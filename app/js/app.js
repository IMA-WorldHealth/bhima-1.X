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
	//TODO: Define API for getting data from the server - providing query data, simple table names, etc.
	this.send = function(table, data) { 
		var sql= {t:table, data:data};
		$http.post('/data/',sql);
	}

	this.get = function(requestObject){
		var promise = $http.get('/data/?' + JSON.stringify(requestObject)).then(function(result) { 
			return result.data;
		});
		return promise;
	}

	this.fetch = function(table, columns, where, value) { 

		var query = { 
			e: [{t : table, c : columns}]
		}

		if(where) { 
			query.c = [{t : table, cl : where, v : value, z : '='}];
		}

		

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
	    }
	}, false);
});

bika.controller('budgetController', function($scope) { 
});

bika.controller('userController', function($scope, bikaConnect) { 
	$scope.selected = null;
	$scope.chkTous = false;
	var request = {}; 
    request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
	bikaConnect.get(request).then(function(data) { 
		$scope.model = data;
	});

	bikaConnect.fetch("unit", ["id", "name"], 'parent', 0).then(function(data){
		$scope.roles = data;
	});

	bikaConnect.fetch("unit", ["id", "name", "desc", "parent"]).then(function(data) { 
		$scope.units = data;
		for(var i=0; i<$scope.units.length; i++){
			$scope.units[i].chkUnitModel = false;
		}
		
	});

	$scope.select = function(index) { 
		$scope.selected = $scope.model[index];
	}

	$scope.isSelected = function() { 
		return !!($scope.selected);
	}

	$scope.createUser = function() { 
		$scope.selected = {};		
	}

	$scope.changeAll = function(){
		($scope.chkTous)?checkAll(): unCheckAll();
	}

	$scope.getUnits = function(idRole){
		$scope.tabUnits = [];
		if($scope.units) { 
			for(var i = 0; i < $scope.units.length; i++){
				if($scope.units[i].parent == idRole){
					$scope.tabUnits.push($scope.units[i]);
				}
			}

			return $scope.tabUnits;
		}

		return [];
		
	}

	$scope.valider = function (){
		bikaConnect.send('user', [{id:'',
								   username: $scope.selected.username,
								   password: $scope.selected.password,
								   first: $scope.selected.first,
								   last: $scope.selected.last,
								   email: $scope.selected.email,
								   logged_in:0}]);

		var request = {}; 
        request.e = [{t : 'user', c : ['id']}];
        request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'=', l:'AND'}, {t:'user', cl:'password', v:$scope.selected.password, z:'='}];
        bikaConnect.get(request).then(function(data) { 
        	
		
		});


		var request = {}; 
        request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
		bikaConnect.get(request).then(function(data) { 
		$scope.model = data;
		});

	}
    function checkAll(){
    	for(var i=0; i<$scope.units.length; i++){
			$scope.units[i].chkUnitModel = true;
		}
    }

    function unCheckAll(){
    	for(var i=0; i<$scope.units.length; i++){
			$scope.units[i].chkUnitModel = false;
		}
    }

    function isAllChecked(){
    	var rep = true;
    	for(var i = 0; i< $scope.units.length; i++){
    		if(!$scope.units[i].chkUnitModel){
    			rep = false;
    			break;
    		}
    	}
    	return rep;
    }

    $scope.manageClickUnit = function(id){
    	var value = null;
    	for(var i=0; i<$scope.units.length; i++){
    		if($scope.units[i].id == id){
    			value = $scope.units[i].chkUnitModel;
    			break;
    		}
    	}
    	if(value === true){
    		//tester si tous sont checkes
    		if(isAllChecked()){
    			$scope.chkTous=true;
    		}else{
    			$scope.chkTous = false;
    		}

    	}else{
    		$scope.chkTous=false;

    	}


    }
});

bika.controller('debtorsController', function($scope, bikaConnect) { 
		
	$scope.selected = null;
	
	//Populate data - maybe there's a psuedo synchronous way of doing this?
	/*bikaConnect.fetch(
		"organisation", 
		["id", "name", "account_number", "address_1", "address_2", "location_id", "payment_id", "email", "phone", "locked", "note", "contact_id", "tax_id", "max_credit"], 
		'enterprise_id', 
		101
	).then(function(data) { 
		$scope.org_model = data;
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