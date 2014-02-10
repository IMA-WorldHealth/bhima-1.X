angular.module('kpk.controllers')
.controller('debitorGroup', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  'validate',
  function ($scope, $q, connect, appstate, messenger, validate) {
    'use strict';

    var dependencies = {};
    $scope.data = {};

    dependencies.debitor_group = {
      query : {
        tables : {
          'debitor_group' : {
            columns : ['id', 'name', 'account_id', 'location_id', 'payment_id', 'phone', 'email', 'note', 'locked', 'tax_id', 'max_credit', 'type_id', 'is_convention']
          }
        }
      }
    };

    dependencies.account = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt', 'account_type_id']
          }
        }
      }
    };

    dependencies.payment = {
      query : {
        tables : {
          'payment' : {
            columns: ['id', 'text']
          }
        }
      }
    };

    dependencies.types = {
      required : true,
      query : {
        tables : {
          'debitor_group_type' : {
            columns : ['id', 'type']
          }
        }
      }
    };
   
    dependencies.location = {
      query : '/location/'
    };


    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.debitor_group.query.where = 
        ['debitor_group.enterprise_id=' + enterprise.id];
      dependencies.account.query.where =
        ['account.locked<>1', 'AND', 'account.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(setUpModels, handleErrors);
    });

    function handleErrors (err) {
      messenger.danger('Error:' + JSON.stringify(err));
    }

    function setUpModels (models) {
      for (var k in models) $scope[k] = models[k];
      $scope.action = '';
    }

    $scope.formatAccount = function formatAccount (account) {
      return [account.account_number, account.account_txt].join(' :: ');
    };

    $scope.formatLocation = function formatLocation (location) {
      return [location.village, location.sector, location.province, location.country].join(', ');
    };

    $scope.new = function () {
      $scope.newGroup = {};
      $scope.action = 'new'; 
    };

    $scope.edit = function (group) {
      $scope.editGroup = angular.copy(group);
      $scope.edit_original = group;
      $scope.action = 'edit'; 
    };

    $scope.lock = function (group) {
      connect.basicPost('debitor_group', [{id: group.id, locked: group.locked}], ["id"])
      .catch(function (err) {
        messenger.danger('Error : ', JSON.stringify(err)); 
      });
    };

    $scope.submitNew = function () {
      $scope.newGroup.enterprise_id = $scope.enterprise.id; 
      var data = connect.clean($scope.newGroup);
      connect.basicPut('debitor_group', [data])
      .success(function (res) {
        data.id = res.insertId;
        $scope.debitor_group.post(data);
        $scope.action = '';
      })
      .catch(function (err) {
        messenger.danger('Error :' + JSON.stringify(err)); 
      });
    };

    $scope.resetNew = function () {
      $scope.newGroup = {};
    };

    $scope.submitEdit =  function () {
      var data = connect.clean($scope.editGroup);
      connect.basicPost('debitor_group', [data], ['id'])
      .success(function (res) {
        $scope.debitor_group.put(data);
        $scope.action = '';
        $scope.editGroup = {}; // reset
      })
      .catch(function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    };

    $scope.resetEdit = function () {
      $scope.editGroup = angular.copy($scope.edit_original);  
    };

  }
]);
