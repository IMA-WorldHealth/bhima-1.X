angular.module('kpk.controllers')
.controller('creditorGroupCtrl', function ($scope, connect, messenger) {
  'use strict';
  
  var models = $scope.models = {},
      flags = $scope.flags = {},
      stores = {};

  var newgroup = $scope.newgroup = {};

  function handleErrors (error) {
    messenger.danger('Error: ' + JSON.stringify(error));
  }

  // init
  function run () {
    connect.req({tables : {'account':{ columns: ["id", "account_number", "account_txt"]}}})
    .then(function (store) {
      models.account = store.data;
      stores.account = store;
      messenger.success('Successfully Loaded:  accounts');
    }, handleErrors);

    connect.req({tables: {'creditor_group' : { columns: ["id", "group_txt", "account_id", "locked"]}}})
    .then(function (store) {
      models.creditor_group = store.data;
      stores.creditor_group = store;
      messenger.success('<b>Successfully Loaded</b>: creditor_group', 5000);
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

  function valid() {
    return angular.isDefined($scope.newgroup.account_id) && angular.isDefined($scope.newgroup.group_txt);
  }

  function save () {

    if (!valid()) {
      messenger.warning('You haven\'t entered all the data!');
      return;
    } 

    newgroup = connect.clean($scope.newgroup);
    if (flags.edit) {
      connect.basicPost('creditor_group', [newgroup], ['id']).then(function (response) {
        messenger.info('Successfully POSTed. id:'+response.data.insertId);
      }, function (error) {
        messenger.danger('Error in POSTing:' + JSON.stringify(error));  
      });
    } else {
      connect.basicPut('creditor_group', [newgroup]).then(function (response) {
        messenger.info('Successfully PUT. id:' + response.data.insertId);
      }, function (error) {
        messenger.danger('Error in putting: ' + JSON.stringify(error));  
      });
      models.creditor_group.push(newgroup);
    }
    flags.name = newgroup.group_txt;
    $scope.newgroup = {};
  }

  function lock (group) {
    connect.basicPost('creditor_group', [{id: group.id, locked: group.locked}], ["id"]);
  }

  run();

  $scope.formatAccount = formatAccount;
  $scope.formatGroupAccount = formatGroupAccount;
  $scope.editGroup = editGroup;
  $scope.newGroup = newGroup;
  $scope.save = save;
  $scope.lock = lock;

});
