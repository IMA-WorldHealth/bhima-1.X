angular.module('bhima.controllers')
.controller('LoginController', [
  '$translate',
  '$location',
  '$http',
  '$timeout',
  'appcache',
  'appstate',
  'SessionService',
  function ($translate, $location, $http, $timeout, Appcache, appstate, SessionService) {

    var self = this,
        cache = new Appcache('preferences');

    // contains the values from the login form
    self.credentials = {};
    self.submitError = false;

    // load language dependencies
    $http.get('/languages')
    .then(function (response) {
      self.languages = response.data;
    })
    .catch(function (error) {
      console.log('err', error);  
    });

    // load project dependencies
    $http.get('/projects')
    .then(function (response) {
      self.projects = response.data;
      loadStoredProject();
    })
    .catch(function (error) {
      console.log('err', error);  
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
          self.credentials.project = project.id;
        } else {

          // Assign defaultProjectIndex for now
          self.credentials.project = self.projects[defaultProjectIndex].id;
        }
      });
    }

    // logs the user in, creates the session
    self.login = function (credentials) {

      // submit the credentials to the server
      $http.post('/login', credentials)
      .then(function (response) {
        self.submitError = false;

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
        self.submitError = true;
      });
    };

    // switches languages
    self.setLanguage = function (lang) {
      $translate.use(lang.key);
      cache.put('language', { current: lang.key });
    };
  }
]);
