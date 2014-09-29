angular.module('bhima.services')
.factory('appauth', [
  '$q',
  '$http',
  '$window',
  'appstate',
  function ($q, $http, $window, appstate) {
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
      })
      .catch(function (err) { dfd.reject(err); })
      .finally();
    };

    mod.isAuthenticated = function () {
      console.log('sessionStorage', $window.sessionStorage.session);
      console.log('isAuthenticated', !!session && !!session.token);
      return !!session && !!session.token;
    };

    mod.getSession = function () {
      return session;
    };

    return mod;
  }
]);
