angular.module('kpk.controllers')
.controller('creditorGroupCtrl', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, connect, appstate, messenger, validate) {
    'use strict';

    var dependencies = {};

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns: ['id', 'account_number', 'account_txt']
          },
          'account_type' : {
            columns : ['type']
          }
        },
        join : ['account.account_type_id=account_type.id'] // TODO: add order by for accounts
      }
    };

    dependencies.groups = {
      required : true,
      query : {
        tables: {
          'creditor_group' : {
            columns: ["id", "name", "account_id", "locked"]
          }
        }
      }
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + enterprise.id];
      dependencies.groups.query.where =
        ['creditor_group.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(buildModels, handleErrors);
    });

    function handleErrors (err) {
      messenger.danger('An error occured: ' + JSON.stringify(err));
    }

    function buildModels (models) {
      for (var k in models) { $scope[k] = models[k]; }
      $scope.action = '';
      $scope.data = {};

      // for the orderBy to work appropriately
      $scope.accounts.data.forEach(function (account) {
        account.account_number = String(account.account_number);
      });
    }

    // the 'new' namespace

    $scope.newGroup = function () {
      $scope.action = 'new';
      $scope.new = {};
    };

    $scope.saveNew = function () {
      var data = connect.clean($scope.new);
      connect.basicPut('creditor_group', [data])
      .then(function (res) {
        data.id = res.data.insertId;
        $scope.groups.post(data);
      }, function (err) {
        messenger.danger('Error in putting: ' + JSON.stringify(err));
      });
    };

    $scope.resetNew = function () {
      $scope.new = {};
    };

    // the 'edit' namespace

    $scope.editGroup = function (group) {
      $scope.action = 'edit';
      $scope.edit = angular.copy(group);
      $scope.edit_copy = group;
    };

    $scope.saveEdit = function () {
      var data = connect.clean($scope.edit);
      connect.basicPost('creditor_group', [data], ['id'])
      .then(function (res) {
        $scope.groups.put(data);
      }, function (err) {
        messenger.danger('Error in updating creditor group ' + data.id);
      });
    };

    $scope.resetEdit = function () {
      $scope.edit = angular.copy($scope.edit_copy);
    };

    $scope.lock = function lock (group) {
      connect.basicPost('creditor_group', [{id: group.id, locked: group.locked}], ["id"])
      .then(function (success) {
      }, function (err) {
        group.locked = group.locked === 0 ? 1 : 0;
        messenger.danger('Lock operation failed');
      });
    };

  }
]);
