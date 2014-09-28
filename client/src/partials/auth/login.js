angular.module('bhima.controllers')
.controller('auth.login', [
  'EVENTS',
  '$scope',
  '$rootScope',
  '$translate',
  '$location',
  'appauth',
  'appcache',
  'appstate',
  function (EVENTS, $scope, $rootScope, $translate, $location, appauth, Appcache, appstate) {
    var session = $scope.session = { menu : false };
    var credentials = $scope.credentials = {};
    var cache = new Appcache('preferences');

    // load projects
    appstate.register('projects', function (projects) {
      session.projects = projects;
      loadProject();
    });

    // load languages
    appstate.register('languages', function (languages) {
      session.languages = languages;
    });

    function loadProject() {
      cache.fetch('project')
      .then(function (project) {
        if (project && project.id) {
          credentials.project = project.id;
        }
      });
    }

    $scope.projects = {};

    $scope.login = function (cred) {
      // put project in cache to save it for next login
      cache.put('project', { id :cred.project });
      // put project in appstate for use throughout this session
      appstate.set('project', { id: cred.project });

      appauth.login(cred)
      .then(function (sess) {
        $rootScope.$broadcast(EVENTS.auth.loginSuccess);
        $scope.setUser(sess.user);
        session.loginFailure = false;
      })
      .catch(function (err) {
        $rootScope.$broadcast(EVENTS.auth.loginFailed);
        session.loginFailure = true;
      });
    };

    $scope.changeLanguage = function (lang) {
      $translate.use(lang.key);
      cache.put('language', { current: lang.key });
    };
  }
]);
