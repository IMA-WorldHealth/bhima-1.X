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

//      Set default element state
      element.collapsed = true;
//      console.log(appcache.checkDB());

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

//***********************************************************************************
//********************** UTIL CONTROLLER ********************************************
//***********************************************************************************
 
controllers.controller('utilController', function($rootScope, $scope, $q, $translate, kpkConnect, appstate, kpkUtilitaire) { 
  /////
  // summary: 
  //  Responsible for all utilities (buttons/ selects etc.) on the application side bar
  //  
  // TODO 
  //  -All operations on models should be local, and then exposed to scope
  //  -Should use connect instead of kpkConnect (soon to be deleted)
  /////

  $scope.toggleTranslate = function toggleTranslate(key) { 

    $translate.uses(key);
  }
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



  //Logout button logic - page currently being viewed can be saved
controllers.controller('appController', function($scope, $location, appcache) { 
    console.log("Application controller fired");

    var url = $location.url();


    console.log("url", url);

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
      var target = n_url.split('/#')[1];
      if(target) appcache.cacheNav(target);
    });
});

controllers.controller('viewController', function($scope) { 
});

//***************************************************************************************
//***************************** CREDITORS CONTROLLER ************************************
//***************************************************************************************


controllers.controller('exchangeRateController', function ($scope, connect) {
  var currency;

  currency = {
    tables : {
      'currency' : {
        columns: ["id", "name", "symbol", "note", "current_rate", "last_rate", "updated"]
      }
    }
  };

  var model, store, from, to;
  from = $scope.from = {};
  to = $scope.to = {};
  $scope.form = {};
  connect.req(currency).then(function (response) {
    store = response;
    $scope.currencies = response.data;
    to.data = angular.copy(response.data);
    from.data = angular.copy(response.data);
  });

  $scope.filter = function (v) {
    return v.id !== from.currency_id;
  };
  
  $scope.updateTo = function () {
    to.symbol = store.get(to.currency_id).symbol;
  };

  $scope.updateFrom = function () {
    from.symbol = store.get(from.currency_id).symbol;
  };

  $scope.getToSymbol = function () {
    var data = (store && store.get(from.currency_id)) ? store.get(from.currency_id) : {};
    return (data.id === to.currency_id) ? "" : to.symbol; 
  };
  
  $scope.submit = function () {
    // transform to MySQL date
    var date = new Date();
    var updated = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay();
    var data = {
      id: from.currency_id,
      current_rate: from.current_rate,
      last_rate : store.get(from.currency_id).current_rate,
      updated: updated 
    };
    connect.basicPost('currency', [data], ['id']);
  };

  $scope.valid = function () {
    // OMG
    return !(!!to.currency_id && !!from.currency_id && !!from.current_rate);
  };

  $scope.label = function (curr) {
    return [curr.symbol, '|', curr.name].join(' '); 
  };

});

controllers.controller('createAccountController', function($scope, $q, connect) { 
  console.log("createAccountController initialised");

  $scope.model = {};
  $scope.model['accounts'] = {'data' : []};

//  Request
  var account_request = {
    'tables' : {
      'account' : {
        'columns' : ["id", "account_txt", "account_type_id", "fixed"]
      }
    }
  }

  //  grid options
  var grid;
  var dataview;
  var sort_column = "id";
  var columns = [
    {id: 'id', name: 'No.', field: 'id', sortable: true, maxWidth: 80},
    {id: 'account_txt', name: 'Text', field: 'account_txt'},
    {id: 'account_type_id', name: 'Type', field: 'account_type_id', maxWidth: 60},
    {id: 'fixed', name: 'Fixed', field: 'fixed', maxWidth: 60}
  ];
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    forceFitColumns: true,
    /*Bootstrap style row height*/
    rowHeight: 30
  };

  function init() { 

    connect.req(account_request).then(function(res) { 
      $scope.model['accounts'] = res;
      console.log($scope.model['accounts'].data);
      grid = new Slick.Grid('#account_grid', $scope.model['accounts'].data, columns, options);
    })
  }

  init();
});

})(angular);
