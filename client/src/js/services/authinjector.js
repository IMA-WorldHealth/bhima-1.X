angular.module('bhima.services')
.factory('AuthInjectorFactory', [
  '$rootScope',
  '$q',
  function AuthInjector($rootScope, $q) {
    return {
      responseError : function (res) {
        console.log('[INTERCEPTOR] Received HTTP error', res.status, res.data); 
        return $q.reject(res);
      }
    };
  }
]);
