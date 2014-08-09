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

angular.module('bhima.controllers')
.controller('permission', [
  '$scope',
  '$q',
  '$window',
  'Store',
  'connect',
  'messenger',
  'validate',
  function($scope, $q, $window, Store, connect, messenger, validate) {
    var dependencies = {};
    var isDefined = angular.isDefined;

    // keeps track of state
    var current = $scope.current = {
      state : null,
      user : null,
      permissions : [],
      projects : [],
      _backup : null
    };

    var valid = $scope.valid = {
      password : false
    };

    dependencies.units = {
      query : {
        tables : {
          'unit' : {
            columns : ['id', 'name', 'description', 'has_children', 'parent']
          }
        },
        where : ['unit.id<>0']
      }
    };

    dependencies.users = {
      query : {
        tables: {
          'user': {
            columns : ['id', 'username', 'email', 'password', 'first', 'last', 'logged_in']
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

    function submitAdd() {
      delete current.user.passwordVerify;
      connect.post('user', [connect.clean(current.user)])
      .then(function (res) {
        messenger.info('Successfully posted new user with id: ' + res.data.insertId);
        current.user.id = res.data.insertId;
        $scope.users.post(current.user);
        $scope.editUser(current.user);
      });
    }

    function submitEdit() {
      delete current.user.passwordVerify;
      connect.put('user', [connect.clean(current.user)], ['id'])
      .then(function (res) {
        messenger.info('Successfully edited user : ' + res.data.insertId);
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

        if (!unit.checked && !!current.permission.get(unit.id)) {
          removals.push(unit.id);
        }
      });

      // delete the unchecked permissions
      var promises = removals.map(function (id) {
        return connect.delete('permission', 'id', id);
      });


      // add the (newly) checked unit permissions
      promises.push(connect.post('permission', additions));

      $q.all(promises)
      .then(function () {
        $scope.editUnitPermissions(current.user);
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
          removals.push(project.id);
        }
      });

      var promises = removals.map(function (id) {
        return connect.delete('project_permission', 'id', id);
      });
     
      // add the (newly) checked project permissions
      promises.push(connect.post('project_permission', additions));

      $q.all(promises)
      .then(function () {
        $scope.editProjectPermissions(current.user);
      });
    }

    $scope.clearPass = function clearPass() {
      // when a user attempts a new password, clear the old one.
      current.user.passwordVerify = '';
    };

    // deleting a user
    $scope.removeUser = function removeUser(user) {
      var result = $window.confirm('Are you sure you want to delete user: '  + user.first +' ' +user.last);
      if (result) {
        connect.delete('user', 'id', user.id)
        .then(function () {
          messenger.success('Deleted user id: ' + user.id);
          $scope.users.remove(user.id);
          //  Check if we are looking at a users permissions,
          //  or editing them, we should clear our view
        });
      }
    };

    $scope.editUnitPermissions = function editUnitPermissions(user) {
      current.state = 'permission';
      current.user = user;
      dependencies.unitPermissions.query.where =
        ['permission.user_id=' + user.id];

      connect.req(dependencies.unitPermissions)
      .then(function (store) {
        current.permissions = store;
        current._backup = angular.copy(store.data);
        setSavedUnitPermissions();
      });
    };

    $scope.editProjectPermissions = function editProjectPermissions(user) {
      current.state = 'project';
      current.user = user;
      dependencies.projectPermissions.query.where =
        ['project_permission.user_id=' + user.ids];

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

    $scope.$watch('current.user', function () {
      valid.password = isDefined(current.user.password) && current.user.password === $scope.user.passwordVerify;
    }, true);

    function submit() {
      switch (current.state) {
        case 'edit':
          submitEdit();
          break;
        case 'add':
          submitAdd();
          break;
        case 'projects':
          submitProjects();
          break;
        case 'permissions':
          submitPermissions():
          break;
        default:
          console.log('I don\'t know what I\'m doing!');
          break;
      }
    }

    function reset() {
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
          console.log('I don\'t know what I\'m doing!');
          break;
      }
    }


    $scope.toggleParents = function toggleParents(unit) {
      var parent = $scope.units.get(unit.parent);
      if (!parent) { return; }
      parent.checked = true;
      if (isDefined(parent.parent)) {
        $scope.toggleParents(parent);
      }
    };

    $scope.toggleChildren = function toggleChildren(unit) {
      if (!unit.checked) { $scope.super.checked = false; }
      $scope.toggleParents(unit); // traverse upwards, toggling parents
      $scope.data.permissionChange = true;
      unit.children.forEach(function (child) {
        child.checked = unit.checked;
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
      $scope.data.permissionChange = true;
      $scope.units.data.forEach(function (unit) {
        unit.checked = bool;
      });
    };

 
    // startup

    validate.process(dependencies, ['units', 'users' 'projects'])
    .then(function (models) {
      angular.extend($scope, models);

      // order the data
      $scope.units.data.forEach(function (unit) {
        unit.children = getChildren(unit.id);
      });
    });


  }
]
