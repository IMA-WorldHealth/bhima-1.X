angular.module('kpk.controllers')
.controller('appController', function($scope, $location, appcache, appstate, connect) { 
  'use strict';
    
  //lookup users language preference 
      
  //Cache URL's to maintain user session
  // var url = $location.url();

  // //Assuming initial page load
  /*if (url === '') {
    //only navigate to cached page if no page was requested
    appcache.getNav().then(function(res) {
      if(res) {
        $location.path(res);
      }
    });
  }*/

    var default_enterprise, default_fiscal_year;
    //donwload and set enterprise and fiscal year - this should not be done here
    connect.req({'tables': { 'enterprise' : {'columns' : ['id', 'name', 'phone', 'email', 'location_id', 'cash_account']}}})
    .then(function(res) { 
      default_enterprise = res.data[0];
      appstate.set('enterprise', default_enterprise);
      return connect.req({'tables': { 'fiscal_year' : { 'columns': ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year']}}});
    })
    .then(function(res) { 
      default_fiscal_year = res.data[0];
      if(default_fiscal_year) appstate.set('fiscal', default_fiscal_year);
    });
    
    /*$scope.$on('$locationChangeStart', function(e, n_url) { 
      //Split url target - needs to be more general to allow for multiple routes?
      var target = n_url.split('/#')[1];
      if(target) appcache.cacheNav(target);
    });*/
});
