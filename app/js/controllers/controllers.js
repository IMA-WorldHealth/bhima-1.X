// Controller.js


(function(angular) {
  'use strict';
  
  var controllers = angular.module('bika.controllers', []);
  
  controllers.controller('treeController', function($scope) { 
    $scope.treedata = 
    [
      { "label" : "Finance", "id" : "role1", "children" : [
          { "label" : "Budgeting", "id" : "first", "children" : [] },
          { "label" : "Accounts", "id" : "second", "children" : [] },
          { "label" : "Debtors", "id" : "third", "children" : [] }]
      }
    ];   
    
    $scope.$watch('navtree.currentNode', function(newObj, oldObj) {
        if( $scope.navtree && angular.isObject($scope.navtree.currentNode)) {
            console.log('Node Selected');
            console.log($scope.navtree.currentNode);
        }
    }, false);

  });
  
  controllers.controller('appController', function($scope) { 
    // TODO/FIXME
    console.log("Application controller fired");
  });

  controllers.controller('utilController', function($scope, bikaConnect, appService) { 
    console.log("Util controller fired");

    $scope.enterprise_model = {};
    $scope.fiscal_model = {};
    $scope.e_select = {};
    $scope.f_select = {};

    //redo with $q
    bikaConnect.fetch("enterprise", ["id", "name", "region"]).then(function(data) {
      $scope.enterprise_model = data;
      //Should select previously selected (see indexedb storage)
      $scope.e_select = $scope.enterprise_model[0];

      console.log("e-selected", $scope.e_selected); 

      appService.set($scope.e_select);

      bikaConnect.fetch("fiscal_year", ["id", "fiscal_year_txt"], "enterprise_id", $scope.e_select.id).then(function(data) { 
        $scope.fiscal_model = data;
        $scope.f_select = $scope.fiscal_model[0];
        console.log($scope.fiscal_model);
      });
    });

    $scope.$watch('e_selected.id', function(newObj, oldObj) { 
      console.log("Watch registered change", newObj);
      bikaConnect.fetch("fiscal_year", ["id", "fiscal_year_txt"], "enterprise_id", newObj).then(function(data) { 
        $scope.fiscal_model = data;
        $scope.f_select = $scope.fiscal_model[0];
      });
    });
  })
  
  controllers.controller('viewController', function($scope) { 
    // TODO
  });
  
  controllers.controller('fiscalController', function($scope, bikaConnect) { 
          
    $scope.selected = null;
    $scope.create = false;
    //TODO: This data can be fetched from the application level service
    $scope.current_fiscal = {
      id : 2013001
    };

    $scope.enterprise = {
      name : "IMA",
      city : "Kinshasa",
      country : "RDC",
      id : 101
    };
    
    //FIXME: This should by default select the fiscal year selected at the application level
    bikaConnect.fetch("fiscal_year", ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"], "enterprise_id", $scope.enterprise.id).then(function(data) { 
      $scope.fiscal_model = data;
      $scope.select($scope.fiscal_model[0].id);
    });

    $scope.select = function(fiscal_id) { 
      fetchPeriods(fiscal_id);
      $scope.selected = modelGet($scope.fiscal_model, fiscal_id);
    }

    $scope.isSelected = function() { 
      console.log("isSelected called, returned", !!($scope.selected));
      return !!($scope.selected);
    }

    $scope.createFiscal = function() { 
      $scope.selected = null;
    }

    $scope.getFiscalStart = function() { 
      if($scope.period_model) {
        return $scope.period_model[0].period_start;
      }
    }

    $scope.getFiscalEnd = function() {
      if($scope.period_model) { 
        var l = $scope.period_model;
        return l[l.length-1].period_stop;
      }
    }

    //FIXME: Date IN object should be formated, this function is called every time any part of the model is updated
    //This should be encapsulated in a 'model'
    function modelGet(model, id) { 
      //Keep an index of item ID's so a Get can directly index without searching (index maintained by model)
      var search = null;
      model.forEach(function(entry) { 
        if(entry.id==id){
          search=entry;
        }
      });
      return search;
    }
    
    function fetchPeriods(fiscal_id) { 
      bikaConnect.fetch("period", ["id", "period_start", "period_stop"], "fiscal_year_id", fiscal_id).then(function(data) { 
        $scope.period_model = data;
      });
    }
  });
  
  controllers.controller('budgetController', function($scope, bikaConnect) { 
    console.log("Budget loaded");
    $scope.account_model = {};

    //TODO: This data can be fetched from the application level service
    $scope.current_fiscal = {
      id : 2013001
    };

    $scope.enterprise = {
      name : "IMA",
      city : "Kinshasa",
      country : "RDC",
      id : 101
    };

    bikaConnect.fetch("account", ["id", "account_txt", "account_category"], "enterprise_id", $scope.enterprise.id).then(function(data) { 
      $scope.accont_model = data;
    })
  });
  
  controllers.controller('userController', function($scope, bikaConnect) { 
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
    };
    
    $scope.isSelected = function() { 
      return !!($scope.selected);
    };
    
    $scope.createUser = function() { 
      $scope.selected = {};
      $scope.model.push($scope.selected);
    };
    
    $scope.updateUser = function() {
      console.log($scope.selected);
      console.log($scope.selected.first, $scope.selected.last, $scope.selected.email);
    };
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
  
  
  // Chart of Accounts controllers
  
  controllers.controller('chartController', function($scope, bikaConnect, $q, $modal) {
  
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
    
    promise.then(function(tables) {
      $scope.accounts = tables[0];
      $scope.accounttypes = tables[1];
    });
    
    $scope.columns = [
      {label: "Account Number", map: "id"},
      {label: "Account Text", map: "account_txt"},
      {label: "Account Type", map: "account_type_id", cellTemplateUrl: "/partials/templates/cellselect.html"},
      {label: "Locked?", map: "locked"}
    ];
  
    $scope.openModal = function() {
      console.log('Called OpenModal');

      var instance = $modal.open({
        templateUrl: "/partials/templates/chart-modal.html",
        backdrop: true,
        controller: function($scope, $modalInstance, columns, selected){
          // NOTE: THIS IS A DIFFERENT SCOPE 
          $scope.formvalues = {};
          $scope.columns = columns;
          $scope.selected = selected;
          $scope.CANYOUSEEME = "HI";
      
          $scope.ok = function() {
            $modalInstance.close($scope.formvalues);
          };
      
          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        },

        resolve: {
          columns: function() {
            return $scope.columns;
          },
          selected: function() {
            return $scope.selected;
          }
        }
      });

      instance.result.then(function(values) {
        console.log('Values:', values);
      }, function() {
        console.log('Canceled at '+new Date());
      });

    };

  });

  controllers.controller('connectController', function($scope) { 
    console.log("Connect initialised");
  })

})(angular);
