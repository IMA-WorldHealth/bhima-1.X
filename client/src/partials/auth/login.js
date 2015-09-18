angular.module('bhima.controllers')
.controller('LoginController', [
  '$scope',
  '$translate',
  '$location',
  '$http',
  '$timeout',
  'appcache',
  'appstate',
  'SessionService',
  LoginController
]);

// The login conroller
function LoginController($scope, $translate, $location, $http, $timeout, Appcache, appstate, SessionService) {

  // this is the View-Model (angular style guide).
  var vm = this,
      cache = new Appcache('preferences');

  // contains the values from the login form
  vm.credentials = {};
  vm.$error = false;
  vm.login = login;
  vm.setLanguage = setLanguage;

  // load language dependencies
  $http.get('/languages')
  .then(function (response) {
    vm.languages = response.data;
  });

  // load project dependencies
  $http.get('/projects')
  .then(function (response) {
    vm.projects = response.data;
    loadStoredProject();
  });

  // If the user has logged in previously, the project will
  // be stored in appcache.  We will load it up as the default
  // choice.  If the user has not logged in previously, we will
  // select the first project as default.
  function loadStoredProject() {
    var defaultProjectIndex = 0;

    cache.fetch('project')
    .then(function (project) {
      var projectCacheFound = project && project.id;

      if (projectCacheFound) {

        // Assign the cached project as default selection
        vm.credentials.project = project.id;
      } else {

        // Assign defaultProjectIndex for now
        vm.credentials.project = vm.projects[defaultProjectIndex].id;
      }
    });
  }

  // logs the user in, creates the user client session
  function login(invalid, credentials) {
    vm.$error = false;

    // if the form is not valid, do not generate an
    // $http request
    if (invalid) { return; }

    // submit the credentials to the server
    $http.post('/login', credentials)
    .then(function (response) {

      // Yay!  We are authenticated.  Create the user session.
      SessionService.create(response.data.user, response.data.enterprise, response.data.project);

      // DEPRECATED
      // Support old code by registering with appstate
      $timeout(function () {
        appstate.set('enterprise', response.data.enterprise);
        appstate.set('project', response.data.project);
      });

      // navigate to the home page
      $location.url('/');
    })
    .catch(function (error) {
      vm.$error = true;

      // suppress missing data errors when editting again
      $scope.LoginForm.$setPristine();
    });
  }

  // switches languages
  function setLanguage(lang) {

    // TODO Use a translation service to fetch languages and configure cache
    $translate.use(lang.translate_key);
    cache.put('language', lang);
  }
}
