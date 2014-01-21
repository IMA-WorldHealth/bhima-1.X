angular.module('kpk.controllers')
.controller('userController', function($scope, $q, connect, messenger, $window) {
  // This module is responsible for handling the creation
  // of users and assigning permissions to existing modules.
  //
  // The philosophy of this module is a fast startup.  We load
  // the permissions associated with a user AFTER loading the 
  // users, and we load them dynamically.  If this takes too
  // long, we can very easily do a join at the beginning and
  // take a performance hit at startup rather than a potentially
  // confusing halt when a user tries to load permissions.

  'use strict';

  var imports = {},
      stores = {},
      models = $scope.models = {};

  //initilaisation var  

  imports.units = {
    tables : {'unit' : { columns : ['id', 'name', 'description', 'has_children', 'parent'] }}
  };


  imports.users = {
    tables: {'user': {columns:['id', 'username', 'email', 'password', 'first', 'last', 'logged_in']}}
  };
  // The add namespace
  $scope.add = {};

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
      stores.users.post(data);
    }, function (err) {
      messenger.danger("Error:" + JSON.stringify(err)); 
    });
  };

  // the edit namespace
  $scope.edit = {};

  $scope.editReset = function () {
    $scope.editInfo(stores.users.get($scope.edit.id));
  };

  $scope.editSubmit = function () {
    delete $scope.edit.password_verify;
    delete $scope.edit.validPassword;
    connect.basicPost('user', [connect.clean($scope.edit)], ['id'])
    .then(function (res) {
      messenger.info('Successfully edited user : ' + res.data.insertId);
      stores.users.put($scope.edit);
      $scope.editInfo($scope.edit);
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
        stores.users.remove(user.id);
      }, function (err) {
        messenger.danger('Error:' + JSON.stringify(err));  
      });
    }
  };

  // permissions data
 
  $scope.permission = {}; 
  $scope.permission.permission_change = false;
  
  $scope.editPermission = function (user) {
    $scope.permission.id_user = user.id;
    connect.req({
      identifier : 'id_unit',
      tables : { 'permission' : { columns : ['id', 'id_unit'] }},
      where : ['permission.id_user='+user.id]
    })
    .then(function (store) {
      messenger.success('Loaded data for user ' + user.id);
      stores.permissions = store;
      $scope.models.permissions = store.data;
      setSavedPermissions();
      $scope.action = "permission";
    }, function (err) {
      messenger.danger('Error: Failed to load permission data for user' + user.id);
      $scope.action = "permission";
    });
  };

  function setSavedPermissions () {
    if (!models.permissions || !models.units) return; 
    var units = models.units;
    units.forEach(function (unit) {
      // loop through permissions and check each module that 
      // the user has permission to.
      unit.checked = !!stores.permissions.get(unit.id);
    });
  }

  $scope.savePermissions = function () {
    var id_user = $scope.permission.id_user;
    var units = models.units;
    var savedPermissions = stores.permissions;
    var toSave = [],
        toRemove = [];
    units.forEach(function (unit) {
      if (unit.checked && !savedPermissions.get(unit.id)) {
        toSave.push({ id_unit : unit.id, id_user : id_user});
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
      $q.all(
        toSave.map(function (perm) {
          return connect.basicPut('permission', [perm]);
        })
      ).then(function (res) {
        messenger.success('Successfully updated permissions for user ' + id_user);
      }, function (err) {
        messenger.danger('Error in updateing user permissions for user ' + id_user);   
      });
    }, function (err) {
      messenger.danger('Error in updating user permissions for user ' + id_user);
    });


  };

  function getChildren (id) {
    return $scope.models.units.filter(function (unit) {
      return unit.parent === id;
    });
  }

  $scope.toggleChildren = function toggleChildren (unit) {
    $scope.permission.permission_change = true;
    console.log($scope.permission.permission_change);
    unit.children.forEach(function (child) {
      child.checked = unit.checked;
    });
  };

  $scope.filterChildren = function (unit) {
    return unit.parent === 0;
  };
  
  function run () {
    var dependencies = ['units', 'users'];
    
    $q.all([
      connect.req(imports.units),
      connect.req(imports.users)
    ])
    .then(function (array) {
      for (var i = array.length - 1; i >= 0; i--) {
        stores[dependencies[i]] = array[i];
        $scope.models[dependencies[i]] = array[i].data;
      }
     
      // remove the root node 
      stores.units.remove(0);

      //order the data.
      $scope.models.units.forEach(function (unit) {
        unit.children = getChildren(unit.id);
      }); 
      
    });
  }

  run();

});
