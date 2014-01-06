angular.module('kpk.controllers')
.controller('appController', function($scope, $location, appcache, appstate, connect) { 
  'use strict';
    
  //lookup users language preference 
  var MODULE_NAMESPACE = 'appjs';

  var cache = new appcache(MODULE_NAMESPACE);
  var url = $location.url();
 
  // Assume initial page load
  if(url==='' || url==='/') { 
    settupApplication(); 
  }

  $scope.$on('$locationChangeStart', function(e, n_url) { 
    //Split url target - needs to be more general to allow for multiple routes?
    var target = n_url.split('/#')[1];
    if(target) cache.put("location", {path: target});
  });
 
  var default_enterprise, default_fiscal_year;
  //donwload and set enterprise and fiscal year - this should not be done here
  connect.req({'tables': { 'enterprise' : {'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'cash_account', 'currency_id']}}})
  .then(function(res) {
    default_enterprise = res.data[0];
    appstate.set('enterprise', default_enterprise);
    return connect.req({'tables': { 'fiscal_year' : { 'columns': ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year']}}});
  }, function (err) {
    console.log("ERR:", err); 
  })
  .then(function(res) { 
    default_fiscal_year = res.data[0];
    if(default_fiscal_year) appstate.set('fiscal', default_fiscal_year);
  });

  function settupApplication() { 
    loadCachedLocation(); 
    //open tree?
    //language?
    //something
  }
   
  function loadCachedLocation() { 
    cache.fetch('location').then(function(res) { 
      
      //res is uninitialised if it has never been set 
      if(res) $location.path(res.path);
    }, function(err) { 
      throw new Error(err);
    });
  }
});
