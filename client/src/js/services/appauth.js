angular.module('bhima.services')
.factory('appauth', [
  '$q',
  '$http',
  'appstate',
  function ($q, $http, appstate) {
    var session = {},
        mod = {};

    mod.login = function (credentials) {
      var dfd = $q.defer();
      $http.post('/auth/login', credentials)
      .then(function (res) {
        session.user = {
          token : res.data.accessToken,
          data  : res.data.userData
        };
        console.log('SESSION.USER', session.user);
        appstate.set('user', session.user);
        dfd.resolve(session.user);
      })
      .catch(function (err) { dfd.reject(err); })
      .finally();
      return dfd.promise;
    };

    mod.isAuthenticated = function () {
      return !!session.user && !!session.user.token;
    };

    mod.getSession = function () {
      return session;
    };

    return mod;
  }
]);
