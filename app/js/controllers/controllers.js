 // Controller.js
(function(angular) {
  'use strict'; 
  var controllers = angular.module('bika.controllers', []);

//************************************************************************************
//******************************* TREE CONTROLLER ************************************
//************************************************************************************  
controllers.controller('treeController', function($scope, $q, $location, appcache, bikaConnect) {    
    var deferred = $q.defer();
    var result = getRoles();
    $scope.treeData = [];
    var cb = function(role, units){
      var element = {};
      element.label = role.name;
      element.id = role.id;
      element.children = [];
      for(var i = 0; i<units.length; i++){
        element.children.push({"label":units[i].name, "id":units[i].id, "p_url":units[i].p_url, "children":[]});
      }
      $scope.treeData.push(element);

    };

    result.then(function(values){
      for(var i = 0; i<values.length; i++){
        getChildren(values[i], cb);
      }
    });
 
    
    $scope.$watch('navtree.currentNode', function( newObj, oldObj ) {
        if( $scope.navtree && angular.isObject($scope.navtree.currentNode) ) {
            $location.path($scope.navtree.currentNode.p_url);
        }
    }, true);

    function getRoles(){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name']}];
      request.c = [{t:'unit', cl:'parent', v:0, z:'='}];
      bikaConnect.get('/tree?',request).then(function(data) { 
        deferred.resolve(data);
      });
      return deferred.promise;
    }

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
  bikaConnect.fetch("unit", ["id", "name", "description", "parent"]).then(function(data) { 
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
  };

  $scope.changeAll = function(){
    ($scope.chkTous)?checkAll(): unCheckAll();
  };

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
  };

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
  };

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
            if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
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
          if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
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

//***********************************TRANSACTION**************************************
//************************* TRANSACTION CONTROLLER ***********************************
//************************************************************************************
controllers.controller('transactionController', function($scope, $rootScope, $location, bikaConnect, bikaUtilitaire, appstate) { 
    //les variables
    $scope.account_model = {};
    $scope.a_select = {};
    $scope.periods = {};
    $scope.df_select =  {};
    $scope.dt_select = {};
    var dependacies ={};

      //les fonctions

    $scope.redirect = function(){
      $location.path("/p");

    }

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

    function fillTable(period_id){
      var req_db = {};
      req_db.e = [{t : 'transaction', c : ['description', 'date', 'rate']},
                  {t:'infotransaction', c:['id', 'account_id', 'transaction_id', 'debit', 'credit']},
                  {t:'currency', c:['symbol']},
                  {t:'account', c:['account_type_id']}
                 ];

      req_db.jc = [{ts:['transaction', 'infotransaction'], c:['id', 'transaction_id'], l:'AND'},
                   {ts: ['account', 'infotransaction'], c:['id', 'account_id'], l:'AND'},
                   {ts: ['currency', 'transaction'], c:['id', 'currency_id'], l:'AND'}
                  ];
      req_db.c = [{t : 'transaction', cl : 'period_id', v : period_id, z : '='}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        for(var i = 0; i<data.length; i++){
        data[i].date = bikaUtilitaire.formatDate(data[i].date);
        }
        $scope.infostran = data;
      });
    }

      function refreshTable(dep){
        if(dep.accountID && dep.df && dep.dt) {
          var e = [{t : 'transaction', c : ['description', 'date', 'rate']},
                   {t:'infotransaction', c:['id', 'account_id', 'transaction_id', 'debit', 'credit']},
                   {t:'currency', c:['symbol']},
                   {t:'account', c:['account_type_id']}
                  ],
          jc = [{ts:['transaction', 'infotransaction'], c:['id', 'transaction_id'], l:'AND'},
                {ts: ['account', 'infotransaction'], c:['id', 'account_id'], l:'AND'},
                {ts: ['currency', 'transaction'], c:['id', 'currency_id'], l:'AND'}
               ],
          c = [{t : 'infotransaction', cl: 'account_id', v : dep.accountID, z : '=', l : 'AND'},
               {t : 'transaction', cl : 'date', v : bikaUtilitaire.convertToMysqlDate(dep.df), z : '>=', l : 'AND'},
               {t : 'transaction', cl : 'date', v : bikaUtilitaire.convertToMysqlDate(dep.dt), z : '<='}
              ];
          var req_db={};
          req_db.e=e;
          req_db.jc = jc;
          req_db.c = c;
          bikaConnect.get('/data/?', req_db).then(function(data){
            for(var i = 0; i<data.length; i++){
              data[i].date = bikaUtilitaire.formatDate(data[i].date);
            }
            $scope.infostran = data;
          });
        }
      }

      appstate.register('period', function(res) { 
        if(res)
        fillTable(res.id);
      });

      appstate.register('enterprise', function(res) { 
        fillAccount(res.id);
      });

      appstate.register('fiscal', function(res) { 
        fillDateFrom(res.id);
        fillDateTo(res.id);
      });
      $scope.$watch('a_select', function(nval, oval){
        if(Object.keys(nval).length){
          dependacies.accountID = nval.id;
          refreshTable(dependacies);
        }
      });

      $scope.$watch('df_select', function(nval, oval){
        if(Object.keys(nval).length){
        dependacies.df = nval.period_start;
        refreshTable(dependacies);
        }
      });

      $scope.$watch('dt_select', function(nval, oval){
        if(Object.keys(nval).length){
          dependacies.dt = nval.period_stop;
          refreshTable(dependacies);
        }      
      });
});

//***********************************************************************************
//********************** UTIL CONTROLLER ********************************************
//***********************************************************************************
 
controllers.controller('utilController', function($rootScope, $scope, $q, bikaConnect, appstate, bikaUtilitaire) { 
  /////
  // summary: 
  //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
  //  
  // TODO 
  //  -All operations on models should be local, and then exposed to scope
  //  -Should use connect instead of bikaConnect (soon to be deleted)
  /////
  $scope.enterprise_model = {};
  $scope.fiscal_model = {};
  $scope.period_model = {};
  $scope.p_select = {};

  var resp = fillEntrepriseSelect();

  //FIXME Errors are thrown if no fiscal years are assigned to an enterprise, this should be handled
  //TODO period is used very rarely, probably doesn't need a selection on the application
  resp
  .then(function(enterprise_id) { 
    return fillFiscalSelect(enterprise_id);
  })
  .then(function(fiscal_id) { 
    fillPeriod(fiscal_id);
  });

  //remplissage selects

  function fillPeriod(fiscal_id){
    var req_db = {};
    req_db.e = [{t:'period', c:['id', 'period_start', 'period_stop']}];
    req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
    bikaConnect.get('/data/?',req_db).then(function(data){
      for(var i = 0; i<data.length; i++){
        data[i].period_start = bikaUtilitaire.formatDate(data[i].period_start);
        data[i].period_stop = bikaUtilitaire.formatDate(data[i].period_stop);
      }
      $scope.period_model = data;
      $scope.p_select = $scope.period_model[0];
    });
  }
    //debut functions
  $scope.select = function(id) {
  };
  function fillEntrepriseSelect(){
    var deferred = $q.defer();
    var req_db = {};
    req_db.e = [{t:'enterprise', c:['id', 'name', 'region']}];
    bikaConnect.get('/data/?', req_db).then(function(data){
      $scope.enterprise_model = data;
      $scope.e_select = $scope.enterprise_model[1]; //Select default enterprise (should be taken from appcache if multiple enterprises are used)
      deferred.resolve($scope.e_select.id);
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
      $scope.f_select = $scope.fiscal_model[0];
      deferred.resolve($scope.f_select.id);
    });
    return deferred.promise;
  }
    //fin remplissage selects
    
  $scope.$watch('e_select', function(nval, oval) { 
    if(nval){
      appstate.update('enterprise', nval);
      fillFiscalSelect(nval.id);
    }
  });

  $scope.$watch('f_select', function(nval, oval) { 
    if(nval){
      appstate.update('fiscal', nval);
      fillPeriod(nval.id);
    }
  });

  $scope.$watch('p_select', function(nval, oval) { 
    appstate.update('period', nval);
  });
});


controllers.controller('appController', function($scope) { 
    // TODO/FIXME
});

//*************************************************************************
//********************* ADD CONTROLLER ************************************
//*************************************************************************

controllers.controller('addController', function($scope, $modal, bikaConnect, appstate) {

  $scope.selectedAccounts = {};  
  $scope.rep = false;
  fillCurrencies();
  appstate.register('enterprise', function(res){
    fillAccounts(res.id);
  });

  function fillCurrencies(){
      var req_db = {};
      req_db.e = [{t:'currency', c:['id', 'name', 'symbol']}];
      bikaConnect.get('/data/?', req_db).then(function(data){
        $scope.currencies = data;
      });
  }

  function fillAccounts(idEnterprise){
    var req_db = {};
    req_db.e = [{t:'account', c:['account_txt', 'id']}];
    req_db.c = [{t:'account', cl:'enterprise_id', z:'=', v:idEnterprise}];
    bikaConnect.get('/data/?', req_db).then(function(data){
      $scope.comptes = data;
      for(var i=0; i < $scope.comptes.length; i++){
        $scope.comptes[i].sltd = false;
      }
    });

  }

  function getSelectedAccountCount(){
    console.log('on est la');
    var number = 0;
    for(var i = 0; i<$scope.comptes.length; i++){
      if($scope.comptes[i].sltd)
        number++;
    }
    return number;
  }

  function isActive(){
    $scope.rep = getSelectedAccountCount()>1;

  }

  $scope.populer = function(id){
    $scope.selectedAccounts[$scope.comptes[id].id]=$scope.comptes[id].sltd+";"+ $scope.comptes[id].account_txt;
    isActive();
  };

      $scope.showDialog = function() {
      var instance = $modal.open({
        templateUrl: "/partials/transaction/transaction-modal.html",
        backdrop: true,
        controller: function($scope, $modalInstance, selectedAcc) {
          // NOTE: THIS IS A DIFFERENT SCOPE 
          var champs = new Array(Object.keys(selectedAcc).length);          
          var  i = 0;
          for(var item in selectedAcc){
            var element = {};
            var tab = selectedAcc[item].split(";");
            if(tab[0]== 'true')
              {
                element.text = tab[1];
                element.id = item;
                champs[i] = element;
                i++;
              }
          }
          var finalChamps = new Array(finalChampsCount());
          var j= 0;
          for(i=0; i<champs.length; i++){
            if(champs[i]){
              finalChamps[j++] = champs[i];
            }

          }
          $scope.champs = finalChamps;

          function finalChampsCount (){
            var count = 0;
            for(var i = 0; i<champs.length; i++){
              if(champs[i])
                count++;
            }
            return count;
          }
          $scope.close = function() {
            $modalInstance.dismiss();
          };
          // submit
          $scope.submit = function() {
            // TODO: include validation
            //$modalInstance.close($scope.values);
            $modalInstance.close({});
          };
        },
        resolve: {
          selectedAcc: function() {
            return $scope.selectedAccounts;
          },
        }
      });

      instance.result.then(function(values) {
        // add to the grid
       // $scope.accounts.push(values);
       console.log('ok');
      }, function() {
      });
    };
});



  //Logout button logic - page currently being viewed can be saved


controllers.controller('appController', function($scope, $location, appcache) { 
    console.log("Application controller fired");

    var url = $location.url();
    
    //Assuming initial page load
    if (url === '') {
      //only navigate to cached page if no page was requested
      appcache.getNav().then(function(res) { 
        if(res) { 
          $location.path(res);
        }
      });
    }
    
    //Log URL changes and cache locations - for @jniles
    $scope.$on('$locationChangeStart', function(e, n_url) { 
      //Split url target - needs to be more general to allow for multiple routes?
      var target = n_url.split('/#/')[1];
      appcache.cacheNav(target);
    });
});

controllers.controller('viewController', function($scope) { 
});
  

controllers.controller('fiscalController', function($scope, $q, connect, appstate) { 


    $scope.active = "select";
    $scope.selected = null;
    $scope.create = false;

    

    function init() { 
      //Resposible for getting the current values of selects
      appstate.register("enterprise", function(res) { 
        loadEnterprise(res.id);
        //Reveal to scope for info display
        $scope.enterprise = res;
      });

      //This isn't required - should this be included?
      appstate.register("fiscal", function(res) { 
        console.log("resolving", res);
        $scope.select(res.id);
      });
    }

    function loadEnterprise(enterprise_id) { 
      var fiscal_model = {};

      var promise = loadFiscal(enterprise_id);
      promise
      .then(function(res) { 
        fiscal_model = res;
        //FIXME: select should be a local function (returning a promise), it can then be exposed (/used) by a method on $scope
        //expose model
        $scope.fiscal_model = fiscal_model;
        //select default
        console.log("s", $scope);
        $scope.select(fiscal_model.data[0].id);

      })
    }

    function loadFiscal(enterprise_id) {  
      var deferred = $q.defer();
      connect.req("fiscal_year", ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"], "enterprise_id", enterprise_id).then(function(model) { 
        deferred.resolve(model);
      });
      return deferred.promise;
    }
    

    $scope.select = function(fiscal_id) {
      if($scope.fiscal_model) { 
        fetchPeriods(fiscal_id);
        $scope.selected = $scope.fiscal_model.get(fiscal_id);
        $scope.active = "update";
      } 
    };

    $scope.delete = function(fiscal_id) { 
      //validate deletion before performing
      $scope.active = "select";
      $scope.selected = null;
      $scope.fiscal_model.delete(fiscal_id);
    };

    $scope.isSelected = function() { 
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

    function fetchPeriods(fiscal_id) { 
      connect.req("period", ["id", "period_start", "period_stop"], "fiscal_year_id", fiscal_id).then(function(model) { 
        $scope.period_model = model.data;
      });
    }

    //Initialise after scope etc. has been set
    init();
  });

  controllers.controller('salesController', function($scope, $q, $location, connect, appstate) { 
    // TODO
    //  - selecting a debitor should either be done through id or name search (Typeahead select)
    //  - An Invoice should not be able to include the same item (removed from options for future line items)
    console.log("Sales initialised");

    //Default selection for invoice payable 
    $scope.invoice = {payable: "false"};
    //TODO perform logic with local variables and expose once complete
    $scope.sale_date = getDate();
    $scope.inventory = [];

    var inventory_request = connect.req('inventory', ['id', 'inv_code', 'text', 'price']);
    var sales_request = connect.req('sale', ['id']);
    //FIXME should probably look up debitor table and then patients
    //var debtor_request = connect.req('patient', ['debitor_id', 'first_name', 'last_name', 'location_id']);
    //cache location table to look up debitor details
    //var location_request = connect.req('location', ['id', 'city', 'region', 'country_code']);

    var debtor_query = { 
      'e' : [{
        t : 'patient',
        c : ['debitor_id', 'first_name', 'last_name', 'location_id']
      }, { 
        t : 'location',
        c : ['id', 'city', 'region', 'country_code']
      }],
      'jc' : [{
        ts : ['patient', 'location'],
        c : ['location_id', 'id']
      }]
    };

    var debtor_request = connect.basicReq(debtor_query);
     
    function init() { 

      //FIXME requests shouldn't be dependent on order
      $q.all([
        inventory_request,
        sales_request,
        debtor_request
      ]).then(function(a) { 
        console.log(a);
        $scope.inventory_model = a[0];
        $scope.sales_model = a[1];
        $scope.debtor_model = a[2];

        $scope.debtor = $scope.debtor_model.data[0]; // select default debtor

        var invoice_id = createId($scope.sales_model.data);
        $scope.invoice_id = invoice_id;
      })      

    }

    //FIXME Shouldn't need to download every all invoices in this module, only take top few?
    function createId(list) { 
      var default_id = 100000;
      if(list.length < 1) return default_id; //No invoices have been created
      console.log("Sales list", list);
      var search_max = list.reduce(function(a, b) { a = a.id || a; b = b.id || b; return Math.max(a, b)});
      //reduce returns an object if only one element is in the array for some reason
      //TODOSET
      if(search_max.id) search_max = search_max.id;
      return search_max + 1;
      //return list.reduce(function(a, b) { a = a.id || a; b = b.id || b; return Math.max(a, b)}).id + 1;
    }

    function getDate() { 
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
    } 

    $scope.generateInvoice = function() { 
      //Client validation logic goes here - should be complimented with server integrity checks etc.
        
      //use reduce here 
      var t = 0;
      for(var i = 0, l = $scope.inventory.length; i < l; i++) { 
        t += $scope.inventory[i].quantity * $scope.inventory[i].price;
      }



      
      //create invoice record
      var format_invoice = {
        enterprise_id : appstate.get("enterprise").id, //not safe
        id : $scope.invoice_id,
        cost : t,
        currency : 'USD', //ohgd
        debitor_id : $scope.debtor.debitor_id,
        invoice_date: $scope.sale_date,
        seller_id : '1', //TODO placeholder - this should be derived from appstate (session) or equivelant
        discount: '0', //placeholder
        note : '',
        posted : '0'
      }

      connect.basicPut('sale', [format_invoice]).then(function(res) { 
        if(res.status==200) { 
          var promise = generateInvoiceItems();
          promise.then(function(res) { 
            console.log("Invoice successfully generated", res);
            $location.path('/sale_records/' + $scope.invoice_id);
          })
        }
      })

      /*
      */
    }

    function generateInvoiceItems() { 
      var deferred = $q.defer();
      var promise_arr = [];

      //iterate through invoice items and create an entry to sale_item
      $scope.inventory.forEach(function(item) { 
        var format_item = {
          sale_id : $scope.invoice_id,
          inventory_id : item.item.id,
          quantity : item.quantity,
          unit_price : item.price,
          total : item.quantity * item.price
        }
        console.log("Generating sale item for ", item);

        promise_arr.push(connect.basicPut('sale_item', [format_item]));
      });

      $q.all(promise_arr).then(function(res) { deferred.resolve(res)});
      return deferred.promise;
    }

    $scope.invoiceTotal = function() { 
      var total = 0;
      $scope.inventory.forEach(function(item) {
        if(item.quantity && item.price) { 
          //FIXME this could probably be calculated less somewhere else (only when they change)
          total += (item.quantity * item.price);
        }
      });
      return total;
    }

    $scope.updateItem = function(item) { 
      if(!item.quantity) item.quantity = 1;
      item.text = item.item.text;
      item.price = item.item.price;
    }

    $scope.updateInventory = function() { 
      console.log("Update called");
      var new_line = {item: $scope.inventory_model.data[0]}; //select default item
      $scope.inventory.push(new_line);
      $scope.updateItem(new_line); //force updates of fields
      /* 
      Watching a variable that isn't in angular's scope, return the variable in a function
      $scope.$watch(function() { return new_line.item; }, function(nval, oval, scope) { 
        console.log(nval);
      });*/
    };

    $scope.isPayable = function() { 
      if($scope.invoice.payable=="true") return true;
      return false;
    };

    $scope.itemsInInv = function() { 
      if($scope.inventory.length>0) return true;
      return false;
    };

    $scope.formatDebtor = function(debtor) { 
      return "[" + debtor.debitor_id + "] " + debtor.first_name + " " + debtor.last_name;
    }

    init();
  });

  controllers.controller('salesRecordsController', function($scope, $q, $routeParams, connect) { 
    console.log("Sale records initialised");

    var invoice = ($routeParams.recordID || -1);
    console.log("Got invoice", invoice);

    function init() { 
      var promise = fetchRecords();


      $scope.invoice_model = {};
      $scope.invoice_filter = {
        filterText: ""
      };

      $scope.gridOptions = { 
        multiSelect: false,
        selectedItems: [],
        columnDefs : [{field:'id', display:'id'},
                      {field:'cost', display:'total', cellFilter: 'currency'},
                      {field:'debitor_id', display:'debtor'},
                      {field:'invoice_date', display:'date', cellFilter: 'date: "dd/MM/yyyy"'},
                      {field:'posted', display:'posted'}],
      data : 'invoice_model.data',
      //FIXME Search seems unpredictable - check filter settings
      filterOptions: $scope.invoice_filter
      };

      promise
      .then(function(model) { 
        //FIXME configure locally, then expose
        
        //expose scope 
        $scope.invoice_model = model; //ng-grid
        $scope.gridOptions.selectRow(1, true);
        //Select default
      }); 

      $scope.post = function() { 
        console.log("Request for post");
        console.log($scope.gridOptions.selectedItems);
        var selected = $scope.gridOptions.selectedItems;
        var request = [];
        if(selected.length>0) { 
          selected.forEach(function(item) { 
            if(item.posted==0) { 
              request.push(item.id);
            }
          });
        }

        connect.journal(request);
        console.log("request should be made for", request);
      }
    }

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req('sale', ['id', 'cost', 'currency', 'debitor_id', 'discount', 'invoice_date', 'posted'])
      .then(function(model) { 
        deferred.resolve(model);
      });

      return deferred.promise;
    }

    init();
  });

  controllers.controller('patientSearchController', function($scope, $q, $routeParams, connect) { 
    console.log("Patient Search init");

    var patient = ($routeParams.patientID || -1);

    function init() { 
      var promise = fetchRecords();


      $scope.patient_model = {};
      $scope.patient_filter = {
        filterText: ""
      };

      $scope.gridOptions = { 
        multiSelect: false,
        data : 'patient_model.data',

        columnDefs : [{field:'name', display:'name'},
                      {field:'dob', display:'dob', cellFilter: 'date: "dd/MM/yyyy"'},
                      {field:'sex', display:'gender'},
                      {field:'religion', display:'religion'},
                      {field:'marital_status', display:'marital status'},
                      {field:'phone', display:'phone'},
                      {field:'email', display:'email'}],
      //FIXME Search seems unpredictable - check filter settings
      filterOptions: $scope.patient_filter
      };

      promise
      .then(function(model) { 
        //FIXME configure locally, then expose
        
        //expose scope 
        $scope.patient_model = filterNames(model); //ng-grid
        $scope.gridOptions.selectRow(1, true);
        console.log($scope.gridOptions);
        //Select default
      }); 
    }

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req('patient', ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2'])
      .then(function(model) { 
        deferred.resolve(model);
      });

      return deferred.promise;
    }

    function filterNames(model) { 
      var d = model.data;
      for(var i=0, l=d.length; i<l; i++) { 
        d[i]["name"] = d[i].first_name + " " + d[i].last_name;
      }
      return model;
    }

    $scope.$on('ngGridEventData', function(){
      if(patient >= 0) $scope.select(patient);
    });

    $scope.select = function(id) { 
      //model.get() would not provide index in an un-ordered object
      angular.forEach($scope.patient_model.data, function(item, index) {
        console.log(item.id, id); 
        if(item.id==id) { 
          $scope.gridOptions.selectRow(index, true);
          var g = $scope.gridOptions.ngGrid;
          g.$viewport.focus();
          return;
        }   
      });
    }

    init();
  });
    
  //FIXME updates to patient and location broke everything here, update to use that instead
  controllers.controller('patientRegController', function($scope, $q, $location, connect) { 
    console.log("Patient init");
    var patient_model = {};
    var submitted = false;
   
    function init() { 
      //register patient for appcahce namespace
      
      var location_request = connect.req('location', ['id', 'city', 'region']);
      //for creating patient ID - this isn't ideal
      var patient_request = connect.req('patient', ['id']);

      $q.all([location_request, patient_request])
      .then(function(res) { 
        $scope.location_model = res[0];
        $scope.patient_model = res[1];
        //$scope.location = $scope.location_model.data[0]; //select default
      });
    }

    function createId(data) { 
      var search = data.reduce(function(a, b) {a = a.id || a; b = b.id || b; return Math.max(a, b);});
      if(search.id) search = search.id;
      return search + 1;
    }

    $scope.update = function(patient) { 
      patient_model = patient;

      //validate model 
      patient_model.id = createId($scope.patient_model.data);
      patient_model.debitor_id = patient_model.id;

      //Create debitor record for patient - This SHOULD be done using an alpha numeric ID, like p12
      //1 - default group_id, should be properly defined
      connect.basicPut("debitor", [{id: patient_model.id, group_id: 1}])
      .then(function(res) { 
        //Create patient record
        connect.basicPut("patient", [patient_model])
        .then(function(res) {
          $location.path("patient_records/" + res.data.insertId);
          submitted = true;
        });
      });

    };

    $scope.formatLocation = function(l) { 
      return l.city + ", " + l.region;
    }

    $scope.checkChanged = function(model) { 
        return angular.equals(model, $scope.master);
    };

    $scope.checkSubmitted = function() { 
      return submitted;
    };


    init();
  });

  controllers.controller('budgetController', function($scope, $q, connect, appstate) { 
    /////
    //  summary: 
    //    Controller behaviour for the budgeting unit, fetches displays and allows updates on data joined from 
    //    enterprise, account, fiscal year, period and budget
    //  TODO
    //    -Split budgeting unit into 3 or 4  controllers, one for each component
    //    -Memory in budgeting, fiscal years compared should be re-initialised, most used accounts, etc.
    /////
    

    //TODO: This data can be fetched from the application level service
    $scope.enterprise = {
      name : "IMA",
      city : "Kinshasa",
      country : "RDC",
      id : 102
    };

    var current_fiscal = {
      id : 2013011
    };

    init();

    function init() { 
      appstate.register("enterprise", function(res) { 
        createBudget(res.id);

        //Expose to scope for view
        $scope.enterprise = res;
      });
    }

    function createBudget(e_id) { 
      var account_model = {};
      var fiscal_model = {};
      var budget_model = {reports: []};

      var default_account_select;

      var promise = fetchAccount(e_id);
      promise
      .then(function(model) { 
        account_model = model;
        default_account_select = account_model.data[0].id; //First account in list, could be loaded from cache (model.get(cache_id))
        return fetchFiscal(e_id);
      })
      .then(function(model) { 
        fiscal_model = model;

        //set the first budget report - this will be populated in updateReport
        var default_fiscal = appstate.get("fiscal") //Risky with validation checks
        budget_model.reports.push({id : default_fiscal.id, desc : default_fiscal.fiscal_year_txt, model :  {}})
        fiscal_model.delete(default_fiscal.id);
        return updateReport(default_account_select, budget_model.reports);
      })
      .then(function(model) { 
        //All models populated - expose to $scope
        $scope.account_model = account_model;
        $scope.fiscal_model = fiscal_model;
        //TODO: Util function to check if there are any fiscal years left
        //Default select
        $scope.selected_fiscal = $scope.fiscal_model.data[0];
        $scope.selected_account = $scope.account_model.get(default_account_select); 
        $scope.budget_model = budget_model;

        console.log(budget_model);
        //Model has already been populated by default
        setSelected(default_account_select); //optional/ can expose default to $scope, or wait for user selection
      });
    }

    function fetchAccount(e_id) { 
      var deferred = $q.defer();
      connect.req("account", ["id", "account_txt", "account_category"], "enterprise_id", e_id).then(function(model) { 
        deferred.resolve(model);
      });
      return deferred.promise;
    }

    function fetchFiscal(e_id) { 
      /////
      // summary:  
      //  Create model with all fiscal years for budget comparison 
      // ~
      //  Fiscal year data for a given enterprise already exists in the outside application, this could either be used directly (very 
      //  specific example) or the data downloaded could be cached using the connect service (ref: connect, sockets)
      /////
      var deferred = $q.defer();
      connect.req("fiscal_year", ["id", "fiscal_year_txt"], "enterprise_id", e_id).then(function(model) { 
        deferred.resolve(model);
      });
      return deferred.promise;
    }

    //FIXME: seperate complete update from fetching individudal model (call populateModel() loopping through reports.length)
    // Models should not be updated or refreshed on a new comparison
    function updateReport(account_id, reports) { 
      var deferred = $q.defer();

      for(var i = 0, l = reports.length; i < l; i++) { 
        var y = reports[i];

        (function(i, y) { 
          fetchBudget(account_id, y.id).then(function(model) { 
            y.model = indexMonths(model);
            y.display = formatBudget(y.model);
            console.log("fetchBudget", i, l);
            if(i==l-1) { 
              console.log("resolving", reports);
              deferred.resolve(reports);
            }
          });
        })(i, y);
      }
      return deferred.promise;
    }

    function populateModel() { 

    }
   
    function fetchBudget(account_id, fiscal_year) { 
      //FIXME: request object should be formed using connect API, or straight table downloaded etc - implementation decision
      var deferred = $q.defer();
      var budget_query = {
        'e' : [{
          t : 'period',
          c : ['period_start', 'period_stop'] 
        }, {
          t : 'budget',
          c : ['id', 'account_id', 'period_id', 'budget']
        }],
        'jc': [{
          ts: ['period', 'budget'],
          c: ['id', 'period_id'],
          l: 'AND'
        }],
        'c': [{
          t: 'budget',
          cl: 'account_id',
          z: '=', 
          v: account_id, 
          l: 'AND' 
        }, 
        {
          t: 'period',
          cl: 'fiscal_year_id', 
          z: '=',
          v: fiscal_year
      }]};

      connect.basicReq(budget_query).then(function(model) { 
        deferred.resolve(model);
      });
      return deferred.promise;
    }

    function indexMonths(model) {
      //not ideal as it changes the model? can be updated 
      var month_index = {};
      var d = model.data;
      for(var i = d.length - 1; i >= 0; i--) {
          var month = (new Date(d[i].period_start).getMonth());
          month_index[month] = d[i]["id"];
      }
      model.month_index = month_index;
      return model;
    }

    function setSelected(account_id) { 
      //Selection has been successful - update $scope
      //Set account as selected
      $scope.selected_account = $scope.account_model.get(account_id);
      //Set flag for DOM, displaying the report
      $scope.active = "report";
    }

    function formatBudget(model) { 
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dev"];

      var format = [];
      for (var i = 0, c = months.length; i < c; i++) {
        var l = model.month_index[i];
        if(l) { 
          var data = model.get(l);
          //FIXME: repeated data in model and period
          data.actual = 0; //actual placeholder
          format.push(data);
          console.log("format", data);
        } else { 
          format.push(null);
        }
      };
      console.log("f return", format);
      return format;
    }

    $scope.select = function(account_id) { 
      //see $scope.$evalAsync() - ng-init not updating      
      var promise = updateReport(account_id, $scope.budget_model.reports);
      promise
      .then(function(model) { 
        //Report models updated - expose to $scope
        $scope.budget_model.reports = model;
        setSelected(account_id);
      });      
    }

    $scope.filterMonth = function(report, index) {
      console.log("filterMonth request", report);
      console.log("month_index", report.model.month_index);
      console.log("index", index);
      if(report.model.month_index) {
      var l = report.model.month_index[index];
      if(l) { 
        return report.model.get(l);
      }
      }
    };

    /*This isn't optimal*/
    $scope.sum = function(report) { 
      //TODO: check if line.budget exists or something
      if(report.model.data) { 
        var total = 0;
        report.model.data.forEach(function(line) { 
          total += Number(line.budget);
        });
        return total;
      }
      return null;
    };

    $scope.compare = function() { 
      console.log("compare");
      $scope.budget_model.reports.push({id : $scope.selected_fiscal.id, desc : $scope.selected_fiscal.fiscal_year_txt, model : {}});
      $scope.select($scope.selected_account.id);
      console.log("cmp", $scope.selected_fiscal);
      $scope.fiscal_model.delete($scope.selected_fiscal.id);
      $scope.selected_fiscal = $scope.fiscal_model.data[0];
    };

    $scope.deleteCompare = function(report) { 
      var arr = $scope.budget_model.reports;
      arr.splice(arr.indexOf(report), 1);
      //update fiscal select
      //hard coded bad-ness
      $scope.fiscal_model.put({id : report.id, fiscal_year_txt : report.desc});
      $scope.selected_fiscal = $scope.fiscal_model.get(report.id);
    };

    $scope.validSelect = function() { 
      //ugly
      if($scope.fiscal_model) { 
        if($scope.fiscal_model.data.length > 0) { 
          return false;
        } 
      }
      
      return true;
    };

    init();
  });

  controllers.controller('billingGroupsController', function($scope, appstate, data) { 

    var query = {
      primary: 'billing_group',
      tables : {
        'billing_group' : {
          columns: ['id', 'name', 'account_number', 'address_1', 'address_2', 'location_id', 'payment_id', 'email', 'phone', 'locked', 'note', 'contact_id', 'tax_id', 'max_credit']
        },
        'location': { 
          columns: ['city', 'region']
        }
      },
      join : ["billing_group.location_id=location.id"],
    };

    appstate.register('enterprise', function(res) {
      var condition = "billing_group.enterprise_id=",
          enterpriseid = res.id;
      query.where = [condition + enterpriseid];
      $scope.selected = false;
    });

    $scope.outOfSync = false;

    var store = data.register(query);
    store.then(function() {
      $scope.grp_model = store.data;
    });
    
    $scope.select = function(index) {
      $scope.selected = $scope.grp_model[index];
      $scope.selectedIndex = index;
    };

    function generateId (model) {
      var maxid = model.reduce(function(max, right) {
        max = max.id || max; // for the first iteration
        return Math.max(max, right.id);
      });
      return maxid + 1; // incriment
    }

    $scope.addGroup = function () {
      var id = generateId($scope.grp_model);
      var idx = $scope.grp_model.push({id: id});
      $scope.select(idx - 1);
    };

    $scope.$watch('grp_model', function() {
      // FIXME:  This doesn't work for some reason
      $scope.outOfSync = true; 
    });

    $scope.sync = function() {
      //store.sync();
      $scope.outOfSync = false;
    };

    $scope.removeGroup = function () {
      $scope.grp_model.splice($scope.selectedIndex, 1);
      $scope.selected = false;
    };

    $scope.sort = function (col) {
      // FIXME: Impliment quicksort for arrays of objects
    };

  });
  
  // Chart of Accounts controllers
  controllers.controller('chartController', function($scope, $q, $modal, data, appstate) {

    // import account
    var account_spec = {
      identifier: 'id',
      primary: 'account',
      tables: {
        'account': {
          columns: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_type_id', 'fixed'],
        },
        'account_type': {
          columns: ['type'] 
        }
      },
      join: ['account.account_type_id=account_type.id'],
      where: ["account.enterprise_id=" + 101], //FIXME
      autosync: true
    };

    // import account_type 
    var account_type_spec = {
      identifier: 'id',
      tables: {
        'account_type' : {
          columns: ['id', 'type']
        }
      },
      autosync: true
    };

    // NOTE/FIXME: Use appstate.get().then() to work out the enterprise_id

    var account_store = data.register(account_spec);
    var type_store = data.register(account_type_spec);
    console.log("account_store", account_store);
    console.log("type_store", type_store);

    // OMG SYNTAX
    $q.all([
      account_store,
      type_store
    ]).then(init);

    function init (arr) {
      $scope.account_model = arr[0].data;
      $scope.type_model = arr[1].data;
      console.log($scope.account_model);
    }

    // FIXME: Find a better name, etc.
    $scope.map = function (id) {
      return (id == 1) ? "Fixed" : "Relative";
    };

    // ng-grid options
    $scope.gridOptions = {
      data: 'account_model',
      columnDefs: [
        {field: 'id', displayName: "Account Number"},
        {field: 'account_txt', displayName: "Account Text"},
        {field: 'account_type_id', displayName: "Account Type",
          cellTemplate: '<div class="ngCellText">{{row.getProperty("type")}}</div>',
          editableCellTemplate: '<div><select style="padding:0;margin:0;height:100%;width:100%;" ng-input="COL_FIELD" ng-model="row.entity.account_type_id" ng-change="updateRow(row)" ng-options="acc.id as acc.type for acc in type_model"></select></div>',
          enableCellEdit: true
        },
        {field: 'fixed', displayName: 'Fixed/Relative',
          cellTemplate: '<div class="ngCellText">{{map(row.getProperty("fixed"))}}</div>',
          editableCellTemplate: '<div><select ng-input="COL_FIELD" ng-model="row.entity.fixed" ng-change="fixedRow(row)"><option value="0">Relative</option><option value="1">Fixed</option></select></div>',
          enableCellEdit: true
        },
        {field: 'locked', displayName: "Locked",
          cellTemplate: '<div class="ngCellText"><chkbox model="row.entity.locked"></chkbox></div>', 
        }
      ],
      enableRowSelection:false,
      enableColumnResize: true
    };

    $scope.updateRow = function(row) {
      // HACK HACK HACK
      row.entity.type = type_store.get(row.entity.account_type_id).type;
      account_store.put(row.entity);
      console.log($scope.account_model[row.rowIndex]);
    };

    // dialog controller
    $scope.showDialog = function() {
      var instance = $modal.open({
        templateUrl: "/partials/chart/templates/chart-modal.html",
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
        $scope.model.push(values);
      }, function() {
      });
    };

    $scope.config = {
      isPaginationEnabled: true,
      itemsByPage: 16,
      selectionMode: 'single'
    };
  });

  controllers.controller('inventoryController', function($scope) {
 
    $scope.fields = {
      'stock'  : false,
      'admin'  : false,
      'report' : false
    };

    $scope.slide = function (tag) {
      $scope.fields[tag] = !$scope.fields[tag];
    };
  });


  controllers.controller('inventoryRegisterController', function ($scope, data, $q) {

    var account_spec = {
      identifier: 'id',
      tables: {
        'account': {
          columns: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_type_id']
        }
      },
      where: ["account.enterprise_id=" + 101], // FIXME
    };

    var group_spec = {
      identifier: 'id',
      tables: {
        'inventory_group': {
          columns: ["id", "text", "purchase_account", "sales_account", "stock_increase_account", "stock_increase_account"]  
        }
      },
    };

    var price_spec = {
      identifier: 'id',
      tables: {
        'price_group' : {
          columns: ["id", "text"] 
        } 
      }
    };

    var inv_type_spec = {
      identifier: 'id',
      tables : {
        'inventory_type': {
          columns: ["id", "text"]
        } 
      }
    };

    var inv_unit_spec = {
      identifier: 'id',
      tables : {
        'inventory_unit': {
          columns: ["id", "text"] 
        } 
      }
    };

    $q.all([
      data.register(account_spec),
      data.register(group_spec),
      data.register(price_spec),
      data.register(inv_type_spec),
      data.register(inv_unit_spec)
    ]).then(init);

    function init(arr) {
      var account_store = arr[0],
        group_store = arr[1],
        price_store = arr[2],
        type_store = arr[3],
        unit_store = arr[4];

      $scope.types = type_store.data;
      $scope.accounts = account_store.data;
      $scope.groups = group_store.data;
      $scope.prices = price_store.data;
      $scope.units = unit_store.data;

      console.log("types", type_store.data);

    }

    $scope.validate = function() {
      $scope.validated = true; 
    };

    $scope.item = {};

    $scope.label = function(obj) {
      return obj.id + " - " + obj.account_txt;
    };

  });

  controllers.controller('cashController', function($scope, data, $q, $filter) {

    // TODO:
    // - Organize code better
    //   - keep track of the currently selected invoice, so we always know what we are PAYING.
    //   - Either fully separate VIEW and what is being POSTED, or fully combine them.
    //   - Make text a field in the database
    //   - add in support for getting the selects via appstate
    // - Clean up sockets
    //   - Make sure that the "paid" invoice is then "paid" in the database
    //   - Find a way to reduce the number of sockets
    //   - use the store's .get() methods instead of indexing into objects.
    //   - reduce the size of the store's requires

    var account_spec, invoice_spec, debitor_spec,
      cash_spec, currency_spec, enterprise_spec;

    enterprise_spec = {
      identifier: "id",
      tables: { 'enterprise' : {columns: ["id", "cash_account"]}},
      where: ["enterprise.id="+101] // FIXME
    };
    
    account_spec = {
      identifier: "id",
      tables: {
        'account': {columns: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_type_id', 'fixed']}
      },
      where: ["account.enterprise_id=" + 101] //FIXME
    };
    
    invoice_spec = {
      identifier: "id",
      tables: {
        'sale': {columns: ["id", "cost", "currency", "debitor_id", "discount", "invoice_date", "note", "paid"]}
      },
      where: ["sale.enterprise_id="+101, "AND", "sale.paid=0"] //FIXME
    };

    debitor_spec = {
      identifier: "id",
      primary: "patient",
      tables: {
        "debitor": {columns: ["id"]},
        "debitor_group" : {columns: ["name", "account_number", "note"]}
      },
      join: ["debitor.group_id=debitor_group.id"],
    };

    cash_spec = {
      identifier: "id",
      tables: {
        "cash" : { //FIXME: Have a service that holds the current user information
          columns: ["id", "bon", "date", "debit_account", "credit_account", "amount", "currency_id", "cashier_id"] 
        }
      } 
    };

    currency_spec = {
      identifier: "id",
      tables: {"currency" : {columns: ["id", "symbol"]}} 
    };

    $q.all([
      data.register(enterprise_spec),
      data.register(account_spec),
      data.register(invoice_spec),
      data.register(debitor_spec),
      data.register(cash_spec),
      data.register(currency_spec)
    ]).then(init);


    var es, as, is, ds, cs, cus;
    
    function init (arr) {
      // init all data connections
      es = arr.shift();
      as = arr.shift();
      is = arr.shift();
      ds = arr.shift(); // maybe this isn't the best way of doing this..
      cs = arr.shift();
      cus = arr.shift();
      $scope.accounts = as.data;
      $scope.debitors = ds.data;
      $scope.invoices = is.data; // outstanding invoices
      $scope.currencies = cus.data;
      $scope.cash = cs.data;

      console.log(is);

      // Defaults for currency drop-downs
      setDefaults();
    }

    function setDefaults () {
      // create objects for the receipt and dispersement and final
      var slip = $scope.slip = {};

      // experimental view
      $scope.view = {};

      // default debit account is cash box
      slip.credit_account = es.get(101).cash_account;

      // default date is today
      slip.date = $filter('date')(new Date(), 'yyyy-MM-dd');

      // we start up as entree
      slip.bon = "E";

      // get filtered lists of bons by type    
      $scope.bon_r = filterBon($scope.cash, function(d) { return d.bon == "D"; }); // depense
      $scope.bon_d = filterBon($scope.cash, function(d) { return d.bon == "S"; }); // sortie

      console.log("bon", $scope.bon_r);
    
      // create a new invoice id
      slip.id = get_max($scope.cash, 'id') + 1;

      // TODO/FIXME: What is this for?
      slip.bon_num = 1;

      // set the default currency
      slip.currency_id = $scope.currencies[0].id;
      $scope.view.currency = $scope.currencies[0].symbol;

      // set a default cashier
      // FIXME
      slip.cashier_id = 1;
    }

    // filters the function based on the filter function
    // (fx) passed in.  fx should be a function.
    function filterBon (model, fx) {
      return model.filter(function (d) {
        return fx(d);
      });
    }

    // set the currency
    $scope.setCurrency = function (idx) {
      var id = $scope.currencies[idx].id;
      $scope.slip.currency_id = id;
      $scope.view.currency = cus.get(id).symbol;
    };

    // loop through a model on 'property' and return 
    // the max value.
    function get_max(model, property) {
      if (model.length < 1) { return 0; }
      return model.reduce(function(max, right) {
        max = max[property] || max; // for the first iteration
        return Math.max(max, right[property]);
      });
    }

    $scope.updateForm = function(e) {
      console.log("e:", e);
    };

    // format account display
    // FIXME: find a better way of doing this:
    // called ~= 6 times per refresh per item
    $scope.formatAcc = function (obj) {
      return obj.id + " - " + obj.account_txt; 
    };

    // TODO: differentiate btwn credit/debit accout depending on sortie
    // or entree.
    $scope.taSelect = function () {
      var slip = $scope.slip;
      slip.amount = slip.text.cost;
      var debitor_id = slip.text.debitor_id;
      console.log("di:", debitor_id);
      slip.debit_account = ds.get(debitor_id).account_number;
      slip.text = null;
      delete slip.text; // FIXME: organise code better
    };

    $scope.sign = function () {
      // do any last minute checks
      console.log('signing...');
      console.log('cs:', cs);
      cs.put($scope.slip);
      cs.sync();
      $scope.sent = "Signed the invoice successfully!";
      setDefaults();
    };


  });

 //***************************************************************************************
//******************** JOURNAL CONTROLLER ************************************************
//***************************************************************************************
controllers.controller('journalController', function($scope, $q, bikaConnect, bikaUtilitaire){
  var postingListe={};
  $scope.infosJournal = [];  
   var e = [{t : 'journal', c : ['id','description', 'date', 'posted']},
            {t:'sale', c:['currency', 'cost', 'discount', 'invoice_date', 'note']},
            {t:'employee', c:['name']},
            {t:'user', c:['first']},
            {t:'enterprise', c:['type']},
            {t:'debitor', c:['text']}
           ],
       jc = [{ts:['journal', 'enterprise'], c:['enterprise_id', 'id'], l:'AND'},
             {ts: ['journal', 'user'], c:['user_id', 'id'], l:'AND'},
             {ts: ['journal', 'sale'], c:['sale_id', 'id'], l:'AND'},
             {ts: ['sale', 'enterprise'], c:['enterprise_id', 'id'], l:'AND'},
             {ts: ['sale', 'debitor'], c:['debitor_id', 'id'], l:'AND'},
             {ts: ['sale', 'employee'], c:['seller_id', 'id']}
            ], req_db = {};
   req_db.e = e;
   req_db.jc = jc;
   bikaConnect.get('/journal?', req_db).then(function(data){
    $scope.infosJournal=data;
    for(var i = 0; i<data.length; i++){
     $scope.infosJournal[i].posted = ($scope.infosJournal[i].posted == 1)?true:false;
     $scope.infosJournal[i].date = bikaUtilitaire.formatDate($scope.infosJournal[i].date);
     $scope.infosJournal[i].invoice_date = bikaUtilitaire.formatDate($scope.infosJournal[i].invoice_date); 
    }
  });

   $scope.tryChecking = function(index){
    var res = isCheckingValide(index);
    res.then(function(response){
      if(!response){
        $scope.infosJournal[index].posted = true;
      }else{
        postingListe[index] = $scope.infosJournal[index].posted;
      }
    });
   }

   function isCheckingValide(index){
    var def = $q.defer();
    var req_db = {};
    req_db.e = [{t:'journal', c:['posted']}];
    req_db.c = [{t:'journal', cl:'id', z:'=', v:$scope.infosJournal[index].id}];
    bikaConnect.get('/data/?', req_db).then(function(data){
      (data[0].posted == 1)?def.resolve(false):def.resolve(true);
    });
    return def.promise;
   }

   $scope.poster = function(){
    var tabJournalID = [];
    for(var cle in postingListe){
      if(postingListe[cle]){
        tabJournalID.push($scope.infosJournal[cle].id);
      }
    }
    bikaConnect.sendTo('gl/', 'gl',tabJournalID);

   }
});

})(angular);
