angular.module('kpk.controllers')
.controller('permission', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  '$window',
  'validate',
  function($scope, $q, connect, messenger, $window, validate) {
    // This module is responsible for handling the creation
    // of users and assigning permissions to existing modules.
    //
    // The philosophy of this module is a fast startup.  We load
    // the permissions associated with a user AFTER loading the
    // users, and we load them dynamically.  If this takes too
    // long, we can very easily do a join at the beginning and
    // take a performance hit at startup rather than a potentially
    // confusing halt when a user tries to load permissions.

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

    $scope.setAction = function (value) {
      $scope.action = value;
    };

    $scope.$watch('add', function () {
      $scope.add.validPassword = angular.isDefined($scope.add.password) && $scope.add.password === $scope.add.password_verify;
    }, true);

    $scope.addReset = function () {
      $scope.add = {};
    };

    $scope.addSubmit = function () {
      delete $scope.add.password_verify;
      delete $scope.add.validPassword;
      connect.basicPut('user', [connect.clean($scope.add)])
      .then(function (res) {
        messenger.info("successfully posted new user with id: " + res.data.insertId);
        var data = $scope.add;
        data.id = res.data.insertId;
        $scope.users.post(data);
        $scope.add = {};
        $scope.action = '';
      }, function (err) {
        messenger.danger("Error:" + JSON.stringify(err));
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
      connect.basicPost('user', [connect.clean($scope.edit)], ['id'])
      .then(function (res) {
        messenger.info('Successfully edited user : ' + res.data.insertId);
        $scope.users.put($scope.edit);
        $scope.editInfo($scope.edit);
        $scope.action = '';
      }, function (err) {
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

    $scope.clearPass = function () {
      // when a user attempts a new password, clear the old one.
      $scope.edit.password_verify = '';
    };

    // deleting a user
    $scope.removeUser = function (user) {
      var result = $window.confirm("Are you sure you want to delete user: "  + user.first +" " +user.last);
      if (result) {
        connect.basicDelete('user', user.id)
        .then(function (result) {
          messenger.success('Deleted user id: ' + user.id);
          $scope.users.remove(user.id);
          //  Check if we are looking at a users permissions,
          //  or editing them, we should clear our view
          $scope.action = $scope.action !== 'add' ? '' : $scope.action;
        }, function (err) {
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
        messenger.success('Loaded data for user ' + user.id);
        $scope.permissions = store;
        setSavedPermissions();
        $scope.action = "permission";
      }, function (err) {
        messenger.danger('Error: Failed to load permission data for user' + user.id);
        $scope.action = "permission";
      });
    };

    function setSavedPermissions () {
      if (!$scope.permissions.data || !$scope.units) return;
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
      // We need to add batch updates, inserts, and deletes
      // to connect + server.

      $q.all(
        toRemove.map(function (id) {
          return connect.basicDelete('permission', [id]);
        })
      ).then(function (res) {
        if (!toSave.length) {
          return messenger.success('Successfully updated permission for user ' + user_id);
        }
        connect.basicPut('permission', toSave)
        /*$q.all(
          toSave.map(function (perm) {
            return connect.basicPut('permission', [perm]);
          })
          */
        .then(function (res) {
          messenger.success('Successfully updated permissions for user ' + user_id);
        }, function (err) {
          messenger.danger('Error in updateing user permissions for user ' + user_id);
        });
      }, function (err) {
        messenger.danger('Error in updating user permissions for user ' + user_id);
      });
    };

    function getChildren (id) {
      return $scope.units.data.filter(function (unit) {
        return unit.parent === id;
      });
    }

    $scope.toggleParents = function toggleParents (unit) {
      var parent = $scope.units.get(unit.parent);
      if (!parent) { return; }
      parent.checked = true;
      if (angular.isDefined(parent.parent)) {
        $scope.toggleParents(parent);
      }
    };

    $scope.toggleChildren = function toggleChildren (unit) {
      $scope.toggleParents(unit); // traverse upwards, toggling parents
      $scope.data.permission_change = true;
      unit.children.forEach(function (child) {
        child.checked = unit.checked;
      });
    };

    $scope.filterChildren = function (unit) {
      return unit.parent === 0;
    };

    $scope.$watch('all', function (value, oldValue) {
      if (!$scope.units || !$scope.units.data) return;
      $scope.data.permission_change = true;
      $scope.units.data.forEach(function (unit) {
        unit.checked = $scope.all.checked;
      });
    }, true);

    validate.process(dependencies)
    .then(function (models) {
      for (var k in models) { $scope[k] = models[k]; }

      // order hte data
      $scope.units.data.forEach(function (unit) {
        unit.children = getChildren(unit.id);
      });
    });

    // project settings

    $scope.editProjects = function (user) {
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
      .catch(function (err) {
        messenger.danger('Error: Failed to load project data for user' + user.id);
        $scope.action = 'project';
      });
    };

    $scope.$watch('all.projects', function () {
      if (!$scope.projects) { return; }
      $scope.projects.data.forEach(function (project) {
        project.checked = $scope.all.projects;
      });
    });

    $scope.saveProjects = function () {
      var user_id = $scope.data.user_id;
      var projects = $scope.projects.data;
      var savedProjects = $scope.loadedProjects;
      var toSave = [],
          toRemove = [];

      projects.forEach(function (project) {
        var isOld = !!$scope.loadedProjects.get(project.id);

        if (project.checked && !isOld) {
          toSave.push({ project_id : project.id, user_id : user_id});
        }

        if (!project.checked && isOld) {
          toRemove.push($scope.loadedProjects.get(project.id).id);
        }

      });

      // TODO / FIXME : This is terrible coding.
      // We need to add batch updates, inserts, and deletes
      // to connect + server.

      $q.all(
        toRemove.map(function (id) {
          return connect.basicDelete('project_permission', [id]);
        })
      ).then(function (res) {
        if (!toSave.length) {
          return messenger.success('Successfully updated permission for user ' + user_id);
        }
        connect.basicPut('project_permission', toSave)
        /*$q.all(
          toSave.map(function (perm) {
            return connect.basicPut('permission', [perm]);
          })
          */
        .then(function (res) {
          messenger.success('Successfully updated permissions for user ' + user_id);
        }, function (err) {
          messenger.danger('Error in updateing user permissions for user ' + user_id);
        });
      }, function (err) {
        messenger.danger('Error in updating user permissions for user ' + user_id);
      });
    };
  }
]);
