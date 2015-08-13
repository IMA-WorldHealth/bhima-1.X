
angular.module('bhima.services')
.service('SessionService', ['$window', function ($window) {
  var self = this,
      key = 'bhima-session-key';

  // loads up a session if it exists
  // NOTE - we are using $window.sessionStorage
  // rather than localForage because we want immediate
  // responses.
  self.loadStoredSession = function () {
    var session = $window.sessionStorage[key];
    if (session) { self.create(session.user, session.enterprise, session.project); }
  };

  // set the user, enterprise, and project for the session
  // this should happen right after login
  self.create = function (user, enterprise, project) {
    self.user = user;
    self.enterprise = enterprise;
    self.project = project;
    $window.sessionStorage[key] = { user : user, enterprise: enterprise, project : project };
  };

  // unsets the values for the session variables
  self.destroy = function () {
    self.user       = undefined;
    self.enterprise = undefined;
    self.project    = undefined;
    delete $window.sessionStorage[key];
  };

  // check and see if we have a session stored -
  // this is in case we have "refreshed" the page
  self.loadStoredSession();
}]);
