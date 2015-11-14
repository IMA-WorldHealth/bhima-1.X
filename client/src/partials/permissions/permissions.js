// This module is responsible for handling the creation
// of users and assigning permissions to existing modules.

// TODOs:
// - Password Insecure alert or not
// - Rewrite this controller to use
//   1) Controller As syntax
//   2) Angular Form Validation
angular.module('bhima.controllers')
.controller('PermissionsController', PermissionsController);

PermissionsController.$inject = [
  '$window', '$translate', '$http', 'util', 'messenger', 'SessionService', 'UserService', 'ProjectService'
];

function PermissionsController($window, $translate, $http, util, messenger, Session, Users, Projects) {
  var vm = this;

  vm.uiGridOptions = {
    enableSorting : true,
    columnDefs : [
      { field : 'displayname', name : 'Display Name' },
      { field : 'username', name : 'User Name' },
      { field : 'actions', name : 'Actions' }
    ]
  };

  // view loading indicators
  vm.loadingUsers = false;
  vm.loadingPermissions = false;
  vm.loadingProjects = false;

  // the user object that is either edited or created
  vm.user = {};

  // TODO -- manage state without strings
  vm.state = 'default'; // this is default || create || update

  // bind methods
  vm.setState = setState;
  vm.submit = submit;
  vm.validPassword = validPassword;

  /* ------------------------------------------------------------------------ */

  // sets the module view state
  function setState(state) {
    vm.state = state;
  }

  // make sure that the passwords exist and match.
  function validPassword() {
    return vm.user.password &&
      vm.user.passwordVerify &&
      vm.user.password.length &&
      vm.user.passwordVerify.length &&
      vm.user.password === vm.user.passwordVerify;
  }

  // submit the data to the server
  function submit(invalid) {
    if (invalid) { return; }
    
    var promise;

    if (vm.state === 'create') {
      promise = Users.create(vm.user);
    } else {
      promise = Users.update(vm.user.id, vm.user);
    }

    // promise
    promise.then(function (data) {

      // go back to default state
      setState('default');
      
      console.log('Got Data:', data);

      vm.message = $translate.instant('PERMISSIONS.CREATE_SUCCESS');
    })
    .catch(function (error) {
      console.log('Got Error', error);
      vm.message = $translate.instant(error.code);
    });
  }

  // called on modules start
  function startup() {

    // load users
    Users.read().then(function (users) {
      vm.uiGridOptions.data = users;
    });

    // load projects
    Projects.read().then(function (data) {
      vm.projects = data;
    });
  }

  // loads tree units on demand
  function loadUnits() {
    return $http.get('/units')
    .then(util.unwrapHttpResponse);
  }

  startup();
}
