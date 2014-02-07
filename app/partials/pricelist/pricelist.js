angular.module('kpk.controllers')
.controller('priceListController', function ($scope, $q, connect, messenger, appstate, validate) {
  'use strict';

 //variables and init
 
  var dependencies = {},
      stores = {};

  $scope.action = '';

  dependencies.price_list = {
    query : {
      tables : {'price_list' : {columns:['id', 'name', 'discount', 'note']}
    }
    }
  };

  //fonctions

  function run (model) {
    for (var k in model) $scope[k] = model[k];
  };

  function editMeta (list) {
    $scope.edit = {};
    $scope.action = 'meta';
    $scope.edit = angular.copy(list);
  };

  function saveMeta () {
    connect.basicPost('price_list', [connect.clean($scope.edit)], ['id'])
    .then(function (res) {
      messenger.success('Successfully edited price list');
      $scope.price_list.put($scope.edit);
      $scope.action = '';
    }, function (err) {
      messenger.danger('error:' + JSON.stringify(err));
    });
  };

  function resetMeta  () {
    $scope.edit = {};
  };

  function addList () {
    $scope.add = {};
    $scope.action = 'add';
  };

  function saveAdd () {
    $scope.add.enterprise_id = $scope.enterprise.id;
    connect.basicPut('price_list', [connect.clean($scope.add)])
    .then(function (result) {
      messenger.success('Posted new price list!');
      $scope.add.id = result.data.insertId;
      $scope.price_list.post(connect.clean($scope.add));
      $scope.action = '';
    }, function (err) {
      messenger.danger('Error:' + JSON.stringify(err));
    });
  };

  $scope.resetAdd = function () {
    $scope.add = {}; 
  };

  function isValid (item) {
    return angular.isDefined(item.inventory_id) &&
      angular.isDefined(item.amount);
  };

  function removeList (list){
    connect.basicDelete('price_list', list.id, 'id')
      .then(function(v){
        if(v.status === 200){
         $scope.price_list.remove(list.id);
         console.log('objet a manupiler', v);
         messenger.success('Price list removed !');
        }
      });
  }

  appstate.register('enterprise', function (enterprise) {
    $scope.enterprise = enterprise;
    dependencies.price_list.query.where  = ['price_list.enterprise_id='+enterprise.id];
    validate.process(dependencies).then(run);
  });



  //exposition

  $scope.editMeta = editMeta;
  $scope.saveMeta = saveMeta;
  $scope.resetMeta = resetMeta;
  $scope.addList = addList;
  $scope.saveAdd = saveAdd;
  $scope.isValid = isValid;
  $scope.removeList = removeList;
});
