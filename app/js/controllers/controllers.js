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

  controllers.controller('utilController', function($scope, bikaConnect, appstate) { 
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

      //appService.set($scope.e_select);

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
  });
  
  controllers.controller('viewController', function($scope) { 
    // TODO
  });
  
  controllers.controller('fiscalController', function($scope, connect, bikaConnect) { 

    $scope.active = "select";
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

    $scope.fiscal_model = {};
    $scope.fiscal_data = {};
    
    //FIXME: This should by default select the fiscal year selected at the application level
    connect.req("fiscal_year", ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"], "enterprise_id", $scope.enterprise.id).then(function(model) { 
      $scope.fiscal_model = model;
      $scope.fiscal_data = $scope.fiscal_model.data;
      $scope.select($scope.current_fiscal.id);
    });

    $scope.select = function(fiscal_id) { 
      fetchPeriods(fiscal_id);
      $scope.selected = $scope.fiscal_model.get(fiscal_id);
      $scope.active = "update";
    };

    $scope.isSelected = function() { 
      console.log("isSelected called, returned", !!($scope.selected));
      return !!($scope.selected);
    };

    $scope.createFiscal = function() { 
      //Do some session checking to see if any values need to be saved/ flushed to server
      $scope.active = "create";
      $scope.selected = null;
    };

    $scope.getFiscalStart = function() { 
      if($scope.period_model) {
        return $scope.period_model[0].period_start;
      }
    };

    $scope.getFiscalEnd = function() {
      if($scope.period_model) { 
        var l = $scope.period_model;
        return l[l.length-1].period_stop;
      }
    };

    //FIXME: Date IN object should be formated, this function is called every time any part of the model is updated
    //This should be encapsulated in a 'model'
    /*
    function modelGet(model, id) { 
      //Keep an index of item ID's so a Get can directly index without searching (index maintained by model)
      var search = null;
      model.forEach(function(entry) { 
        if(entry.id==id){
          search=entry;
        }
      });
      return search;
    }*/
    
    function fetchPeriods(fiscal_id) { 
      bikaConnect.fetch("period", ["id", "period_start", "period_stop"], "fiscal_year_id", fiscal_id).then(function(data) { 
        $scope.period_model = data;
      });
    }
  });
  
  controllers.controller('budgetController', function($scope, connect) { 
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

    connect.req("account", ["id", "account_txt", "account_category"], "enterprise_id", $scope.enterprise.id).then(function(model) { 
      $scope.account_model = model;
      $scope.a_select = [$scope.account_model.data[0]];
    });

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
    };
    
    $scope.isSelected = function() { 
      if($scope.selected) { 
        return true;
      } else {
        return false;
      }
    };
  
  });
  
  
  // Chart of Accounts controllers
  controllers.controller('chartController', function($scope, $q, $modal, bikaConnect) {
  
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

    $scope.showDialog = function() {
      var instance = $modal.open({
        templateUrl: "/partials/templates/chart-modal.html",
        backdrop: true,
        controller: function($scope, $modalInstance, columns) {
          // NOTE: THIS IS A DIFFERENT SCOPE 
          var values = angular.copy(columns);
          $scope.values = values;
          // dismiss
          $scope.close = function() {
            $modalInstance.dismiss();
          };
          // submit
          $scope.submit = function() {
            // TODO: include validation
            $modalInstance.close($scope.values);
          };
        },
        resolve: {
          columns: function() {
            return $scope.columns;
          },
        }
      });

      instance.result.then(function(values) {
        // add to the grid
        $scope.accounts.push(values);
      }, function() {
        console.log("Form closed on:", new Date());
      });
    };

    // TODO: Much of this code is in preparation for multi-select feature,
    // however it works fine with 'single' selection.  To impliment multiselect
    // functionality, must have a way of registering objects dynamically into a
    // collection, and add/delete based on their hash.  See TODO.md.

    // Used for showing next lock state of toggleLock()
    $scope.lockLabel = "Lock";

    function getLockLabel(rows) {
      // if multiple selected items default to
      // "Lock"
      if (rows.length > 1) {
        return "Lock";
      }
      // Return 'Lock' if not locked; else, 'Unlock'
      return (rows[0].locked === 0) ? "Lock"  : "Unlock";
    }

    $scope.selectedRows = [];

    // FIXME: make this work with multiselect
    $scope.$on('selectionChange', function(event, args) {
      if ($scope.config.selectionMode == "multiple" && args.item.isSelected == "true") {
        $scope.selectedRows.push(args.item);
      } else {
        // selected is an array
        $scope.selectedRows = [args.item];
      }
      // re-calculate the lock label.
      $scope.lockLabel = getLockLabel($scope.selectedRows);
      console.log('$scope.selectedRows', $scope.selectedRows);
    });

    // toggles the lock on the current row
    $scope.toggleLock = function() {
      if ($scope.lockLabel == "Lock") {
        $scope.selectedRows.forEach(function(row) {
          row.locked = 1;
        });
      } else {
        $scope.selectedRows.forEach(function(row) {
          row.locked = 0;
        });
      }
      // Switch label
      $scope.lockLabel = ($scope.lockLabel == "Lock") ? "Unlock" : "Lock";
    };

    $scope.config = {
      isPaginationEnabled: true,
      itemsByPage: 16,
      selectionMode: 'single'
    };
  });

  controllers.controller('connectController', function($scope, connect) { 
    console.log("ConnectController initialised.");
    connect.req("fiscal_year", ["id", "fiscal_year_txt"]).then(function(model) { 
      console.log("Returned model", model);
      console.log(model.get(2013001));
      model.delete(2013001);
    });
  });

  controllers.controller('socketController', function($scope, data) {

    console.log('[controllers.js] SocketController initialized.');

    var options = {identifier: 'id', table: 'account', columns: ['id', 'account_txt'], autosync: true};
    var store = data.register(options);
    store.ready().then(function() {
      $scope.model = store.data;

    });

  });

})(angular);
