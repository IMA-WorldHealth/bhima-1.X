// Controller.js


(function(angular) {
  'use strict'; 
  var controllers = angular.module('bika.controllers', []);

//************************************************************************************
//******************************* TREE CONTROLLER ************************************
//************************************************************************************  
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

//************************************************************************************
//******************************* USER CONTROLLER ************************************
//************************************************************************************
controllers.controller('userController', function($scope, $q, bikaConnect) {
  //initilaisation var
  
  $scope.selected = {};
  $scope.chkTous = false;
  $scope.showbadpassword=false;
  $scope.showbademail = false;
  $scope.showbadusername = false;

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
    if($scope.selected.email){
      var email = $scope.selected.email;
      var indexAt = email.indexOf('@',0);
      var indexDot = email.lastIndexOf('.',email.length);
      //verification email
      if(indexAt!=-1 && indexDot!=-1 && indexAt<indexDot) {
        $scope.showbademail = false; 
      }else{
        $scope.showbademail = true;
      }
    }else{
      $scope.showbademail = true;
    }
     if($scope.selected.password){
        //verification mot de passe    
        if ($scope.selected.password!= $scope.confirmpw){
          $scope.showbadpassword = true;
        }else{
          $scope.showbadpassword = false;
        }
      }else{
        $scope.showbadpassword = true;
      }

    if($scope.showbademail !== true && $scope.showbadpassword!==true){
      ($scope.selected.id)?updateUser():creer();
    }
  }

  function creer (){
    var result = existe();
    result.then(function(resp){
      if(resp !== true){
        $scope.showbadusername = false;
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
            if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !=0 && $scope.units[i].id != 0){
              bikaConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:data[0].id}]);
            }
          }         
    
    });
    refreshUserModel();
      }else{
        $scope.showbadusername = true;
      }

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

    function refreshUserModel(){
    var request = {}; 
    request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
    bikaConnect.get('data/?',request).then(function(data) { 
    $scope.model = data;
    $scope.selected={};
    $scope.confirmpw = "";
    $scope.showbadpassword = false;
    $scope.showbademail = false;
    });
    }

    function updateUser(){
      $scope.showbadusername = false;
      bikaConnect.get('data/?', {t:'permission', ids:{id_user:[$scope.selected.id]}, action:'DEL'});
      var sql_update = {t:'user', 
                        data:[{id:$scope.selected.id,
                               username: $scope.selected.username,
                               password: $scope.selected.password,
                               first: $scope.selected.first,
                               last: $scope.selected.last,
                               email:$scope.selected.email}
                             ], 
                        pk:["id"]
                       };
      bikaConnect.update(sql_update);
      for(var i = 0; i<$scope.units.length; i++){
          if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !=0 && $scope.units[i].id != 0){
            bikaConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:$scope.selected.id}]);
          }
          } 

      

      refreshUserModel();

    }

    function existe(){
      var def = $q.defer();
      var request = {}; 
      request.e = [{t : 'user', c : ['id']}];
      request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'='}];
      bikaConnect.get('data/?',request).then(function(data) {
       (data.length > 0)?def.resolve(true):def.resolve(false);    
    });
      return def.promise;
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

//************************************************************************************
//************************* TRANSACTION CONTROLLER ***********************************
//************************************************************************************
controllers.controller('transactionController', function($scope, bikaConnect, bikaUtilitaire, appstate) { 
  $scope.account_model = {};
  $scope.a_select = {};
  $scope.periods = {};
  $scope.df_select = {};
  //remplissage select
  var enterpriseID = 101;
  var fiscalID = 2013001;
  var periodID = 1;
    function fillAccount(enterprise_id){
      var req_db = {};
      req_db.e = [{t:'account', c:['id', 'account_txt']}];
      req_db.c = [{t:'account', cl:'enterprise_id', z:'=', v:enterprise_id}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        $scope.account_model = data;
      });
    }

    function fillDateFrom(fiscal_id){
      var req_db = {};
      req_db.e = [{t:'period', c:['period_start']}];
      req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        for(var i = 0; i<data.length; i++){
          data[i]['period_start'] = bikaUtilitaire.formatDate(data[i].period_start);
        }
        $scope.periodFroms = data;
      });
    }

    function fillDateTo(fiscal_id){
      var req_db = {};
      req_db.e = [{t:'period', c:['period_stop']}];
      req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        for(var i = 0; i<data.length; i++){
          data[i]['period_stop'] = bikaUtilitaire.formatDate(data[i].period_stop);
        }
        $scope.periodTos = data;
      });
    }
  if(enterpriseID && fiscalID && periodID){
    fillAccount(enterpriseID);
    fillDateFrom(fiscalID);
    fillDateTo(fiscalID);
  }
    
  
});

//***********************************************************************************
//********************** UTIL CONTROLLER ********************************************
//***********************************************************************************
 
controllers.controller('utilController', function($scope, $q, bikaConnect, appstate, bikaUtilitaire) { 
    $scope.enterprise_model = {};
    $scope.fiscal_model = {};
    $scope.e_select = {};
    $scope.f_select = {};
    $scope.period_model = {};
    $scope.p_select = {};

    var resp = fillEntrepriseSelect();
    resp.then(function(enterprise_id){
      if(enterprise_id){
        var resp2 = fillFiscalSelect(enterprise_id);
        resp2.then(function(fiscal_id){
          fillPeriod(fiscal_id);
        });
      }
    });
    /*$scope.$watch('e_select', function(newObj, oldObj) { 
      console.log("Watch registered change", $scope.e_select);    
    });*/    
    $scope.select = function(id) {
      console.log(id);
    }
    //remplissage selects
    function fillEntrepriseSelect(){
      var deferred = $q.defer();
      var req_db = {};
      req_db.e = [{t:'enterprise', c:['id', 'name', 'region']}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        $scope.enterprise_model = data;
        appstate.set("enterprise", $scope.e_select);
        deferred.resolve(data[0].id);
      });
      return deferred.promise;
    }
    function fillFiscalSelect(enterprise_id){
      var deferred = $q.defer();
      var req_db = {};
      req_db.e = [{t:'fiscal_year', c:['id', 'fiscal_year_txt']}];
      req_db.c = [{t:'fiscal_year', cl:'enterprise_id', z:'=', v:enterprise_id}];
      bikaConnect.get('/data/?',req_db).then(function(data){
        $scope.fiscal_model = data;
        deferred.resolve(data[0].id);
      });
      return deferred.promise;
    }

    function fillPeriod(fiscal_id){
      var req_db = {};
      req_db.e = [{t:'period', c:['id', 'period_start', 'period_stop']}];
      req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
      bikaConnect.get('/data/?',req_db).then(function(data){
        for(var i = 0; i<data.length; i++){
          data[i]['period_start'] = bikaUtilitaire.formatDate(data[i].period_start);
          data[i]['period_stop'] = bikaUtilitaire.formatDate(data[i].period_stop);
        }
        $scope.period_model = data;
      });
    }
    //fin remplissage selects
});




















controllers.controller('appController', function($scope) { 
  console.log("transaction controllers init");
});


controllers.controller('appController', function($scope) { 
    // TODO/FIXME
    console.log("Application controller fired");
});


  
controllers.controller('viewController', function($scope) { 
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

    $scope.current_fiscal_model = new Array(12);

    connect.req("account", ["id", "account_txt", "account_category"], "enterprise_id", $scope.enterprise.id).then(function(model) { 
      $scope.account_model = model;
      $scope.a_select = [$scope.account_model.data[0]];
    });
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

  controllers.controller('connectController', function($scope, connect, appstate) { 
    appstate.get("enterprise").then(function(data) { 
      console.log("Connect received", data);
      console.log("Connect received", data);
      console.log("Connect received", data);
      console.log("Connect received", data);
    });
    console.log("ConnectController initialised.");
    connect.req("fiscal_year", ["id", "fiscal_year_txt"]).then(function(model) { 
      console.log("Returned model", model);
      console.log(model.get(2013001));
      model.delete(2013001);
    });
  });


})(angular);
