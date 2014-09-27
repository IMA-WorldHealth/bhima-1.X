angular.module('bhima.services')
.factory('auth.injector', [
  'EVENTS',
  '$rootScope',
  '$q',
  function AuthInjector(EVENTS, $rootScope, $q) {
    return {
      responseError : function (res) {
        var errors = {
          401 : EVENTS.auth.notAuthenticated,
          419 : EVENTS.auth.sessionTimeout,
          440 : EVENTS.auth.sessionTimeout
        };
        $rootScope.$broadcast(errors[res.status], res);
        return $q.reject(res);
      }
    };
  }
]);
