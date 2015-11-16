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

  var $scope = {};

  vm.uiGridOptions = {
    showGridFooter : true,
    showColumnFooter : true,
    enableFiltering : true,
    enableSorting : true,
    columnDefs : [
      { field : 'first', name : 'First' },
      { field : 'username', name : 'User Name'},
      { field : 'email', name : 'Email' },
      { field : 'actions', name : 'Actions' }
    ]
  };

  // view loading indicators
  vm.loadingUsers = false;
  vm.loadingPermissions = false;
  vm.loadingProjects = false;

  // the user object that is either edited or created
  vm.user = {};

  // keeps track of state
  var current = $scope.current = {
    state : null,
    user : {},
    permissions : [],
    projects : [],
    _backup : null,
    loading : false
  };

  /* ------------------------------------------------------------------------ */

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

  $scope.editUser = function editUser(user) {
    current.user = user;
    current._backup = angular.copy(user);
    current.state = 'edit';
    current.user.passwordVerify = current.user.password;
  };

  $scope.addUser = function addUser() {
    current.user = {};
    current.state = 'add';
  };

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
  $scope.removeUser = function removeUser(user) {
    var result = $window.confirm('Are you sure you want to delete user: '  + user.first +' ' +user.last);
    if (result) {
      $http.delete('users/' + user.id)
      .then(function () {
        messenger.success('Deleted user id: ' + user.id);
        $scope.users.remove(user.id);
      });
    }
  };

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

  $scope.toggleSuperProjects = function toggleSuperProjects(bool) {
    $scope.projects.data.forEach(function (project) {
      project.checked = bool;
    });
  };

  $scope.deselectAllProjects = function deselectAllProjects(bool) {
    if (!bool) { $scope.super.projects = false; }
  };

  //
  $scope.toggleChildren = function toggleChildren(unit) {
    if (!unit.checked) { $scope.super.units = false; }
    $scope.toggleParents(unit); // traverse upwards, toggling parents
    unit.children.forEach(function (child) {
      if(child){
        child.checked = unit.checked;
        $scope.otherChildren(child);
      }
    });
  };

  $scope.otherChildren = function otherChildren(unit) {
    unit.children.forEach(function (child) {
      if(child){
        child.checked = unit.checked;
        $scope.otherChildren(child);
      }
    });
  };

  $scope.filterChildren = function filterChildren(unit) {
    return unit.parent === 0;
  };

  function getChildren(id) {
    return $scope.units.data.filter(function (unit) {
      return unit.parent === id;
    });
  }

  $scope.toggleSuperUnits = function toggleSuperUnits(bool) {
    $scope.units.data.forEach(function (unit) {
      unit.checked = bool;
    });
  };

  startup();
}
