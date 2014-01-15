angular.module('kpk.controllers')
.controller('appController', function($scope, $location, $translate, appcache, appstate, connect, validate) { 
  'use strict';
    
  //lookup users language preference 
  var MODULE_NAMESPACE = 'application';

  var cache = new appcache(MODULE_NAMESPACE);
  var url = $location.url();
  
  settupApplication();  
  
  function settupApplication() { 
    
    //TODO experimental - loading previous sessions language settings - not always ideal during development
    loadLanguage();

    //Initial page load assumed be navigating to nothing
    if(url==='' || url==='/') { 
      loadCachedLocation(); 
    }
    fetchSessionState();
  }
   
  function loadCachedLocation() { 
    cache.fetch('location').then(function(res) { 
      
      //res is uninitialised if it has never been set 
      if(res) $location.path(res.path);
    }, function(err) { 
      throw new Error(err);
    });
  }

  function loadLanguage() { 
    
    //FIXME This could be done in util.js - extra object (in this file) vs. the clarity of doing all set up in one place
    var utilCache = new appcache('util');
    utilCache.fetch('language').then(function(res) { 
      if(res) $translate.uses(res.current); 
    });
  }
  
  function fetchSessionState() { 
    
    //TODO Method to fetch session variables, fiscal years, enterprises etc. - the design and ordering of these operations should be researched 
    var default_enterprise, default_fiscal_year;
     
    connect.req({'tables': { 'enterprise' : {'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'cash_account', 'currency_id']}}})
    .then(function(res) {
      default_enterprise = res.data[0];
      appstate.set('enterprise', default_enterprise);
      return connect.req({'tables': { 'fiscal_year' : { 'columns': ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year', 'enterprise_id']}}});
    })
    .then(function(res) { 
      default_fiscal_year = res.data[0];
      if(default_fiscal_year) appstate.set('fiscal', default_fiscal_year);
    }, function (err) {
      throw new Error(err);
    });
  }

  //Watch changes in application $location, cache these in the users session
  $scope.$on('$locationChangeStart', function(e, n_url) { 
    
    //TODO Tree is not currently updated on navigation - user can be presented with a different screen than selected node
    //Split url target - needs to be more general to allow for multiple routes?
    var target = n_url.split('/#')[1];
    if(target) cache.put("location", {path: target});
  });
});
