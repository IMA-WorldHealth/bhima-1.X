angular.module('kpk.controllers')
.controller('creditorGroupCtrl', function ($scope, connect, appstate, messenger) {
  'use strict';
  
  var imports = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      stores = {};

  imports.enterprise = appstate.get('enterprise'); // TODO : use Steve's validation module ensure this works
  imports.account = {
    tables : { 'account':{ columns: ["id", "account_number", "account_txt"]}},
    where : ['account.enterprise_id=' + imports.enterprise.id]
  };
  imports.creditor_group = {
    tables: {'creditor_group' : { columns: ["id", "name", "account_id", "locked"]}},
    where : ['creditor_group.enterprise_id=' + imports.enterprise.id]
  };

  var newgroup = $scope.newgroup = {};

  function handleErrors (error) {
    messenger.danger('Error: ' + JSON.stringify(error));
  }

  // init
  function run () {
    connect.req(imports.account)
    .then(function (store) {
      models.account = store.data;
      stores.account = store;
      messenger.success('Successfully Loaded:  accounts');
    }, handleErrors);

    connect.req(imports.creditor_group)
    .then(function (store) {
      models.creditor_group = store.data;
      stores.creditor_group = store;
      messenger.success('<b>Successfully Loaded</b>: creditor_group');
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
    return angular.isDefined($scope.newgroup.account_id) && angular.isDefined($scope.newgroup.name);
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
      if (!imports.enterprise) return messenger.danger('No enterprise data loaded!');
      newgroup.enterprise_id = imports.enterprise.id;
      connect.basicPut('creditor_group', [newgroup]).then(function (response) {
        messenger.info('Successfully PUT. id:' + response.data.insertId);
      }, function (error) {
        messenger.danger('Error in putting: ' + JSON.stringify(error));  
      });
      models.creditor_group.push(newgroup);
    }
    flags.name = newgroup.name;
    $scope.newgroup = {};
  }

  function lock (group) {
    connect.basicPost('creditor_group', [{id: group.id, locked: group.locked}], ["id"])
    .then(function (success) {
    }, function (err) {
      group.locked = group.locked === 0 ? 1 : 0;
      messenger.danger('Lock operation failed');
    });
  }

  run();

  $scope.formatAccount = formatAccount;
  $scope.formatGroupAccount = formatGroupAccount;
  $scope.editGroup = editGroup;
  $scope.newGroup = newGroup;
  $scope.save = save;
  $scope.lock = lock;

});
