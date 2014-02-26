angular.module('kpk.controllers')
.controller('priceList', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'appstate',
  'validate',
  function ($scope, $q, connect, messenger, appstate, validate) {
    var dependencies = {}, stores = {};
    var enterprise; 
    
    $scope.session = { 
      action : 'default',
      selected : null  
    };

    dependencies.priceList = {
      query : {
        tables : {'price_list' : {columns:['id', 'name', 'discount', 'note']}}
      }
    };

    appstate.register('enterprise', loadDependencies);

    function loadDependencies(enterpriseResult) { 
      enterprise = $scope.enterprise = enterpriseResult;
      
      // Set condition
      dependencies.priceList.query.where  = ['price_list.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(priceList);
    }

    function priceList(model) { 
      $scope.model = model;
    }
    
    function editItems(list) { 
      $scope.details = {data:[]};
      $scope.session.action = 'item';
      $scope.session.selected = list;
    }

    function addItem() { 
      $scope.details.data.push({});
    }
    // function init (model) {
    //   for (var k in model) { $scope[k] = model[k]; }
    // }

    function editMeta (list) {
      $scope.edit = {};
      $scope.session.action = 'meta';
      $scope.session.selected = list;
      $scope.edit = angular.copy(list);
    }

    function saveMeta () {
      connect.basicPost('price_list', [connect.clean($scope.edit)], ['id'])
      .then(function (res) {
        messenger.success('Successfully edited price list');
        $scope.price_list.put($scope.edit);
        $scope.session.action = '';
      }, function (err) {
        messenger.danger('error:' + JSON.stringify(err));
      });
    }

    function resetMeta  () {
      $scope.edit = {};
    }

    function addList () {
      $scope.add = {};
    
      $scope.session.action = 'add';
      $scope.session.selected = null;
    }

    function saveAdd () {
      $scope.add.enterprise_id = $scope.enterprise.id;
      connect.basicPut('price_list', [connect.clean($scope.add)])
      .then(function (result) {
        var finalList;

        $scope.add.id = result.data.insertId;
        finalList = connect.clean($scope.add);

        $scope.model.priceList.post(finalList);
        editItems(finalList);
        
        messenger.success('Posted new price list!');
      }, function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    }

    $scope.resetAdd = function () {
      $scope.add = {};
    };

    function isValid (item) {
      return angular.isDefined(item.inventory_id) &&
        angular.isDefined(item.amount);
    }

    function removeList (list){
      connect.basicDelete('price_list', list.id, 'id')
      .then(function(v){
        if (v.status === 200){
          $scope.price_list.remove(list.id);
          messenger.success('Price list removed !');
        }
      });
    }

    $scope.editMeta = editMeta;
    $scope.saveMeta = saveMeta;
    $scope.resetMeta = resetMeta;

    $scope.editItems = editItems;
    $scope.addItem = addItem;

    $scope.addList = addList;
    $scope.saveAdd = saveAdd;
    $scope.isValid = isValid;
    $scope.removeList = removeList;
  }
]);
