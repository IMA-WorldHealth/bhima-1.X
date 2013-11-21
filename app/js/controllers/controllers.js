// Controller.js
(function(angular) {
  'use strict'; 
  var controllers = angular.module('kpk.controllers', []);

//************************************************************************************
//******************************* TREE CONTROLLER ************************************
//************************************************************************************  
controllers.controller('treeController', function($scope, $q, $location, appcache, kpkConnect) {    
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
      kpkConnect.get('/tree?',request).then(function(data) { 
        deferred.resolve(data);
      });
      return deferred.promise;
    }

    function getChildren(role, callback){
      var request = {}; 
      request.e = [{t : 'unit', c : ['id', 'name', 'url']}];
      request.c = [{t:'unit', cl:'parent', v:role.id, z:'='}];
      kpkConnect.get('/tree?',request).then(function(data) {
          callback(role, data); 
        
      });

    };

});

//************************************************************************************
//******************************* USER CONTROLLER ************************************
//************************************************************************************
controllers.controller('userController', function($scope, $q, kpkConnect) {
  //initilaisation var
  
  $scope.selected = {};
  $scope.chkTous = false;
  $scope.showbadpassword=false;
  $scope.showbademail = false;
  $scope.showbadusername = false;

  //population model de table
  getUsers();

  //population model de role
  kpkConnect.fetch("unit", ["id", "name"], 'parent', 0).then(function(data){
    $scope.roles = data;
  });

  //population model d'unite
  kpkConnect.fetch("unit", ["id", "name", "description", "parent"]).then(function(data) { 
    $scope.units = data;
    for(var i=0; i<$scope.units.length; i++){
      $scope.units[i].chkUnitModel = false;
    }    
  });

  //**************** les fonctions *****************
  function getUsers(){
    var request = {}; 
  request.e = [{t : 'user', c : ['id', 'username', 'email', 'password','first', 'last', 'logged_in']}];
  kpkConnect.get('/data/?',request).then(function(data) { 
    $scope.model = data;
  });
  }
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
    kpkConnect.get('/data/?', request).then(function (data){      
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
        kpkConnect.send('user', [{id:'',
                   username: $scope.selected.username,
                   password: $scope.selected.password,
                   first: $scope.selected.first,
                   last: $scope.selected.last,
                   email: $scope.selected.email,
                   logged_in:0}]);

    var request = {}; 
        request.e = [{t : 'user', c : ['id']}];
        request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'=', l:'AND'}, {t:'user', cl:'password', v:$scope.selected.password, z:'='}];
        kpkConnect.get('data/?',request).then(function(data) {           
          for(var i = 0; i<$scope.units.length; i++){
            if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
              kpkConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:data[0].id}]);
            }
          }         
    
    });
    refreshUserModel();
      }else{
        $scope.showbadusername = true;
      }

    });
    
  }

    $scope.delete = function(){
      if($scope.selected.id){
        kpkConnect.delete('user', $scope.selected.id);
        $scope.selected = {};
        getUsers();
      }    
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
    kpkConnect.get('data/?',request).then(function(data) { 
    $scope.model = data;
    $scope.selected={};
    $scope.confirmpw = "";
    $scope.showbadpassword = false;
    $scope.showbademail = false;
    });
    }

    function updateUser(){
      $scope.showbadusername = false;
      kpkConnect.get('data/?', {t:'permission', ids:{id_user:[$scope.selected.id]}, action:'DEL'});
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
      kpkConnect.update(sql_update);
      for(var i = 0; i<$scope.units.length; i++){
          if($scope.units[i].chkUnitModel === true && $scope.units[i].parent !==0 && $scope.units[i].id != 0){
            kpkConnect.send('permission', [{id:'', id_unit: $scope.units[i].id, id_user:$scope.selected.id}]);
          }
          } 

      

      refreshUserModel();

    }

    function existe(){
      var def = $q.defer();
      var request = {}; 
      request.e = [{t : 'user', c : ['id']}];
      request.c = [{t:'user', cl:'username', v:$scope.selected.username, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
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
controllers.controller('transactionController', function($scope, $rootScope, $location, kpkConnect, kpkUtilitaire, appstate) { 
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
        kpkConnect.get('/data/?', req_db).then(function(data){
          $scope.account_model = data;
        });
    }

    function fillDateFrom(fiscal_id){
        var req_db = {};
        req_db.e = [{t:'period', c:['period_start']}];
        req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
        kpkConnect.get('/data/?', req_db).then(function(data){
          for(var i = 0; i<data.length; i++){
            data[i]['period_start'] = kpkUtilitaire.formatDate(data[i].period_start);
          }
          $scope.periodFroms = data;
        });
    }

    function fillDateTo(fiscal_id){
        var req_db = {};
        req_db.e = [{t:'period', c:['period_stop']}];
        req_db.c = [{t:'period', cl:'fiscal_year_id', z:'=', v:fiscal_id}];
        kpkConnect.get('/data/?', req_db).then(function(data){
          for(var i = 0; i<data.length; i++){
            data[i]['period_stop'] = kpkUtilitaire.formatDate(data[i].period_stop);
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
      kpkConnect.get('/data/?', req_db).then(function(data){
        for(var i = 0; i<data.length; i++){
        data[i].date = kpkUtilitaire.formatDate(data[i].date);
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
               {t : 'transaction', cl : 'date', v : kpkUtilitaire.convertToMysqlDate(dep.df), z : '>=', l : 'AND'},
               {t : 'transaction', cl : 'date', v : kpkUtilitaire.convertToMysqlDate(dep.dt), z : '<='}
              ];
          var req_db={};
          req_db.e=e;
          req_db.jc = jc;
          req_db.c = c;
          kpkConnect.get('/data/?', req_db).then(function(data){
            for(var i = 0; i<data.length; i++){
              data[i].date = kpkUtilitaire.formatDate(data[i].date);
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
 
controllers.controller('utilController', function($rootScope, $scope, $q, kpkConnect, appstate, kpkUtilitaire) { 
  /////
  // summary: 
  //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
  //  
  // TODO 
  //  -All operations on models should be local, and then exposed to scope
  //  -Should use connect instead of kpkConnect (soon to be deleted)
  /////
  /*$scope.enterprise_model = {};
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
    kpkConnect.get('/data/?',req_db).then(function(data){
      for(var i = 0; i<data.length; i++){
        data[i].period_start = kpkUtilitaire.formatDate(data[i].period_start);
        data[i].period_stop = kpkUtilitaire.formatDate(data[i].period_stop);
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
    kpkConnect.get('/data/?', req_db).then(function(data){
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
    kpkConnect.get('/data/?',req_db).then(function(data){
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
  });*/
});


controllers.controller('appController', function($scope) { 
    // TODO/FIXME
});

//*************************************************************************
//********************* ADD CONTROLLER ************************************
//*************************************************************************

controllers.controller('addController', function($scope, $modal, kpkConnect, appstate) {

  $scope.selectedAccounts = {};  
  $scope.rep = false;
  fillCurrencies();
  appstate.register('enterprise', function(res){
    fillAccounts(res.id);
  });

  function fillCurrencies(){
      var req_db = {};
      req_db.e = [{t:'currency', c:['id', 'name', 'symbol']}];
      kpkConnect.get('/data/?', req_db).then(function(data){
        $scope.currencies = data;
      });
  }

  function fillAccounts(idEnterprise){
    var req_db = {};
    req_db.e = [{t:'account', c:['account_txt', 'id']}];
    req_db.c = [{t:'account', cl:'enterprise_id', z:'=', v:idEnterprise}];
    kpkConnect.get('/data/?', req_db).then(function(data){
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
        console.log("Appstate returned", res);
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
      var fiscal_query = {
        'tables' : {
          'fiscal_year' : {
            'columns' : ["id", "number_of_months", "fiscal_year_txt", "transaction_start_number", "transaction_stop_number", "start_month", "start_year", "previous_fiscal_year"]
          }
        },
        'where' : ['fiscal_year.enterprise_id=' + enterprise_id]
      }
      connect.req(fiscal_query).then(function(model) {
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
      var period_query = {
        'tables' : {
          'period' : {
            'columns' : ["id", "period_start", "period_stop"]
          }
        },
        'where' : ['period.fiscal_year_id=' + fiscal_id]
      }
      connect.req(period_query).then(function(model) {
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
    //  - Invoice ID should be updated if an invoice is created in the time since invoice creation - see sockets
    console.log("Sales initialised");

    //Default selection for invoice payable
    $scope.invoice = {payable: "false"};
    //TODO perform logic with local variables and expose once complete
    $scope.sale_date = getDate();
    $scope.inventory = [];

    var inventory_request = connect.req({'tables' : { 'inventory' : { columns : ['id', 'code', 'text', 'price']}}});
    var sales_request = connect.req({'tables' : { 'sale' : {columns : ['id']}}});

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
          c : ['id', 'city', 'region', 'country_id']
        }],
        'jc' : [{
          ts : ['patient', 'location'],
          c : ['location_id', 'id']
        }]
    };

    var debtor_request = connect.basicReq(debtor_query);
    var user_request = connect.basicGet("user_session");
     
    function init() { 

//      FIXME requests shouldn't be dependent on order
//      FIXME should verify user ID at the time of submitting invoice, less time to manipulate it I guess
      $q.all([
        inventory_request,
        sales_request,
        debtor_request,
        user_request
      ]).then(function(a) { 
        console.log(a);
        $scope.inventory_model = a[0];
        $scope.sales_model = a[1];
        $scope.debtor_model = a[2];
        $scope.verify = a[3].data.id;

        //$scope.debtor = $scope.debtor_model.data[0]; // select default debtor

        var invoice_id = createId($scope.sales_model.data);
        $scope.invoice_id = invoice_id;
      });

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
    }

    function getDate() { 
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      var now = new Date();
      return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
    }

    $scope.formatText = function() {
//      FIXME String functions within digest will take hours
      var debtor_text = '';
      if($scope.debtor) debtor_text = $scope.debtor.last_name + '/' + $scope.debtor.first_name;
      return "PI " + $scope.invoice_id + "/" + debtor_text + "/" + $scope.sale_date;
    }

    $scope.generateInvoice = function() { 
      //Client validation logic goes here - should be complimented with server integrity checks etc.
        
//      FIXME use reduce here
      var t = 0;
      for(var i = 0, l = $scope.inventory.length; i < l; i++) { 
        t += $scope.inventory[i].quantity * $scope.inventory[i].price;
      }
      
      //create invoice record
      var format_invoice = {
        enterprise_id : appstate.get("enterprise").id, //not safe
        id : $scope.invoice_id,
        cost : t,
        currency_id : 1, //ohgd
        debitor_id : $scope.debtor.debitor_id,
        invoice_date: $scope.sale_date,
        seller_id : $scope.verify, //TODO placeholder - this should be derived from appstate (session) or equivelant
        discount: '0', //placeholder
        note : $scope.formatText(),
        posted : '0'
      }

//      Generate Invoice first for foreign key constraints, then create invoice items individually
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

  controllers.controller('purchaseRecordsController', function($scope, $q, $routeParams, connect) {

    var default_purchase = ($routeParams.purchaseID || -1);


    function init() {

      $scope.selected = null;

      var promise = fetchRecords();
      promise
        .then(function(model) {
          //expose scope
          $scope.purchase_model = model;
          //Select default
          if(default_purchase>0) $scope.select(default_purchase);

        });

      $scope.post = function() {
        console.log("Request for post");
//        This could be an arry
        var selected = $scope.selected;
        var request = [];
        /* support multiple rows selected
         if(selected.length>0) {
         selected.forEach(function(item) {
         if(item.posted==0) {
         request.push(item.id);
         }
         });
         }*/
        if(selected) request.push(selected.id);
        //if(selected) request.push({transact ion_id:1, service_id:1, user_id:1});

        connect.journal(request)
          .then(function(res) {
            console.log(res);
//            returns a promise
            if(res.status==200) invoicePosted(request);
          });

        console.log("request should be made for", request);
      }
    }

    $scope.select = function(id) {
      $scope.selected = $scope.purchase_model.get(id);
      console.log('selected', $scope.selected);
    }

    function invoicePosted(ids) {
      var deferred = $q.defer();
      var promise_update = [];
      /*summary
       *   Updates all records in the database with posted flag set to true
       */
      ids.forEach(function(invoice_id) {
        var current_invoice = $scope.invoice_model.get(invoice_id);
        console.log("Updating 'posted'", invoice_id, current_invoice);
        current_invoice.posted = 1;
        promise_update.push(connect.basicPost("sale", [current_invoice], ["id"]));
      });

      console.log(promise_update);
      $q.all(promise_update)
        .then(function(res) {
          console.log("All ids posted");
          deferred.resolve(res);
        });

      return deferred.promise;
    }

    function fetchRecords() {
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'purchase' : {'columns' : ['id', 'cost', 'currency', 'creditor_id', 'discount', 'invoice_date', 'posted']}}})
        .then(function(model) {
          deferred.resolve(model);
        });

      return deferred.promise;
    }


    init();
  });

  controllers.controller('salesRecordsController', function($scope, $q, $routeParams, connect) { 
    console.log("Sale records initialised");

    var default_invoice = ($routeParams.recordID || -1);
    console.log("Got invoice", default_invoice);

    var user_request = connect.basicGet("user_session");


    function init() {

      $scope.selected = null;

      $q.all([fetchRecords(), user_request])
        .then(function(res) {
//          expose scope
          console.log('debug', res[0], res[1])
          $scope.invoice_model = res[0];
          $scope.posting_user = res[1].data.id;
//          select default
          if(default_invoice>0) $scope.select(default_invoice);
        });
    }

    $scope.post = function() {
      console.log("Request for post");
      var INVOICE_TRANSACTION = 2;
//        This could be an arry
      var selected = $scope.selected;
      var request = [];
      /* support multiple rows selected
       if(selected.length>0) {
       selected.forEach(function(item) {
       if(item.posted==0) {
       request.push(item.id);
       }
       });
       }*/
//      FIXME 2 is transaction ID for sales - hardcoded probably isn't the best way
      if(selected) request.push({id: selected.id, transaction_type: INVOICE_TRANSACTION, user: $scope.posting_user});

      connect.journal(request)
        .then(function(res) {
          console.log(res);
//            returns a promise
          if(res.status==200) invoicePosted(request);
        });

      console.log("request should be made for", request);
    }

    $scope.select = function(id) {
      $scope.selected = $scope.invoice_model.get(id);
      console.log('selected', $scope.selected);
    }

    function invoicePosted(ids) {
      var deferred = $q.defer();
      var promise_update = [];
      /*summary
      *   Updates all records in the database with posted flag set to true
      */
      ids.forEach(function(invoice_id) {
        var current_invoice = $scope.invoice_model.get(invoice_id);
        console.log("Updating 'posted'", invoice_id, current_invoice);
        current_invoice.posted = 1;
        promise_update.push(connect.basicPost("sale", [current_invoice], ["id"]));
      });

      console.log(promise_update);
      $q.all(promise_update)
        .then(function(res) {
          console.log("All ids posted");
          deferred.resolve(res);
        });

      return deferred.promise;
    }

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'sale' : {'columns' : ['id', 'cost', 'currency_id', 'debitor_id', 'discount', 'invoice_date', 'posted']}}})
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
      $scope.selected = null;
      $scope.patient_filter = {};

      promise
      .then(function(model) { 
        //FIXME configure locally, then expose
        
        //expose scope 
        $scope.patient_model = filterNames(model); //ng-grid
        //Select default
        if(patient>0) $scope.select(patient);

      }); 
    }

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'patient' : {'columns' : ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2']}}})
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

    $scope.select = function(id) { 
      $scope.selected = $scope.patient_model.get(id);
    }

    init();
  });
    
  //FIXME updates to patient and location broke everything here, update to use that instead
  controllers.controller('patientRegController', function($scope, $q, $location, connect, $modal) {
//    FIXME patient and debtor objects just appear magically in the code - they should be defined and commented with link to template
    console.log("Patient init");
    var patient_model = {};
    var submitted = false;
   
    function init() { 
      //register patient for appcahce namespace
      var default_group = 3 //internal patient

      var location_request = connect.req({'tables' : {'location' : {'columns' : ['id', 'city', 'region']}}});
      //This was if we needed to create alpha-numeric (specific) ID's
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      //Used to generate debtor ID for patient
//      FIXME just take the most recent items from the database, vs everything?
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});
      var debtor_group_request = connect.req({'tables' : {'debitor_group' : {'columns' : ['id', 'name', 'note']}}});

      $q.all([location_request, patient_request, debtor_request, debtor_group_request])
      .then(function(res) { 
        $scope.location_model = res[0];
        $scope.patient_model = res[1];
        $scope.debtor_model = res[2];
        $scope.debtor_group_model = res[3];
        //$scope.location = $scope.location_model.data[0]; //select default

        $scope.debtor = {};
        $scope.debtor.debtor_group = $scope.debtor_group_model.get(default_group);
      });
    }

    function createId(data) {
      console.log(data);
      var search = data.reduce(function(a, b) {a = a.id || a; return Math.max(a, b.id);});
      console.log("found", search);
      if(search.id) search = search.id;
      return search + 1;
    }

    $scope.update = function(patient) {
//      download latest patient and debtor tables, calc ID's and update
      var patient_request = connect.req({'tables' : {'patient' : {'columns' : ['id']}}});
      var debtor_request = connect.req({'tables' : {'debitor' : {'columns' : ['id']}}});

      var patient_model, debtor_model;

//      TODO verify patient data is valid

      $q.all([debtor_request, patient_request])
        .then(function(res) {
          debtor_model = res[0];
          patient_model = res[1];


          patient.id = createId(patient_model.data);
          patient.debitor_id = createId(debtor_model.data);
          console.log("created p_id", patient.id);
          console.log("created id", patient.debitor_id);

          commit(patient);
        });
    }

    function commit(patient) {

      var debtor = $scope.debtor;
      patient_model = patient;

      var format_debtor = {id: patient_model.debitor_id, group_id: $scope.debtor.debtor_group.id};
      console.log("requesting debtor", format_debtor);
      //Create debitor record for patient - This SHOULD be done using an alpha numeric ID, like p12
      // FIXME 1 - default group_id, should be properly defined
      connect.basicPut("debitor", [format_debtor])
      .then(function(res) { 
        //Create patient record
        console.log("Debtor record added", res);
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

    $scope.createGroup = function () {
      var instance = $modal.open({
        templateUrl: "debtorgroupmodal.html",
        controller: function ($scope, $modalInstance) { //groupStore, accountModel
          console.log("Group module initialised");
          /*var group = $scope.group = {},
            clean = {},
            cols = ["id", "name", "symbol", "sales_account", "cogs_account", "stock_account", "tax_account"];

          $scope.accounts = accountModel;

          $scope.submit = function () {
            group.id = groupStore.generateid();
            cols.forEach(function (c) { clean[c] = group[c]; }); // FIXME: AUGHGUGHA
            groupStore.put(group);
            connect.basicPut('inv_group', [clean]);
            $modalInstance.close();
          };

          $scope.discard = function () {
            $modalInstance.dismiss();
          };*/

        },
        resolve: {
          //groupStore: function () { return stores.inv_group; },
          //accountModel: function () { return $scope.models.account; }
        }
      });
    }


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
        fiscal_model.remove(default_fiscal.id);
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
      var account_query = {
        'tables' : {
          'account' : {
            'columns' : ["id", "account_txt", "account_category"]
            }
        },
        'where' : ['account.enterprise_id=' + e_id]
      }
      connect.req(account_query).then(function(model) {
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
      var fiscal_query = {
        'tables' : {
          'fiscal_year' : {
            'columns' : ["id", "fiscal_year_txt"]
          }
        },
        'where' : ['fiscal_year.enterprise_id=' + e_id]
      }
      var deferred = $q.defer();
      connect.req(fiscal_query).then(function(model) {
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
      $scope.fiscal_model.remove($scope.selected_fiscal.id);
      $scope.selected_fiscal = $scope.fiscal_model.data[0];
    };

    $scope.deleteCompare = function(report) { 
      var arr = $scope.budget_model.reports;
      arr.splice(arr.indexOf(report), 1);
      //update fiscal select
      //hard coded bad-ness
      $scope.fiscal_model.post({id : report.id, fiscal_year_txt : report.desc});
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

  
  // Chart of Accounts controllers
  controllers.controller('accountController', function($scope, $q, $modal, connect, appstate) {
    var pre = "[Accounts Ctlr]"; // for DEBUGGING
    console.log(pre, "Initialize..."); 

    function getData () {
      console.log(pre, "getData() fired.");

      var account_defn, account_type_defn, 
          account_store, type_store,
          enterpriseid = appstate.get("enterprise").id;

      account_defn = {
        tables: {
          'account': {
            columns: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_category', 'account_type_id', 'fixed'],
          },
          'account_type': {
            columns: ['type'] 
          }
        },
        join: ['account.account_type_id=account_type.id'],
        where: ["account.enterprise_id=" + enterpriseid],
      };

      account_type_defn = {
        tables: {
          'account_type' : {
            columns: ['id', 'type']
          }
        },
      };
      
      return $q.all([connect.req(account_defn), connect.req(account_type_defn)]);
    }

    function initGrid () {
      console.log(pre, "initGrid fired.");
      var grid, columns, options, dataview;
     
      // dataview config 
      dataview = new Slick.Data.DataView();

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render(); 
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidate(args.rows);
        grid.render();
      });

      columns = [
        {id: "id"       , name: "Account Number"   , field: "id", sortable: true},
        {id: "txt"      , name: "Account Text"     , field: "account_txt", sortable: true},
        {id: "type"     , name: "Account Type"     , field: "type"},
        {id: "category" , name: "Account Category" , field: "account_category"},
        {id: "fixed"    , name: "Fixed/Variable"   , field: "fixed"},
        {id: "locked"   , name: "Locked"           , field: "locked", sortable: true}
      ];

      options = {
        editable             : true,
        autoEdit             : false,
        asyncEditorLoading   : false,
        enableCellNavigation : true,
        forceFitColumns      : true
      };

      grid = new Slick.Grid("#kpk-accounts-grid", dataview, columns, options);

      function sorter (e, args) {
        var field = args.sortCol.field;
        function sort (a, b) { return (a[field] > b[field]) ? 1 : -1; }
        dataview.sort(sort, args.sortAsc);
        grid.invalidate();
      }

      grid.onSort.subscribe(sorter);

      return {grid: grid, dataview: dataview};

    }

    var promise = getData();
 
    $scope.models = {};
    var dataview, grid;

    promise.then(function (a) {
      console.log(pre, "Promise fulfilled.");
      $scope.models.accounts = a[0].data;
      $scope.models.types = a[1].data;
      var setup = initGrid(); 
      grid = setup.grid;
      dataview = setup.dataview;
      
      $scope.$watch('models.accounts', function () {
        console.log(pre, "Rebuilding dataview...");
        dataview.setItems($scope.models.accounts);
      });
    });

    $scope.create = function () {
      var instance = $modal.open({
        templateUrl: "/partials/accounts/templates/chart-modal.html",
        backdrop: true,
        controller: newAccountCtrl,
        resolve: {
          columns: function() {
            return $scope.columns;
          },
        }
      });

      instance.result.then(function(values) {
        $scope.model.push(values);
      }, function() {});
    };


    function newAccountCtrl ($scope, $modalInstance, columns) {
       var values = angular.copy(columns);
      $scope.values = values;
      $scope.close = function() {
        $modalInstance.dismiss();
      };
      $scope.submit = function() {
        // TODO: include validation
        $modalInstance.close($scope.values);
      };
    }

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


  controllers.controller('inventoryRegisterController', function ($scope, appstate, connect, $q, $modal) {

    var account_defn, inv_unit_defn, inv_group_defn, inv_defn, inv_type_defn;
    var eid = appstate.get('enterprise').id;

    account_defn= {
      tables: {'account': {columns: ['enterprise_id', 'id', 'locked', 'account_txt', 'account_type_id']}},
      where: ["account.enterprise_id=" + eid]
    };

    inv_unit_defn = {
      tables : {'inv_unit': { columns: ["id", "text"] }}
    };

    inv_group_defn = {
      tables: {'inv_group': { columns: ['id', 'name', 'symbol', 'sales_account', 'cogs_account', 'stock_account', 'tax_account']}}
    };

    inv_defn = {
      tables: {'inventory': { columns: ['enterprise_id', 'id', 'code', 'text', 'price', 'group_id', 'unit_id', 'unit_weight', 'unit_volume', 'stock', 'stock_max', 'stock_min', 'consumable']}},
      where: ["inventory.enterprise_id=" + eid]
    };

    inv_type_defn = {
      tables: {'inv_type': { columns: ['id', 'text']}}
    };

    $q.all([
      connect.req(account_defn),
      connect.req(inv_unit_defn),
      connect.req(inv_group_defn),
      connect.req(inv_type_defn),
      connect.req(inv_defn)
    ]).then(init);

    var stores = {},
      models = ['account', 'inv_unit', 'inv_group', 'inv_type', 'inventory'],
      item;
    $scope.models = {};
    $scope.item = item = {};

    function init(arr) {
      for (var i = 0, l = arr.length; i < l; i++) {
        stores[models[i]] = arr[i];
        $scope.models[models[i]] = arr[i].data;
      }

      item.unit_weight = 0;
      item.unit_volume = 0;
      item.enterprise_id = 101; // FIXME:
    }

    function reset () {
      $scope.item = item = {};
      item.unit_weight = 0;
      item.unit_volume = 0;
    }

    $scope.submit = function () {
      if ($scope.inventory.$valid) {
        item.id = stores.inventory.generateid(); 
        stores.inventory.put(item);
        console.log("item:", item);
        item.enterprise_id = appstate.get("enterprise").id;
        connect.basicPut('inventory', [item]);
        reset();
      } else {
        for (var k in $scope.inventory) {
          if ($scope.inventory[k].$invalid) {
            $scope.invalid[k] = "true"; 
            // TODO: make css classes depend on this. Color
            // red for error on each input if $invalid.
          } 
        }
      }
    };

    $scope.logStore = function () {
      console.log(stores.inv_group.data); 
    };

    // New Type Instance Modal/Controller
    $scope.newUnitType = function () {
      var instance = $modal.open({
        templateUrl: 'unitmodal.html',
        controller: function($scope, $modalInstance, unitStore) {
          var unit = $scope.unit = {};
          $scope.units = unitStore.data;

          $scope.submit = function () {
            // validate
            $scope.unit.id = unitStore.generateid();
            if (unit.text) {
              // process
              var text = unit.text.toLowerCase();
              text = text[0].toUpperCase() + text.slice(1);
              unit.text = text;
              unitStore.put(unit);
              connect.basicPut('inv_unit', [{id: unit.id, text: unit.text}]); //FIXME: AUGHAUGH
              $modalInstance.close();
            }
          };

          $scope.discard = function () {
            $modalInstance.dismiss(); 
          };

        },
        resolve: {
          unitStore: function() { return stores.inv_unit; }
        }
      });

      instance.result.then(function () {
        console.log("Submitted Successfully.");
      }, function () {
        console.log("Closed Successfully."); 
      });
    };

    $scope.newInventoryGroup = function () {
      var instance = $modal.open({
        templateUrl: "inventorygroupmodal.html",
        controller: function ($scope, $modalInstance, groupStore, accountModel) {
          var group = $scope.group = {},
            clean = {},
            cols = ["id", "name", "symbol", "sales_account", "cogs_account", "stock_account", "tax_account"];

          $scope.accounts = accountModel;

          $scope.submit = function () {
            group.id = groupStore.generateid();
            cols.forEach(function (c) { clean[c] = group[c]; }); // FIXME: AUGHGUGHA
            groupStore.put(group);
            connect.basicPut('inv_group', [clean]);
            $modalInstance.close();
          };

          $scope.discard = function () {
            $modalInstance.dismiss(); 
          };

        },
        resolve: {
          groupStore: function () { return stores.inv_group; },
          accountModel: function () { return $scope.models.account; }
        }
      });

      instance.result.then(function () {
        console.log("Submitted Successfully.");
      }, function () {
        console.log("Closed Successfully."); 
      });
    };

    $scope.reset = function () {
      reset(); 
    };

  });

  controllers.controller('cashController', function($scope, connect, $q, $filter, $http, appstate) {

    var enterprise_defn, account_spec,
        cash_currency_defn, sale_debitor_defn,
        currency_defn, 
        eid = appstate.get('enterprise').id;

    enterprise_defn = {
      tables: { 'enterprise' : {columns: ["id", "cash_account"]}},
      where: ["enterprise.id=" + eid] 
    };
    
    sale_debitor_defn = {
      primary: "sale",
      tables: {
        "sale" : {
          columns: ["id", "cost", "currency_id", "debitor_id", "seller_id", "discount", "invoice_date", "note", "paid"] 
        },
        "debitor" : {
          columns: ["group_id"] 
        },
        "debitor_group" : {
          columns: ["account_number"] 
        }
      },
      join: ["sale.debitor_id=debitor.id", "debitor.group_id=debitor_group.id"],
      where: ["sale.enterprise_id=101", "AND", "sale.paid=0"]
    };

    cash_currency_defn = {
      tables: {
        "cash" : {
          columns: ["id", "bon", "bon_num", "invoice_id", "date", "debit_account", "credit_account", "amount", "currency_id", "cashier_id", "text"]
        },
        "currency": { columns: ["symbol"] }
      },
      join: ["cash.currency_id=currency.id"]
    };

    currency_defn = {
      tables : { "currency" : { columns: ["id", "symbol"] } } 
    };

    $q.all([
      connect.req(enterprise_defn),
      connect.req(sale_debitor_defn),
      connect.req(cash_currency_defn),
      connect.req(currency_defn)
    ]).then(init);


    var stores = {},
        models = ['enterprise', 'sale-debitor', 'cash-currency', 'currency'];


    var slip = $scope.slip = {};
    $scope.models = {};

    function init (arr) {
      // init all data connections & models
      for (var i = 0, l = arr.length; i < l; i++) {
        stores[models[i]] = arr[i];
        $scope.models[models[i]] = arr[i].data;
      }

      // FIXME: doesn't work yet
      $scope.$watch("models['cash-currency']", function () {
        $scope.hasCash = $scope.models['cash-currency'].length > 0;
      });

      $scope.$watch("models['sale-debitor']", function () {
        $scope.hasSale = $scope.models['sale-debitor'].length > 0;
      });
       
      defaults();
    }

    function defaults () {
      // incriment the max id in the store

      var id  = Math.max.apply(Math.max, Object.keys(stores['cash-currency'].index)) + 1;
      if (id < 0) { id = 0; }
      slip.id = id;

      // Module-dependent flag to say what cashbox this is
      slip.cashbox_id = 1;

      // default debit account is cash box
      slip.debit_account = stores.enterprise.get(eid).cash_account;

      // default date is today
      slip.date = $filter('date')(new Date(), 'yyyy-MM-dd');

      // default currency
      slip.currency_id = 1;

      // we start up as entree
      slip.bon = "E";

      // generate a new number for the bons 
      slip.bon_num = getBonNumber($scope.models['cash-currency'], slip.bon);

      // default text
      slip.text = "Payment";

      // FIXME: get this from a service
      slip.cashier_id = 1;

      //just for the test, it will be changed
      slip.enterprise_id = 101;
    }

    $scope.select = function (id) {
      slip.invoice_id = id || slip.invoice_id;
      slip.text = "Payment"; // FIXME: find a way to wipe clicks
      var selected_invoice = stores['sale-debitor'].get(slip.invoice_id);
      // fill in selected data
      slip.credit_account = selected_invoice.account_number;
      slip.text += " of invoice " + selected_invoice.id + " for " + $filter('currency')(selected_invoice.cost);
    };

    $scope.formatCurrency = function (id) {
      // deal the the asynchronous case where store is not
      // defined.
      if (stores.currency) {
        return stores.currency.get(id).symbol;
      }
    };

    $scope.setCurrency = function (idx) {
      // store indexing starts from 0.  DB ids start from 1
      slip.currency_id = idx + 1; 
    };

    $scope.validate = function () {
      var fields = ["enterprise_id","bon", "bon_num", "text", "cashier_id", "date", "currency_id", "cashbox_id", "invoice_id", "id", "credit_account", "debit_account", "amount"];
      var obj = {};
      fields.forEach(function (f) { obj[f] = slip[f]; });
      //stores['cash-currency'].put(obj);
      connect.basicPut('cash', [obj]);
      stores['sale-debitor'].remove(slip.invoice_id);
      connect.basicPost('sale', [{id: slip.invoice_id, paid: 1}], ["id"]);
      // FIXME: improve this
      connect.journal([{id:slip.id, transaction_type:1, user:1}]); //a effacer just for the test
      $scope.hasCash = true;
      $scope.submitted = true; 
      // FIXME: make this formal for posting to the journal
      // FIXME: fiscal year
      $scope.clear();
    };

    function getBonNumber (model, bon_type) {
      // filter by bon type, then gather ids.
      var ids = model.filter(function(row) {
        return row.bon === bon_type; 
      }).map(function(row) {
        return row.bon_num;
      });

      if (ids.length < 1) { return 1; }
      else {
        // Maximum of the bon number, incrimented
        return Math.max.apply(Math.max, ids) + 1;
      }
    }

    $scope.clear = function () {
      slip = $scope.slip = {};
      $scope.chosen = -1;
      defaults();
      $scope.submitted = false;
    };

    $scope.selectPaid = function (id) {
      $scope.paid_id = id;
    };

  });

 //***************************************************************************************
//******************** JOURNAL CONTROLLER ************************************************
//***************************************************************************************
controllers.controller('journalController', function($scope, $timeout, $q, connect){

  $scope.model = {};
  $scope.model['journal'] = {'data' : []};

//  Request
  var journal_request = {
    'tables' : {
      'posting_journal' : {
        'columns' : ["id", "transID", "transDate", "docNum", "description", "account_id", "debitAmount", "creditAmount", "currency_id", "arapAccount", "arapType", "invPoNum", "debitEquiv", "creditEquiv"]
      }
    }
  }

//  grid options
  var grid;
  var dataview;
  var columns = [
    {id: 'transID', name: 'ID', field: 'transID', sortable: true},
    {id: 'transDate', name: 'Date', field: 'transDate'},
    {id: 'docNum', name: 'Doc No.', field: 'docNum'},
    {id: 'description', name: 'Description', field: 'description'},
    {id: 'account_id', name: 'Account ID', field: 'account_id'},
    {id: 'debitAmount', name: 'Debit', field: 'debitAmount', groupTotalsFormatter: totalFormat},
    {id: 'creditAmount', name: 'Credit', field: 'creditAmount', groupTotalsFormatter: totalFormat},
    {id: 'arapAccount', name: 'AR/AP Account', field: 'arapAccount'},
    {id: 'arapType', name: 'AR/AP Type', field: 'arapType'},
    {id: 'invPoNum', name: 'Inv/PO Number', field: 'invPoNum'}
  ];
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    rowHeight: 35
  };

  function init() {

    connect.req(journal_request).then(function(res) {
      $scope.model['journal'] = res;

      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      dataview = new Slick.Data.DataView({
        groupItemMetadataProvider: groupItemMetadataProvider,
        inlineFilter: true
      });
      grid = new Slick.Grid('#journal_grid', dataview, columns, options);

      grid.registerPlugin(groupItemMetadataProvider);
//      Cell selection
//      grid.setSelectionModel(new Slick.CellSelectionModel());

      dataview.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataview.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
      });

//      Set for context menu column selection
//      var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);
      dataview.beginUpdate();
      dataview.setItems($scope.model['journal'].data);
//      $scope.groupByID()
      dataview.endUpdate();
      console.log("d", dataview);
      console.log("d.g", dataview.getItems());

    })

  }

  $scope.groupByID = function groupByID() {
    dataview.setGrouping({
      getter: "transID",
      formatter: function (g) {
        return "<span style='font-weight: bold'>" + g.value + "</span> (" + g.count + " transactions)</span>";
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debitAmount"),
        new Slick.Data.Aggregators.Sum("creditAmount")
      ],
      aggregateCollapsed: false
    });
  }

  $scope.groupByAccount = function groupByAccount() {
    dataview.setGrouping({
      getter: "account_id",
      formatter: function(g) {
        return "<span style='font-weight: bold'>" + g.value + "</span>"
      },
      aggregators: [
        new Slick.Data.Aggregators.Sum("debitAmount"),
        new Slick.Data.Aggregators.Sum("creditAmount")
      ],
      aggregateCollapsed: false
    });
  }

  $scope.removeGroup = function removeGroup() {
    dataview.setGrouping({});
  }

  function totalFormat(totals, column) {

    var format = {};
    format['Credit'] = '#02BD02';
    format['Debit'] = '#F70303';

    var val = totals.sum && totals.sum[column.field];
    if (val != null) {
      return "<span style='font-weight: bold; color:" + format[column.name] + "'>" + ((Math.round(parseFloat(val)*100)/100)) + "</span>";
    }
    return "";
  }

  //good lawd hacks
  //FIXME: without a delay of (roughly)>100ms slickgrid throws an error saying CSS can't be found
//  $timeout(init, 100);
  init();
});
//***************************************************************************************
//***************************** CREDITORS CONTROLLER ************************************
//***************************************************************************************

controllers.controller('creditorsController', function($scope, $q, $modal, kpkConnect){

  //initialisations
  $scope.creditor={};
  $scope.creditorExiste = 0;
  
  //populating creditors
  getCreditors();

  //populating group
  getGroups();

  //populating location
  getLocations();

  //les fonctions
  function getCreditors(){
    var req_db = {};

    req_db.e = [{t:'supplier', c:['id', 'name', 'address1', 'address2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.creditors = data;
    });
  }
  function getGroups(){
    var req_db = {};
    req_db.e = [{t:'creditor_group', c:['id', 'group_txt', 'account_id']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.groups = data;
    });
  }

  function getLocations(){
    var req_db = {};

    req_db.e = [{t:'location', c:['id', 'city', 'region']}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      $scope.locations = data;
    });
  }

  $scope.showDialog = function() {
    var instance = $modal.open({
    templateUrl: "/partials/creditor/creditor-modal.html",
    backdrop: true,
    controller: function($scope, $modalInstance, selectedAcc, kpkConnect) {
      $scope.group = {};
      //populating accounts
      getAccounts();
      function getAccounts(){
        var req_db = {};
        req_db.e = [{t:'account', c:['id', 'account_txt']}];
        req_db.c = [{t:'account', cl:'locked', z:'=', v:0, l:'AND'}, {t:'account', cl:'id', z:'>=', v:400000, l:'AND'}, {t:'account', cl:'id', z:'<', v:500000}];
        kpkConnect.get('/data/?', req_db).then(function(data){
          $scope.accounts = data;
        });
      }       
        
      $scope.close = function() {
        $modalInstance.dismiss();
      };
      $scope.submit = function() {
        $modalInstance.close({group:$scope.group.group, account:$scope.group.account_id});
      };
    },
    resolve: {
      selectedAcc: function() {
        return 'hello';
      },
    }
    });
    instance.result.then(function(values) {
      kpkConnect.send('creditor_group', [{id:'', group_txt:values.group, account_id:values.account.id}]);
      getGroups();
    }, function() {
      //console.log('dedrick');
    });
  };

  $scope.verifyExisting = function(){
   if($scope.creditorExiste ==0){
       if($scope.creditor.name){
        if(isThere($scope.creditors, 'name', $scope.creditor.name)){
          var req_db = {};
          req_db.e = [{t:'supplier', c:['id', 'name', 'address1', 'address2', 'location_id', 'creditor_id', 'email', 'fax', 'note', 'phone', 'international', 'locked']}];
          req_db.c = [{t:'supplier', cl:'name', z:'=', v:$scope.creditor.name}];
          kpkConnect.get('/data/?', req_db).then(function(data){
           if(data.length>0){
            var id_promise = getCreditorGroupId(data[0].creditor_id);
            id_promise.then(function(value){
              $scope.creditor_group = getCreditorGroup(value.id);
            });
            data[0].location_id = getCreditorLocation(data[0].location_id);
            data[0].international = toBoolean(data[0].international);
            data[0].locked = toBoolean(data[0].locked);
            $scope.creditor = data[0];
            $scope.creditorExiste = 1;
           }        
          });
        }
      }
   }
  }

  $scope.fill = function(index){
    //getCreditors();
    $scope.creditorExiste = 0;
    $scope.creditor = $scope.creditors[index];
    $scope.creditor.international = toBoolean($scope.creditor.international);
    $scope.creditor.locked = toBoolean($scope.creditor.locked);
    $scope.creditor.location_id = getCreditorLocation($scope.creditors[index].location_id);
    var id_promise = getCreditorGroupId($scope.creditors[index].creditor_id);
    id_promise.then(function(value){
      $scope.creditor_group = getCreditorGroup(value.id);
    });
  }

  $scope.save = function(creditor, creditor_group){
    creditor.location_id = extractId(creditor.location_id);
    var creditor_group_id = extractId(creditor_group);
    var result = existe(creditor.id);
    result.then(function(response){
      if(response){             

        var sql_update = {t:'supplier', data:[creditor],pk:["id"]};
        kpkConnect.update(sql_update);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
      }else{
        //on insert
        var creditor_id_promise = getCreditorId(creditor_group_id);
        creditor_id_promise.then(function(value){
          creditor.creditor_id = value;
          kpkConnect.send('supplier', [creditor]);
        $scope.creditor={};
        $scope.creditor_group = {};
        $scope.creditorExiste = 0;
        getCreditors();
        });
      }
      
    });
  }

  function getCreditorId(id){
    var def = $q.defer();
    kpkConnect.send('creditor', [{id:'', creditor_group_id:id}]);
    var request = {}; 
    request.e = [{t : 'creditor', c : ['id']}];
    request.c = [{t:'creditor', cl:'id', v:'LAST_INSERT_ID()', z:'='}];
    kpkConnect.get('data/?',request).then(function(data) {
      console.log(data);
      def.resolve(data[0].id);

    });
    return def.promise;
  }

  function existe(id){
    var def = $q.defer();
    if(id){
      var request = {}; 
      request.e = [{t : 'creditor', c : ['id']}];
      request.c = [{t:'creditor', cl:'id', v:id, z:'='}];
      kpkConnect.get('data/?',request).then(function(data) {
       (data.length > 0)?def.resolve(true):def.resolve(false);    
      });
    }else{
      def.resolve(false);
    }
    return def.promise;
  }

  function toBoolean(number){
    return number>0;
  }

  function extractId(obj){
    return obj.id;
  }

  function getCreditorLocation(idLocation){
    var indice = -1;
    for(var i = 0; i<$scope.locations.length; i++){
      if($scope.locations[i].id == idLocation){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.locations[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroup(idGroup){
    var indice = -1;
    for(var i = 0; i<$scope.groups.length; i++){
      if($scope.groups[i].id == idGroup){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return $scope.groups[indice];
    }else{
      return {};
    }
  }

  function getCreditorGroupId(idCreditor){
    var def = $q.defer();    
    var req_db = {};
    req_db.e = [{t:'creditor', c:['creditor_group_id']}];
    req_db.c = [{t:'creditor', cl:'id', z:'=', v:idCreditor}];
    kpkConnect.get('/data/?', req_db).then(function(data){
      var groupID = data[0].creditor_group_id;
      req_db.e = [{t:'creditor_group', c:['id']}];
      req_db.c = [{t:'creditor_group', cl:'id', z:'=', v:groupID}];
      kpkConnect.get('/data/?', req_db).then(function(data){
      def.resolve(data[0]);
      });
    });
    return def.promise;
  }

  function isThere(jsontab, cle, value){
    var indice = -1;
    for(var i = 0; i<jsontab.length; i++){
      if(jsontab[i][cle] == value){
        indice = i;
        break;
      }
    }
    if (indice!=-1){
      return true;
    }else{
      return false;
    }
  }

  $scope.delete = function(creditor){

    kpkConnect.delete('supplier', creditor.id);
    $scope.creditor = {};
    getCreditors();
  }
 });

controllers.controller('notifyController', function($scope, $q, appnotify) {
  /*summary
  *   Displays the model for any notification pushed to the appnotify service
  */
  console.log("notify controller initialised");

//  Notify controller must watch the model from the service and display accordingly
  $scope.notification = appnotify.notification;
  $scope.style = appnotify.style[0];

  $scope.removeNotification = function() {
//    Would need to remove with ID for multiple notifications
    appnotify.clearAll();
  }

});

controllers.controller('purchaseOrderController', function($scope, $q, connect, appstate, appnotify) {
  console.log("Inventory invoice initialised");

//  FIXME There is a lot of duplicated code for salesController - is there a better way to do this?
//  FIXME Resetting the form maintains the old invoice ID - this causes a unique ID error, resolve this
  $scope.sale_date = getDate();
  $scope.inventory = [];

  $scope.process = ["PO", "QUOTE"];
  $scope.current_process = $scope.process[0];

  $scope.purchase_order = {payable: "false"};

  var inventory_query = {
    'tables' : {
      'inventory' : {
        'columns' : [
          'id',
          'code',
          'text',
          'price',
          'type_id'
        ]
      }
    },
    'where' : [
      'inventory.type_id=0'
    ]
  }
  var inventory_request = connect.req(inventory_query);


  var sales_request = connect.req({'tables' : {'sale' : { 'columns' : ['id']}}});
  var purchase_request = connect.req({'tables' : {'purchase' : { 'columns' : ['id']}}});

  var creditor_query = {
    'e' : [{
      t : 'supplier',
      c : ['id', 'name', 'location_id', 'creditor_id']
    }, {
      t : 'location',
      c : ['city', 'region', 'country_id']
    }],
    'jc' : [{
      ts : ['location', 'supplier'],
      c : [ 'id', 'location_id']
    }]
  };

  var creditor_request = connect.basicReq(creditor_query);
  var user_request = connect.basicGet("user_session");

  function init() {

    $scope.inventory = [];
    $scope.purchase_order.payable = "false";
    $scope.creditor = "";

    $q.all([
      inventory_request,
      sales_request,
      purchase_request,
      creditor_request,
      user_request

    ]).then(function(a) {
      $scope.inventory_model = a[0];
      $scope.sales_model = a[1];
      $scope.purchase_model = a[2];
      $scope.creditor_model = a[3];
      $scope.verify = a[4].data.id;

      console.log($scope.verify, a[4]);
//      Raw hacks - #sorry, these might be the same entity anyway
//      TODO use SQL to determine highest ID - NOT pulling down all ids and manually parsing
      var ids = $scope.sales_model.data.concat($scope.purchase_model.data);

      var invoice_id = createId(ids);
        console.log("got new ID", invoice_id);
      $scope.invoice_id = invoice_id;
    });
  }

  function getDate() {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + ('0' + now.getDate()).slice(-2);
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
  }

  function formatInvoice() {
    var t = 0;
    for(var i= 0, l = $scope.inventory.length; i < l; i++) {
      t += $scope.inventory[i].quantity * $scope.inventory[i].price;
    }
//    verify total

    var format = {
      enterprise_id : appstate.get("enterprise").id, //Not async safe - may return null
      id : $scope.invoice_id,
      cost : t,
      currency_id : 1, // FIXME
      creditor_id : $scope.creditor.id,
      invoice_date : $scope.sale_date,
      purchaser_id : $scope.verify,
      note : $scope.formatText(),
      posted : '0'
    };
//    verify format
    return format;
  }

  function generateItems() {
    var deferred = $q.defer();
    var promise_arr = [];

    //iterate through invoice items and create an entry to sale_item
    $scope.inventory.forEach(function(item) {
      var format_item = {
        purchase_id : $scope.invoice_id,
        inventory_id : item.item.id,
        quantity : item.quantity,
        unit_price : item.price,
        total : item.quantity * item.price
      };
      console.log("Generating sale item for ", item);

      promise_arr.push(connect.basicPut('purchase_item', [format_item]));
    });

    $q.all(promise_arr).then(function(res) { deferred.resolve(res)});
    return deferred.promise;
  }

  $scope.submitPurchase = function() {
    var purchase = formatInvoice();

    console.log("Posting", purchase, "to 'purchase table");

    connect.basicPut('purchase', [purchase])
      .then(function(res) {
        if(res.status==200) {
          var promise = generateItems();
          promise
            .then(function(res) {
              console.log("Purchase order successfully generated", res);
              appnotify.setNotification("error", "tilte", "Purchase order generated - link", 3000);
              connect.journal([{id:$scope.invoice_id, transaction_type:3, user:1}]); //just for the test, send data to the journal traget server-side
//              Navigate to Purchase Order review || Reset form
//              Reset form
                init();

            });
        }
      });
  }

  $scope.updateItem = function(item) {

    if(item.item) {
      if(!item.quantity) item.quantity = 1;
      item.text = item.item.text;
      item.price = item.item.price;
    } else {
//      Reset
      item.text = "";
      item.price = "";
      item.quantity = "";
    }
  }

  $scope.updateInventory = function() {
    $scope.inventory.push({});
  }

  $scope.formatText = function() {
//      FIXME String functions within digest will take hours and years
    var c = "PO " + $scope.invoice_id + "/" + $scope.sale_date;
    if($scope.creditor) c += "/" + $scope.creditor.name + "/";
    return c;
  }



//  Radio inputs only accept string true/false? boolean value as payable doesn't work
  $scope.isPayable = function() {
    if($scope.purchase_order.payable=="true") return true;
    return false;
  };

  // FIXME Again - evaluated every digest, this is a bad thing
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

  $scope.itemsInInv = function() {
    if($scope.inventory.length>0) return true;
    return false;
  }

  $scope.select = function(index) {
    $scope.current_process = $scope.process[index];
  }

  $scope.formatCreditor = function(creditor) {
    return creditor.name;
  }

  init();


});


controllers.controller('priceListController', function ($scope, $q, connect, appstate) {
  var pln, pl, grp, inv, eid, models, validate, stores, dirty, flags, dependencies, changes;

  // FIXME: Eventually move away form this method of getting enterprise id
  // so that we can refresh when the enterprise changes
  eid = appstate.get('enterprise').id;

  // price list names
  pln = {
    tables: { 'price_list_name' : { columns :  ["id", "name"] }},
    where : ["price_list_name.enterprise_id="+eid]
  };

  // inventory
  inv = {
    tables : { 'inventory' : { columns: ["id", "code", "text"] }} 
  };
  
  // inventory group
  grp = { 
    tables : { 'inv_group' : { columns: ["id", "name", "symbol"] }}
  };

  // price list 
  pl = {
    tables: { 'price_list' : { columns : ["id", "list_id", "inventory_id", "price", "discount", "note"] }},
    where : []
  };

  // initialize models
  models       = $scope.models = {};
  flags        = $scope.flags  = {};
  dirty        = $scope.dirty  = {};
  validate     = $scope.validate = {};
  flags.edit   = {};
  flags.errors = {};
  stores       = {};
  dependencies = ["plnames", "inv", "grp"];

  $q.all([
    connect.req(pln),
    connect.req(inv),
    connect.req(grp)
  ]).then(function (arr) {
    // load dependencies
    for (var i = arr.length - 1; i >= 0; i--) {
      models[dependencies[i]] = arr[i].data;
      stores[dependencies[i]] = arr[i];
    }
    flags.edit.list = Infinity;
  });

  // List controls

  // create a new price list
  $scope.addList = function () {
    var id, list;
    id = stores.plnames.generateid();
    list = {id: id};
    stores.plnames.put(list);
    // after creating, immediately edit
    $scope.editList(id);
  };

  // validate and save
  $scope.saveList = function () {
    var id = flags.edit.list;
    var list = stores.plnames.get(id);
    if (!validate.list(list)) stores.plnames.delete(id);
    else {
      list.enterprise_id = eid;
      connect.basicPut('price_list_name', [list]);
    }
    flags.edit.list = Infinity;
  };

  // edit a list
  $scope.editList = function (id) {
     flags.edit.list = id;
  };

  // load a specific price list
  $scope.loadList = function (id) {
    if (flags.edit.list === Infinity) {
      console.log("loading list");
      pl.where = ["price_list.list_id=" + id];
      connect.req(pl).then(function (res) {
        models.pl = res.data;
        stores.pl = res;
      });
      flags.list = id;
      flags.add = true;
    }
  };

  // Item controls
  
  // remove an item from the price list
  $scope.removeItem = function (id) {
    flags.add = true;
    stores.pl.delete(id);
  };

  // add an item to the price list
  $scope.addItem = function () {
    var id = stores.pl.generateid();
    stores.pl.put({id: id, list_id: flags.list});
    $scope.editItem(id);
  };
 
  // edit an item in the price list 
  $scope.editItem = function (id) {
    flags.edit.item = id;
    flags.add = false;
  };

  // label the inventory properly
  $scope.label = function (invid) {
    // sometimes it is not defined
    var item = invid ? stores.inv.get(invid) : {};
    return (item && item.text) ? item.text : "";
  };

  // validate and exit editing
  $scope.saveEdit = function () {
    var item = stores.pl.get(flags.edit.item);
    if (validate.item(item)) { 
      flags.edit.item = Infinity; 
      flags.add = true;
    }
  };

  // filter controls
  $scope.filter = function (id) {
    flags.filter = id >= 0 ? stores.grp.get(id).symbol : "";
    refreshInventory();
  };

  function refreshInventory () {
    var inv = { tables : { 'inventory' : { columns: ["id", "code", "text"] }}};
    if (flags.filter) {
      inv.where = ["inventory.group_id="+flags.filter];
    }
    connect.req(inv).then(function (res) {
      models.inv = res.data;
      stores.inv = res;
    });
  }

  // validation

  // validate item
  validate.item = function (item) {
    // an item must have ether a price or a 
    // discount, but not both
    var bool = !!item.id && !!item.inventory_id && ((!!item.price || !!item.discount) && !(!!item.price && !!item.discount));
    return bool;
  };

  validate.list = function (list) {
    // a list must have all fields filled out
    var bool = !!list.id && !!list.name;
    return bool;
  };

  // form controls

  $scope.save = function () {
    // TODO: do all this with connect
    // stores
    function clean (obj) {
      var cln = {};
      for (var k in obj) {
        if (k !== "hashkey") {
          cln[k] = obj[k]; 
        } 
      }
      return cln;
    }

    var data = models.pl.map(clean);
    console.log("saving:", data);
    connect.basicPut('price_list', data);
  };

  $scope.erase = function () {
    // TODO: add a user warning before doing this..
    models.pl.forEach(function (i) {
      stores.pl.delete(i.id); 
    });
  };

});

})(angular);
