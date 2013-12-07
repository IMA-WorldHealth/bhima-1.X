angular.module('kpk.controllers').controller('appController', function($scope, $location, appcache) { 
    
    //Cache URL's to maintain user session
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
    
    $scope.$on('$locationChangeStart', function(e, n_url) { 
      //Split url target - needs to be more general to allow for multiple routes?
      var target = n_url.split('/#')[1];
      if(target) appcache.cacheNav(target);
    });
});