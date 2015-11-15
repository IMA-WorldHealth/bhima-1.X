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
  '$window', '$translate', '$http', 'util', 'SessionService', 'UserService',
  'ProjectService', '$modal'
];

function PermissionsController($window, $translate, $http, util, Session, Users, Projects, $modal) {
  var vm = this;
  var btnTemplate =
    '<button ng-click="grid.appScope.edit(row.entity)">{{ ::"FORM.EDIT" | translate }}</button>' +
    '<button ng-click="grid.appScope.editPermissions(row.entity)">{{ ::"PERMISSIONS.EDIT_PERMISSIONS" | translate }}</button>';

  // options for the UI grid
  vm.uiGridOptions = {
    appScopeProvider : vm, // ensure that the controller's `this` variable is bound to appScope
    columnDefs : [
      { field : 'displayname', name : 'Display Name' },
      { field : 'username', name : 'User Name' },
      { name : 'Actions', cellTemplate: btnTemplate }
    ],
    enableSorting : true
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
  vm.edit = edit;
  vm.editPermissions = editPermissions;
  vm.setPasswordModal = setPasswordModal;

  /* ------------------------------------------------------------------------ */

  function handler(error) {
    throw error;
  }

  // sets the module view state
  function setState(state) {
    vm.state = state;
    vm.message = 'This state is: ' + state;
  }

  // this is the new user
  function edit(user) {

    // load the user
    Users.read(user.id)
    .then(function (user) {
      vm.user = user;
      setState('update');
    })
    .catch(handler)
    .finally();
  }

  function editPermissions(user) {

    // load the tree units
    loadUnits()
    .then(function (data) {

      // bind the modules to nits
      vm.units = data;

      setState('permissions');
    });
  }

  // make sure that the passwords exist and match.
  function validPassword() {
    return vm.user.password &&
      vm.user.passwordVerify &&
      vm.user.password.length &&
      vm.user.passwordVerify.length &&
      vm.user.password === vm.user.passwordVerify;
  }

  // opens a new modal that 
  function setPasswordModal() {
    var modal = $modal.open({
      templateUrl: 'partials/permissions/permissionsPasswordModalTemplate.html',
      backdrop:    'static',
      keyboard:    false,
      controller:  'PermissionsPasswordModalController',
      controllerAs : 'ModalCtrl',
      resolve:     {
        user:      vm.user
      }
    }).instance;
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

      // reset the user object
      vm.user = {};

      // go back to default state
      setState('default');

      vm.message = $translate.instant('PERMISSIONS.CREATE_SUCCESS');
    })
    .catch(function (error) {
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
