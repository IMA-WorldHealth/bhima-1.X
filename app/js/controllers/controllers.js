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

    };

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
  var e = [{t : 'transaction', c : ['desc', 'date', 'rate']},
           {t:'infotransaction', c:['id', 'account_id', 'transaction_id', 'debit', 'credit']},
           {t:'currency', c:['symbol']},
           {t:'account', c:['account_type_id']}
          ],
      jc = [{ts:['transaction', 'infotransaction'], c:['id', 'transaction_id'], l:'AND'},
            {ts: ['account', 'infotransaction'], c:['id', 'account_id'], l:'AND'},
            {ts: ['currency', 'transaction'], c:['id', 'currency_id']}
           ];/*,
      c = [{t : 'infotransaction', cl: 'account_id', v : param.IDAccount, z : '=', l : 'AND'},
           {t : 'transaction', cl : 'date', v : convertToMysqlDate(param.dateFrom), z : '>=', l : 'AND'},
           {t : 'transaction', cl : 'date', v : convertToMysqlDate(param.dateTo), z : '<='}
          ]*/;


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
      req_db.e = [{t : 'transaction', c : ['desc', 'date', 'rate']},
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
          data[i]['date'] = bikaUtilitaire.formatDate(data[i].date);
        }
        $scope.infostran = data;
        console.log($scope.infostran);
      });
    }
  if(enterpriseID && fiscalID && periodID){
    fillAccount(enterpriseID);
    fillDateFrom(fiscalID);
    fillDateTo(fiscalID);
    fillTable(periodID);
  }
    
  
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

  resp
  .then(function(enterprise_id) { 
    return fillFiscalSelect(enterprise_id);
  })
  .then(function(fiscal_id) { 
    fillPeriod(fiscal_id);
  });

  //remplissage selects
  function fillEntrepriseSelect(){
    var deferred = $q.defer();
    var req_db = {};
    req_db.e = [{t:'enterprise', c:['id', 'name', 'region']}];
    bikaConnect.get('/data/?', req_db).then(function(data){
      $scope.enterprise_model = data;
      $scope.e_select = $scope.enterprise_model[0];
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
      $scope.f_select = $scope.fiscal_model[0];
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
      $scope.p_select = $scope.period_model[0];
    });
  }
  //fin remplissage selects
  
  //FIXME: ideally all of logic should be within appstate, simply setting this value would keep it updated
  $scope.$watch('e_select', function(nval, oval) { 
    if(nval) { 
      //Update appstate
      appstate.update('enterprise', nval);
      //Update other selects
      fillFiscalSelect(nval.id);
    }
  });

  $scope.$watch('f_select', function(nval, oval) { 
    if(nval) { 
      //Update appstate
      appstate.update('fiscal', nval);
      //Update other selects
      fillPeriod(nval.id);
    }
  });


  //Logout button logic - page currently being viewed can be saved
});

controllers.controller('appController', function($scope, appcache) { 
    console.log("Application controller fired");

    //Navigate to page that was previously open
    //Listen for page exit and save page
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
      })
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

    }

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

    function fetchPeriods(fiscal_id) { 
      connect.req("period", ["id", "period_start", "period_stop"], "fiscal_year_id", fiscal_id).then(function(model) { 
        $scope.period_model = model.data;
      });
    }

    //Initialise after scope etc. has been set
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
          c : ['id', 'enterprise_id', 'account_id', 'period_id', 'budget']
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
    } 

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
    }

    $scope.compare = function() { 
      console.log("compare");
      $scope.budget_model.reports.push({id : $scope.selected_fiscal.id, desc : $scope.selected_fiscal.fiscal_year_txt, model : {}});
      $scope.select($scope.selected_account.id);
      console.log("cmp", $scope.selected_fiscal);
      $scope.fiscal_model.delete($scope.selected_fiscal.id);
      $scope.selected_fiscal = $scope.fiscal_model.data[0];
    }

    $scope.deleteCompare = function(report) { 
      var arr = $scope.budget_model.reports;
      arr.splice(arr.indexOf(report), 1);
      //update fiscal select
      //hard coded bad-ness
      $scope.fiscal_model.put({id : report.id, fiscal_year_txt : report.desc});
      $scope.selected_fiscal = $scope.fiscal_model.get(report.id);
    }

    $scope.validSelect = function() { 
      //ugly
      if($scope.fiscal_model) { 
        if($scope.fiscal_model.data.length > 0) { 
          return false;
        } 
      }
      
      return true;
    }

    init();
  });

  controllers.controller('organisationController', function($scope, connect) { 

    connect.basicReq({
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
    }).then(function(res) {
      $scope.org_model = res.data;
    });

    
    $scope.select = function(index) { 
      console.log(index, "selected");
      console.log($scope.org_model[index]);
      $scope.selected = $scope.org_model[index];
      $scope.selectedIndex = index;
    };

    $scope.sort = function (col) {
      console.log('model:', $scope.org_model);

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


  controllers.controller('socketController', function($scope, data) {

    var options = {
      identifier : 'id',
      table      : 'account',
      columns    : ['id', 'account_txt']
    };

    var store = data.register(options);

    store.ready().then(function() {
      // data loaded
      $scope.model = store.data;

      $scope.removeOne = function() {
        store.remove($scope.selected);
      };

      $scope.sync = function () {
        store.sync(); 
      };

      $scope.select = function(id) {
        $scope.selected = id;
      };

    });

  });

})(angular);
