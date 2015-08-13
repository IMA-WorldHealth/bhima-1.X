angular.module('bhima.controllers')
.controller('LoginController', [
  'EVENTS',
  '$translate',
  '$location',
  '$http',
  'appcache',
  'SessionService',
  function (EVENTS, $translate, $location, $http, Appcache, SessionService) {

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

    self.login = function (credentials) {

      console.log('Submitting...', credentials);

      $http.post('/login', credentials)
      .then(function (data) {


        console.log('YAY!', data);


      })
      .catch(function (error) {
        console.log(' :( ');
        self.submitError = true;
      });

    };

    self.setLanguage = function (lang) {
      $translate.use(lang.key);
      cache.put('language', { current: lang.key });
    };
  }
]);
