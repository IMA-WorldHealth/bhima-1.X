// This module is responsible for handling the creation
// of users and assigning permissions to existing modules.

// The philosophy of this module is a fast startup.  We load
// the permissions associated with a user AFTER loading the
// users, and we load them dynamically.  If this takes too
// long, we can very easily do a join at the beginning and
// take a performance hit at startup rather than a potentially
// confusing halt when a user tries to load permissions.

// TODOs:
//  - Print
//    - User list
//    - Current User data sheet
// - Password Insecure alert or not
// - Rewrite this controller to use
//   1) Controller As syntax
//   2) Angular Form Validation

angular.module('bhima.controllers')
.controller('PermissionsController', PermissionsController);

PermissionsController.$inject = [
  '$scope', '$q', '$window', '$translate', '$http', 'store',
  'connect', 'messenger', 'validate', 'SessionService'
];

function PermissionsController($scope, $q, $window, $translate, $http, Store, connect, messenger, validate, SessionService) {
  var dependencies = {};
  var isDefined = angular.isDefined;

  // keeps track of state
  var current = $scope.current = {
    state : null,
    user : {},
    permissions : [],
    projects : [],
    _backup : null,
    loading : false
  };

  var valid = $scope.valid = {
    password : false
  };

  dependencies.units = {
    query : {
      tables : {
        'unit' : {
          columns : ['id', 'name', 'key', 'description', 'parent']
        }
      },
      where : ['unit.id<>0']
    }
  };

  dependencies.users = {
    query : {
      tables: {
        'user': {
          columns : ['id', 'username', 'email', 'first', 'last']
        }
      }
    }
  };

  dependencies.projects = {
    query : {
      identifier : 'id',
      tables : {
        'project' : {
          columns : ['id', 'name', 'abbr']
        }
      }
    }
  };

  dependencies.unitPermissions = {
    identifier : 'unit_id',
    tables : {
      'permission' : {
        columns : ['id', 'unit_id']
      }
    }
  };

  dependencies.projectPermissions = {
    identifier : 'project_id',
    tables : {
      'project_permission' : {
        columns : ['id', 'project_id']
      }
    }
  };

  // for registration of 'super user privileges'
  $scope.super = {};

  // for printing
  $scope.timestamp = new Date();

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

  function submitUnitPermissions() {
    var units = $scope.units.data,
        removals  = [],
        additions = [];

    // current.permission is acting as a hash of
    // the permission for the current.user.
    // Checking current.permission.get(unit) tells
    // if the user has permission to this module.
    units.forEach(function (unit) {
      // add permissions that have not been saved yet.
      if (unit.checked && !current.permissions.get(unit.id)) {
        additions.push({ unit_id : unit.id, user_id : current.user.id });
      }

      if (!unit.checked && !!current.permissions.get(unit.id)) {
        var id = current.permissions.get(unit.id).id;
        removals.push(id);
      }
    });

    // delete the unchecked permissions
    var promises = removals.map(function (id) {
      return connect.delete('permission', 'id', id);
    });


    // add the (newly) checked unit permissions
    if (additions.length > 0) { promises.push(connect.post('permission', additions)); }

    $q.all(promises)
    .then(function () {
      $scope.editUnitPermissions(current.user);
      messenger.info('Submitted ' + promises.length + ' changes to the database.');
    });
  }

  function submitProjectPermissions() {
    var projects = $scope.projects.data,
        removals  = [],
        additions = [];

    projects.forEach(function (project) {
      var isOld = !!current.projects.get(project.id);

      if (!!project.checked && !current.projects.get(project.id)) {
        additions.push({ project_id : project.id, user_id : current.user.id });
      }

      if (!project.checked && !!current.projects.get(project.id)) {
        // id here is the project_permission id, indexed by the
        // project.id.  It is confusing, I know.
        var id = current.projects.get(project.id).id;
        removals.push(id);
      }
    });

    var promises = removals.map(function (id) {
      return connect.delete('project_permission', 'id', id);
    });

    // add the (newly) checked project permissions
    if (additions.length > 0) { promises.push(connect.post('project_permission', additions)); }

    $q.all(promises)
    .then(function () {
      $scope.editProjectPermissions(current.user);
      messenger.info('Submitted ' + promises.length + ' changes to the database.');
    });
  }

  $scope.clearPass = function clearPass() {
    // when a user attempts a new password, clear the old one.
    current.user.passwordVerify = '';
    $scope.validatePassword();
  };

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

  $scope.editUnitPermissions = function editUnitPermissions(user) {
    current.state = 'permissions';
    $scope.super.units = false;
    current.user = user;
    dependencies.unitPermissions.where =
      ['permission.user_id=' + user.id];

    connect.req(dependencies.unitPermissions)
    .then(function (store) {
      current.permissions = store;
      current._backup = angular.copy(store.data);
      setSavedUnitPermissions();
    });
  };

  $scope.editProjectPermissions = function editProjectPermissions(user) {
    current.state = 'projects';
    $scope.super.projects = false;
    current.user = user;
    dependencies.projectPermissions.where =
      ['project_permission.user_id=' + user.id];

    connect.req(dependencies.projectPermissions)
    .then(function (store) {
      current.projects = store;
      current._backup = angular.copy(store.data);
      setSavedProjectPermissions();
    });
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

  $scope.print = function print() {
    $window.print();
  };

  $scope.validatePassword = function validatePassword() {
    // ensure the password is not undefined, empty or null.
    valid.password = isDefined(current.user.password) &&
      current.user.password !== null &&
      current.user.password !== '' &&
      current.user.password === current.user.passwordVerify;
  };

  $scope.submit = function submit() {
    switch (current.state) {
      case 'edit' :
        submitEdit();
        break;
      case 'add' :
        submitAdd();
        break;
      case 'projects' :
        submitProjectPermissions();
        break;
      case 'permissions' :
        submitUnitPermissions();
        break;
      default:
        console.log('[ERR]', 'I don\'t know what I\'m doing!');
        break;
    }
  };

  $scope.reset = function reset() {
    switch (current.state) {
      case 'edit':
        current.user = current._backup;
        break;
      case 'add':
        current.user = {};
        current._backup = {};
        break;
      case 'projects':
        current.projects = current._backup;
        break;
      case 'permissions':
        current.permissions = new Store({ identifier : 'unit_id', data : current._backup });
        break;
      default:
        console.log('[ERR]', 'I don\'t know what I\'m doing!');
        break;
    }
  };

  $scope.toggleParents = function toggleParents(unit) {
    var parent = $scope.units.get(unit.parent);
    if (!parent) { return; }
    parent.checked = true;
    if (isDefined(parent.parent)) {
      $scope.toggleParents(parent);
    }
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

  // startup
  function startup() {

    // toggle loading indicator
    current.loading = true;

    validate.process(dependencies, ['units', 'users', 'projects'])
    .then(function (models) {
      angular.extend($scope, models);

      // order the data
      $scope.units.data.forEach(function (unit) {
        unit.children = getChildren(unit.id);
      });
    })
    .finally(function () { current.loading = false; });
  }

  startup();
}
