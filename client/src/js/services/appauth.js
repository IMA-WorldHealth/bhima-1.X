angular.module('bhima.services')
.factory('appauth', [
  '$q',
  'connect',
  'appstate',
  function ($q, connect, appstate) {
    var session = {},
        mod = {};

    mod.login = function(credentials) {
      return connect.post('/auth/login', credentials)
      .then(function (res) {
        session.user = {
          token : res.data.accessToken,
          data  : res.data.userData
        };
        appstate.set('user', session.user);
        return $q(session.user);
      });
    };

    mod.isAuthenticated = function () {
      return !!session.user.token;
    };

    mod.getSession = function () {
      return session;
    };

    return mod;
  }
]);
