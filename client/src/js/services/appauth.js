angular.module('bhima.services')
.factory('appauth', [
  '$q',
  '$http',
  '$window',
  '$location',
  'appstate',
  function ($q, $http, $window, $location, appstate) {
    var session,
        mod = {};

    if ($window.sessionStorage.session) {
      session = JSON.parse($window.sessionStorage.session);
    }

    mod.login = function (credentials) {
      var dfd = $q.defer();
      $http.post('/auth/login', credentials)
      .then(function (res) {
        session = {
          token : res.data.accessToken,
          data  : res.data.userData
        };
        appstate.set('user', session.data);
        $window.sessionStorage.session = JSON.stringify(session);
        dfd.resolve(session);
      })
      .catch(function (err) { dfd.reject(err); })
      .finally();
      return dfd.promise;
    };

    mod.logout = function () {
      var dfd = $q.defer();
      $http.get('/auth/logout')
      .then(function (res) {
        delete $window.sessionStorage.session;
        session = null;
        dfd.resolve(res);
      })
      .catch(function (err) {
        dfd.reject(err);
      })
      .finally();

      return dfd.promise;
    };

    mod.isAuthenticated = function () {
      return !!session && !!session.token;
    };

    mod.getSession = function () {
      return session;
    };

    mod.destroySession = function () {
      delete $window.sessionStorage.session;
      session = null;

      // Jump back to the root
      // FIXME : This gets into an infinite loop!
      //$location.path('/');
    };

    return mod;
  }
]);
