// This module is responsible for handling the creation
// of users and assigning permissions to existing modules.

// The philosophy of this module is a fast startup.  We load
// the permissions associated with a user AFTER loading the
// users, and we load them dynamically.  If this takes too
// long, we can very easily do a join at the beginning and
// take a performance hit at startup rather than a potentially
// confusing halt when a user tries to load permissions.

angular.module('bhima.controllers')
.controller('permission', [
  '$scope',
  '$q',
  '$window',
  'connect',
  'messenger',
  'validate',
  function($scope, $q, $window, connect, messenger, validate) {
    var dependencies = {};

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

    // The add namespace
    $scope.add = {};
    // for registration of 'super user privileges'
    $scope.all = {};
    // for printing
    $scope.timestamp = new Date();

    $scope.$watch('add', function () {
      $scope.add.validPassword = angular.isDefined($scope.add.password) && $scope.add.password === $scope.add.password_verify;
    }, true);

    $scope.addReset = function () {
      $scope.add = {};
    };

    $scope.addSubmit = function () {
      delete $scope.add.password_verify;
      delete $scope.add.validPassword;
      connect.post('user', [connect.clean($scope.add)])
      .then(function (res) {
        messenger.info('Successfully posted new user with id: ' + res.data.insertId);
        var data = $scope.add;
        data.id = res.data.insertId;
        $scope.users.post(data);
        $scope.add = {};
        $scope.action = '';
      })
      .catch(function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    };

    // the edit namespace
    $scope.edit = {};

    $scope.editReset = function () {
      $scope.editInfo($scope.users.get($scope.edit.id));
    };

    $scope.editSubmit = function () {
      delete $scope.edit.password_verify;
      delete $scope.edit.validPassword;
      connect.put('user', [connect.clean($scope.edit)], ['id'])
      .then(function (res) {
        messenger.info('Successfully edited user : ' + res.data.insertId);
        $scope.users.put($scope.edit);
        $scope.editInfo($scope.edit);
        $scope.action = '';
      })
      .catch(function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    };

    $scope.editInfo = function (user) {
      $scope.edit = angular.copy(user);
      $scope.edit.password_verify = user.password;
      $scope.action = 'edit';
    };

    $scope.$watch('edit', function () {
      $scope.edit.validPassword = angular.isDefined($scope.edit.password) && $scope.edit.password === $scope.edit.password_verify;
    }, true);

    $scope.clearPass = function clearPass() {
      // when a user attempts a new password, clear the old one.
      $scope.edit.password_verify = '';
    };

    // deleting a user
    $scope.removeUser = function (user) {
      var result = $window.confirm('Are you sure you want to delete user: '  + user.first +' ' +user.last);
      if (result) {
        connect.delete('user', 'id', user.id)
        .then(function () {
          messenger.success('Deleted user id: ' + user.id);
          $scope.users.remove(user.id);
          //  Check if we are looking at a users permissions,
          //  or editing them, we should clear our view
          $scope.action = $scope.action !== 'add' ? '' : $scope.action;
        })
        .catch(function (err) {
          messenger.danger('Error:' + JSON.stringify(err));
        });
      }
    };

    // permissions data

    $scope.data = {};
    $scope.data.permission_change = false;

    $scope.editPermission = function (user) {
      $scope.data.user_id = user.id;
      connect.req({
        identifier : 'unit_id',
        tables : { 'permission' : { columns : ['id', 'unit_id'] }},
        where : ['permission.user_id='+user.id]
      })
      .then(function (store) {
        $scope.permissions = store;
        setSavedPermissions();
        $scope.action = 'permission';
      })
      .catch(function () {
        messenger.danger('Error: Failed to load permission data for user' + user.id);
        $scope.action = 'permission';
      });
    };

    function setSavedPermissions () {
      if (!$scope.permissions.data || !$scope.units) { return; }
      var units = $scope.units.data;
      units.forEach(function (unit) {
        // loop through permissions and check each module that
        // the user has permission to.
        unit.checked = !!$scope.permissions.get(unit.id);
      });
    }

    $scope.savePermissions = function () {
      var user_id = $scope.data.user_id;
      var units = $scope.units.data;
      var savedPermissions = $scope.permissions;
      var toSave = [],
          toRemove = [];

      units.forEach(function (unit) {
        if (unit.checked && !savedPermissions.get(unit.id)) {
          toSave.push({ unit_id : unit.id, user_id : user_id });
        }
        if (!unit.checked && !!savedPermissions.get(unit.id)) {
          toRemove.push(savedPermissions.get(unit.id).id);
        }
      });

      // TODO / FIXME : This is terrible coding.
      var promises = toRemove.map(function (id) {
        return connect.delete('permission', 'id', id);
      });

      $q.all(promises)
      .then(function () {
        return !toSave.length ? $q.when() : connect.post('permission', toSave);
      })
      .then(function () {
        messenger.success('Successfully updated permissions for user ' + user_id);
      })
      .catch(function (err) {
        console.log('An error occurred in batch processing', err);
      });
    };

    function getChildren(id) {
      return $scope.units.data.filter(function (unit) {
        return unit.parent === id;
      });
    }

    $scope.toggleParents = function toggleParents(unit) {
      var parent = $scope.units.get(unit.parent);
      if (!parent) { return; }
      parent.checked = true;
      if (angular.isDefined(parent.parent)) {
        $scope.toggleParents(parent);
      }
    };

    $scope.toggleChildren = function toggleChildren(unit) {
      $scope.toggleParents(unit); // traverse upwards, toggling parents
      $scope.data.permission_change = true;
      unit.children.forEach(function (child) {
        child.checked = unit.checked;
      });
    };

    $scope.filterChildren = function filterChildren(unit) {
      return unit.parent === 0;
    };

    $scope.changeAllChecked = function changeAll() {
      if (!$scope.units || !$scope.units.data) { return; }
      $scope.data.permission_change = true;
      $scope.units.data.forEach(function (unit) {
        unit.checked = $scope.all.checked;
      });
    };

    /*
    $scope.$watch('all', function () {
      if (!$scope.units || !$scope.units.data) { return; }
      $scope.data.permission_change = true;
      $scope.units.data.forEach(function (unit) {
        unit.checked = $scope.all.checked;
      });
    }, true);
    */

    validate.process(dependencies)
    .then(function (models) {
      angular.extend($scope, models);

      // order the data
      $scope.units.data.forEach(function (unit) {
        unit.children = getChildren(unit.id);
      });
    });

    // project settings

    $scope.editProjects = function editProjects(user) {
      $scope.data.user_id = user.id;
      $scope.projects.data.forEach(function (project) {
        project.checked = false;
      });
      $scope.all.projects = false;
      connect.req({
        tables : {
          'project_permission' : { columns : ['id', 'project_id'] },
        },
        where : ['project_permission.user_id=' + user.id]
      })
      .then(function (store) {
        store.data.forEach(function (perm) {
          $scope.projects.get(perm.project_id).checked = true;
        });
        $scope.loadedProjects = store;
        $scope.action = 'project';
      })
      .catch(function () {
        messenger.danger('Error: Failed to load project data for user' + user.id);
        $scope.action = 'project';
      });
    };
  
    $scope.changeAllProjects = function changeAllProjects() {
      if (!$scope.projects) { return; }
      $scope.projects.data.forEach(function (project) {
        project.checked = $scope.all.projects;
      });
    }

    $scope.print = function () {
      $window.print();
    };

    $scope.saveProjects = function () {
      var userId = $scope.data.user_id;
      var projects = $scope.projects.data;
      var toSave = [],
          toRemove = [];

      projects.forEach(function (project) {
        var isOld = !!$scope.loadedProjects.get(project.id);

        if (project.checked && !isOld) {
          toSave.push({ project_id : project.id, user_id : userId });
        }

        if (!project.checked && isOld) {
          toRemove.push($scope.loadedProjects.get(project.id).id);
        }
      });

      // TODO / FIXME : This is terrible coding.

      var promises = toRemove.map(function (id) {
        return connect.delete('project_permission', 'id', id);
      });
      $q.all(promises)
      .then(function () {
        return !toSave.length ? $q.when() : connect.post('project_permission', toSave);
      })
      .then(function () {
        messenger.success('Successfully updated permissions for user ' + userId);
      })
      .catch(function (err) {
        console.log('Error in batch processing');
      });;
    };
  }
]);
