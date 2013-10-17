// Controller.js


(function(angular) {
  'use strict';
  
  var controllers = angular.module('bika.controllers', []);
  
  controllers.controller('treeController', function($scope, $q, bikaConnect, $location) {    
    var deferred = $q.defer();
    var result = getRoles();
    $scope.treeData = [];
    var cb = function(role, units){
      var element = {};
      element.label = role.name;
      element.id = role.id;
      element.children = [];
      for(var i = 0; i<units.length; i++){
        element.children.push({"label":units[i].name, "id":units[i].id, "url":units[i].url, "children":[]});
      }
      $scope.treeData.push(element);

    }
    result.then(function(values){
      for(var i = 0; i<values.length; i++){
        getChildren(values[i], cb);
      }
    });
 
    
    $scope.$watch( 'navtree.currentNode', function( newObj, oldObj ) {
        if( $scope.navtree && angular.isObject($scope.navtree.currentNode) ) {
            $location.path($scope.navtree.currentNode.url);
        }
    }, false);

    function getRoles(){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name']}];
      request.c = [{t:'unit', cl:'parent', v:0, z:'='}];
      bikaConnect.get('/tree?',request).then(function(data) { 
        deferred.resolve(data);
      });
      return deferred.promise;
    };

    function getChildren(role, callback){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name', 'url']}];
      request.c = [{t:'unit', cl:'parent', v:role.id, z:'='}];
      bikaConnect.get('/tree?',request).then(function(data) {
          callback(role, data); 
        
      });

    };

  });
controllers.controller('userController', function($scope, $q, bikaConnect) {
  //initilaisation var
  
  $scope.selected = null;
  $scope.chkTous = false;

  //population model de table
  var request = {}; 
  request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
  bikaConnect.get('/data/?',request).then(function(data) { 
    $scope.model = data;
  });

  //population model de role
  bikaConnect.fetch("unit", ["id", "name"], 'parent', 0).then(function(data){
    $scope.roles = data;
  });

  //population model d'unite
  bikaConnect.fetch("unit", ["id", "name", "desc", "parent"]).then(function(data) { 
    $scope.units = data;
    for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = false;
    }    
  });

  //**************** les fonctions *****************
  $scope.cancel = function(){
    $scope.selected = {};
    unCheckAll();
  };

  $scope.select = function(index) {
    unCheckAll();
    $scope.selected = $scope.model[index];
    var result = getUserUnits($scope.selected.id);    
    result.then(function(vals){
      console.log(vals);
      for(var i=0; i<vals.length; i++){
        for(var j = 0; j<$scope.units.length; j++){
          if($scope.units[j].id == vals[i].id_unit){
            $scope.units[j].chkUnitModel = true;
          }
        }
      }

    });

  }
  function getUserUnits(idUser){
    var def = $q.defer();
    var request = {}; 
    request.e = [{t : 'permission', c : ['id_unit']}];
    request.c = [{t:'permission', cl:'id_user', v:idUser, z:'='}];
    bikaConnect.get('/data/?', request).then(function (data){      
      def.resolve(data);
    });
    return def.promise;
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
        bikaConnect.get('data/?',request).then(function(data) { 
          for(var i = 0; i<$scope.units.length; i++){
            if($scope.units[i].chkUnitModel === true){
              bikaConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:data[0].id}]);
            }
          }         
    
    });


    var request = {}; 
    request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
    bikaConnect.get('data/?',request).then(function(data) { 
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

    $scope.updateUser = function(){

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
  
  controllers.controller('appController', function($scope) { 
  });
  
  controllers.controller('viewController', function($scope) { 
  });
  
  controllers.controller('fiscalController', function($scope, bikaConnect) { 
    
    //TODO: This data can be fetched from the application level service
    $scope.fiscal = {
      id : 2013001
    };

    $scope.enterprise = {
      name : "IMA",
      city : "Kinshasa",
      country : "RDC",
      id : 101
    };
    
    bikaConnect.fetch("fiscal_year", ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"], "enterprise_id", $scope.enterprise.id).then(function(data) { 
      $scope.fiscal_model = data;
      //$scope.select($scope.fiscal.id);
    });
    
    fetchPeriods($scope.fiscal.id);
    
    function fetchPeriods(fiscal_id) { 
      bikaConnect.fetch("period", ["id", "period_start", "period_stop"], "fiscal_year_id", $scope.fiscal.id).then(function(data) { 
        $scope.period_model = data;
      });
    }
  
  
  });
  
  controllers.controller('budgetController', function($scope) { 
  });
  
  
  
  controllers.controller('debtorsController', function($scope, bikaConnect) { 
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
  
  
  // Chart of Accounts controllers
  
  controllers.controller('chartController', function($scope, bikaConnect, $q) {
  
    // loads data and returns a promise evaluated when both requests are complete.
  	function loadData() {
  		return $q.all([
  			bikaConnect.raw_fetch({
    			e: [{t:'account', c: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_type_id']}],
    			c: [{t: 'account', cl: 'enterprise_id', z: '=', v: 101}]
    		}),
    		bikaConnect.raw_fetch({
    			e: [{t: 'account_type', c:['id', 'type']}]
    		})
    	]);
  	}
  
  	var promise = loadData();
  	promise.then(function(tables){
  		$scope.accountTable = tables[0];
  		$scope.accountTypeTable = tables[1];
  	});
  
    $scope.columnCollection = [
      {label: "Account Number", map: "id"},
      {label: "Account Text", map: "account_txt"},
      {label: "Account Type", map: "account_type_id"},
      {label: "Locked?", map: "locked"}
    ];
  
    //$scope.log = function(value) { console.log("row.rowIndex:", value); };
    
    $scope.gridOptions = {
        data: 'accountTable',
        columnDefs: [
          {field:'id', displayName: 'Account Number'},
          {field:'account_txt', displayName: 'Text'},
          {field: 'account_type_id', displayName: 'AccountTypeId', cellTemplate: '<select class="form-control" ng-options="row.type for row in accountTypeTable" ng-model="accountTypeTable[row.getProperty(col.field)]"></select>'},
          {field: 'locked', displayName: "Locked?"}
        ]
    };
  
  });
})(angular);
