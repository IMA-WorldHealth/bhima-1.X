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

  // TODO -- remove these
  var $scope = {};
  var current;

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

  Projects.read().then(function (data) {
    console.log('DATA:', data);
  });

  /* ------------------------------------------------------------------------ */

  // sets the module view state
  function setState(state) {
    console.log('state:', state);
    vm.state = state;
  }

  function submit(invalid) {
    if (invalid) { return; }
    console.log('Clicked submit!');
  }

  // called on modules start
  function startup() {

    // load users
    Users.read()
    .then(function (users) {
      vm.uiGridOptions.data = users;
    });
  }

  // loads tree units on demand
  function loadUnits() {
    return $http.get('/units')
    .then(util.unwrapHttpResponse);
  }

  function editUser(user) {
    current.user = user;
    current._backup = angular.copy(user);
    current.state = 'edit';
    current.user.passwordVerify = current.user.password;
  }

  function addUser() {
    current.user = {};
    current.state = 'add';
  }

  // add a new user to the database
  function submitAdd() {

    // remove the duplicate passwordVerify field
    delete current.user.passwordVerify;
    current.user.username = current.user.username.toLowerCase();

    $http.post('/users', current.user)
    .then(function (response) {
      messenger.info('Successfully created new user: ' + current.user.username);
      current.user.id = response.data.insertId;
      $scope.users.post(current.user);
      $scope.editUser(current.user);
    })
    .catch(function (error) {
      console.error('Error:', error);
    });
  }

  function submitEdit() {
    delete current.user.passwordVerify;
    $http.put('/users/' + current.user.id, current.user)
    .then(function (response) {
      messenger.info('Successfully edited user : ' + response.data.insertId);
      $scope.users.put(current.user);
      $scope.editUser(current.user);
    });
  }

  // deleting a user
  function removeUser(user) {
    var result = $window.confirm('Are you sure you want to delete user: '  + user.first +' ' +user.last);
    if (result) {
      $http.delete('users/' + user.id)
      .then(function () {
        messenger.success('Deleted user id: ' + user.id);
        $scope.users.remove(user.id);
      });
    }
  }

  function setSavedUnitPermissions() {
    if (!current.permissions.data || !$scope.units) { return; }
    var units = $scope.units.data;
    units.forEach(function (unit) {
      unit.key = $translate.instant(unit.key);

      // loop through permissions and check each module that
      // the user has permission to.
      unit.checked = !!current.permissions.get(unit.id);
    });
  }

  function setSavedProjectPermissions() {
    if (!current.projects.data || !$scope.projects) { return; }
    var projects = $scope.projects.data;
    projects.forEach(function (proj) {
      // loop through permissions and check each project that
      // the user has permission to.
      proj.checked = !!current.projects.get(proj.id);
    });
  }

  function toggleSuperProjects(bool) {
    $scope.projects.data.forEach(function (project) {
      project.checked = bool;
    });
  }

  function deselectAllProjects(bool) {
    if (!bool) { $scope.super.projects = false; }
  }

  function toggleChildren(unit) {
    if (!unit.checked) { $scope.super.units = false; }
    unit.children.forEach(function (child) {
      if(child){
        child.checked = unit.checked;
        $scope.otherChildren(child);
      }
    });
  }

  function otherChildren(unit) {
    unit.children.forEach(function (child) {
      if(child){
        child.checked = unit.checked;
        otherChildren(child);
      }
    });
  }

  function filterChildren(unit) {
    return unit.parent === 0;
  }

  function getChildren(id) {
    return $scope.units.data.filter(function (unit) {
      return unit.parent === id;
    });
  }

  function toggleSuperUnits(bool) {
    $scope.units.data.forEach(function (unit) {
      unit.checked = bool;
    });
  }

  startup();
}
