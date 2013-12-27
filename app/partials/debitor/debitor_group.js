angular.module('kpk.controllers')
.controller('debitorGroupCtrl', function ($scope, $q, connect, appstate) {
  'use strict';

  var imports = {},
      models = $scope.models = {},
      flags = $scope.flags = {},
      data = $scope.data = {},
      stores = {};

  imports.enterprise_id = appstate.get('enterprise').id;
 
  imports.debitor_group = {
    tables : { 'debitor_group' : { columns : ['id', 'name', 'account_id', 'location_id', 'payment_id', 'phone', 'email', 'note', 'locked', 'price_list_id', 'tax_id', 'max_credit', 'type_id']}},
    where : ['debitor_group.enterprise_id=' + imports.enterprise_id]
  };

  imports.account = {
    tables : { 'account' : { columns : ['id', 'account_number', 'account_txt']}},
    where : ['account.locked<>1', 'AND', 'account.enterprise_id=' + imports.enterprise_id]
  };
  
  imports.payment = {tables : { 'payment' : { columns: ['id', 'text'] }}};


  imports.type = {tables : { 'debitor_group_type' : { columns : ['id', 'type']}}};
  imports.price_list = {tables : { 'price_list_name' : { columns : ['id', 'name']}}};

  var dependencies = ['debitor_group', 'account', 'payment', 'type', 'price_list'];

  $q.all([
    connect.req(imports.debitor_group),
    connect.req(imports.account),
    connect.req(imports.payment),
    connect.req(imports.type),
    connect.req(imports.price_list)
  ]).then(initialize);

  function initialize (arr) {
    for (var i = 0; i < dependencies.length; i++) {
      stores[dependencies[i]] = arr[i];
      models[dependencies[i]] = arr[i].data;
    }

    connect.fetch('/location/')
    .then(function (result) {
      models.location = result.data;
    });
  }

  function formatAccount (account) {
    return [account.account_number, account.account_txt].join(' :: ');
  }

  function formatLocation (location) {
    return [location.village, location.sector, location.province, location.country].join(', ');
  }

  function invalid () {
    return $scope.dgForm.$invalid;
  }

  function newForm () {
    flags.edit = false;
    $scope.data = {};
  }

  function submitForm () {
    data = connect.clean($scope.data);
    if (flags.edit) {
      // update an item
      connect.basicPost('debitor_group', [data], ['id']).then(function (response) {
        console.log(response.status == 200 ? "Successful Update" : "Failure in Update --  status : " + respnse.status);
        stores.debitor_group.put(data);
      });
    } else {
      // new item
      data.id = stores.debitor_group.generateid();
      data.enterprise_id = imports.enterprise_id;
      connect.basicPut('debitor_group', [data]).then(function (response) {
        console.log(response.status == 200 ? "Successful Post" : "Failure in Post --  status : " + respnse.status);
        stores.debitor_group.post(data);
      });
    }
  }

  function displayAccount (id) {
    return stores.account ? stores.account.get(id).account_number : ''; 
  }

  function displayType (id) {
    return stores.type ? stores.type.get(id).type : '';
  }

  function editGroup (group) {
    flags.edit = true;
    $scope.data = group;
  }

  function lock (group) {
    connect.basicPost('debitor_group', [{id: group.id, locked: group.locked}], ["id"]);
  }

  $scope.newForm = newForm;
  $scope.submitForm = submitForm;
  $scope.editGroup = editGroup;
  $scope.formatAccount = formatAccount;
  $scope.formatLocation = formatLocation;
  $scope.displayAccount = displayAccount;
  $scope.displayType = displayType;
  $scope.invalid = invalid;
  $scope.lock = lock;

});
