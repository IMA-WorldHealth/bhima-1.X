angular.module('bhima.controllers')
.controller('auth.login', [
  'EVENTS',
  '$scope',
  '$rootScope',
  '$translate',
  '$location',
  'store',
  'appauth',
  'appcache',
  'appstate',
  function (EVENTS, $scope, $rootScope, $translate, $location, Store, appauth, Appcache, appstate) {
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

    // fetch the default project
    function loadProject() {
      cache.fetch('project')
      .then(function (project) {
        if (project && project.id) {
          credentials.project = project.id;
        }
      });
    }

    $scope.login = function (cred) {
      var projects = new Store({ identifier : 'id', data : session.projects });

      // put project in cache to save it for next login
      cache.put('project', projects.get(cred.project));

      // put project in appstate for use throughout this session
      appstate.set('project', projects.get(cred.project));

      appauth.login(cred)
      .then(function (sess) {
        $rootScope.$broadcast(EVENTS.auth.loginSuccess);
        session.loginFailure = false;
        $location.path('/');
      })
      .catch(function (err) {
        $rootScope.$broadcast(EVENTS.auth.loginFailed);
        session.loginFailure = true;
      })
      .finally();
    };

    $scope.changeLanguage = function (lang) {
      $translate.use(lang.key);
      cache.put('language', { current: lang.key });
    };
  }
]);
