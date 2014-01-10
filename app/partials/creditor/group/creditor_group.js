angular.module('kpk.controllers')
.controller('creditorGroupCtrl', function ($scope, connect, messenger) {
  'use strict';
  
  var models = $scope.models = {},
      flags = $scope.flags = {},
      stores = {};

  var newgroup = $scope.newgroup = {};

  function handleErrors (error) {
    messenger.push({type: 'danger', msg: 'Error: ' + error});
  }

  // init
  function run () {
    connect.req({tables : {'account':{ columns: ["id", "account_number", "account_txt"]}}})
    .then(function (store) {
      models.account = store.data;
      stores.account = store;
      messenger.push({ type: 'success', msg: 'Successfully Loaded:  accounts'});
    }, handleErrors);

    connect.req({tables: {'creditor_group' : { columns: ["id", "group_txt", "account_id", "locked"]}}})
    .then(function (store) {
      models.creditor_group = store.data;
      stores.creditor_group = store;
      messenger.push({ type: 'success', msg: 'Successfully Loaded: creditor_group'});
    }, handleErrors);
  }

  function formatAccount (account) {
    return [account.account_number, account.account_txt].join(' -- ');
  }

  function formatGroupAccount (id) {
    return stores.account ? stores.account.get(id).account_number : '';
  }

  function editGroup (group) {
    flags.edit = true;
    $scope.newgroup = group;
  }

  function newGroup () {
    flags.edit = false;
    $scope.newgroup = {};
  }

  function save () {

    newgroup = connect.clean($scope.newgroup);
    if (flags.edit) {
      connect.basicPost('creditor_group', [newgroup], ['id']).then(function (response) {
        flags.success = response.status == 200;
      });
    } else {
      connect.basicPut('creditor_group', [newgroup]).then(function (response) {
        flags.success = response.status == 200;
      });
      models.creditor_group.push(newgroup);
    }
    flags.name = newgroup.group_txt;
    newgroup = {};
  }

  function toggleSuccess () {
    flags.success = !flags.success;
  }

  function lock (group) {
    connect.basicPost('creditor_group', [{id: group.id, locked: group.locked}], ["id"]);
  }

  run();

  $scope.formatAccount = formatAccount;
  $scope.formatGroupAccount = formatGroupAccount;
  $scope.toggleSuccess = toggleSuccess;
  $scope.editGroup = editGroup;
  $scope.newGroup = newGroup;
  $scope.save = save;
  $scope.lock = lock;

});
