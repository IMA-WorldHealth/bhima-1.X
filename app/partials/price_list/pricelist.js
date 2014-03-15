angular.module('kpk.controllers')
.controller('priceList', [
  '$scope',
  '$q',
  '$filter',
  'connect',
  'messenger',
  'appstate',
  'validate',
  'uuid',
  function ($scope, $q, $filter, connect, messenger, appstate, validate, uuid) {
    var dependencies = {}, stores = {};
    var enterprise;

    $scope.session = {
      action : 'default',
      selected : null
    };

    dependencies.priceList = {
      query : {
        identifier : 'uuid',
        tables : {'price_list' : {columns:['uuid', 'title', 'description']}}
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
    
      console.log('list', list);
      dependencies.priceListItems = {
        query : {
          identifier: 'uuid',
          tables : {'price_list_item' : {columns:['uuid', 'item_order', 'description', 'value', 'is_discount', 'is_global', 'price_list_uuid']}},
          where : ['price_list_item.price_list_uuid=' + list.uuid]
        }
      };
      validate.process(dependencies).then(processListItems);

      $scope.session.action = 'item';
      $scope.session.selected = list;
      $scope.session.deleteQueue = [];
    }

    function processListItems(model) {
      var defaultItem = {
        is_discount : '0',
        is_global : '0'
      };

      $scope.session.listItems = model.priceListItems.data;
      $scope.session.listCache = angular.copy($scope.session.listItems);

      $scope.session.listItems.sort(function (a, b) { return (a.item_order === b.item_order) ? 0 : (a.item_order > b.item_order ? 1 : -1); });
      if($scope.session.listItems.length === 0) $scope.session.listItems.push(defaultItem);
    }

    function addItem() {
      var defaultItem = {
        is_discount : '0',
        is_global : '0'
      };

      $scope.session.listItems.push(defaultItem);
    }

    function shiftDown(item) {
      var list = $scope.session.listItems, index = list.indexOf(item);

      if(index < list.length - 1) {
        list.splice(index, 1);
        list.splice(index + 1, 0, item);
      }
    }

    function shiftUp(item) {
      var list = $scope.session.listItems, index = list.indexOf(item);

      if(index > 0) {
        list.splice(index, 1);
        list.splice(index - 1, 0, item);
      }
    }

    function deleteItem(item) {
      var list = $scope.session.listItems;
      if(list.length > 1) {
        list.splice(list.indexOf(item), 1);
        if(item.uuid) $scope.session.deleteQueue.push(item.uuid);
      } else {
        messenger.warning($filter('translate')("PRICE_LIST.WARN"));
      }
    }

    function saveItems() {
      var verify, priceList = $scope.session.selected;
      var uploadPromise = [];

      // Verify items
      var invalidData = $scope.session.listItems.some(function (item, index) {
        if(!item.price_list_uuid) item.price_list_uuid = priceList.uuid;
        item.item_order = index;
  
        if(isNaN(Number(item.value))) return true;
        if(!item.description || item.description.length===0) return true;

        return false;
      });

      if(invalidData) return messenger.danger($filter('translate')('PRICE_LIST.INVALID_ITEMS'));

      // FIXME single request for all items
      $scope.session.listItems.forEach(function (item) {
        var request, uploadItem = connect.clean(item);
        console.log('UPDATING', item);
        if(item.uuid) {
          request = connect.basicPost('price_list_item', [uploadItem], ['uuid']);
        } else {
          uploadItem.uuid = uuid();
          console.log('adding uuid', uploadItem.uuid);
          request = connect.basicPut('price_list_item', [uploadItem]);
        }
        uploadPromise.push(request);
      });
    
      $scope.session.deleteQueue.forEach(function (itemId) {
        uploadPromise.push(connect.basicDelete('price_list_item', itemId, 'uuid'))
      });

      $q.all(uploadPromise).then(function (result) {
  
        // FIXME Redownload to prove DB state - remove (horrible use of bandwidth)
        editItems(priceList);
        messenger.success($filter('translate')('PRICE_LIST.LIST_SUCCESS'));
      }, function (error) {
        messenger.danger($filter('translate')('PRICE_LIST.LIST_FAILURE'));
      });
    }

    function editMeta (list) {
      $scope.edit = {};
      $scope.session.action = 'meta';
      $scope.session.selected = list;
      $scope.edit = angular.copy(list);
    }

    function saveMeta () {
      connect.basicPost('price_list', [connect.clean($scope.edit)], ['uuid'])
      .then(function (res) {
        messenger.success($filter('translate')('PRICE_LIST.EDITED_SUCCES'));
        $scope.model.priceList.put($scope.edit);
      
        $scope.session.selected = null;
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
      $scope.add.uuid = uuid();
      connect.basicPut('price_list', [connect.clean($scope.add)])
      .then(function (result) {
        var finalList;

        finalList = connect.clean($scope.add);

        $scope.model.priceList.post(finalList);
        editItems(finalList);
  
        messenger.success($filter('translate')('PRICE_LIST.POSTED'));
      }, function (err) {
        messenger.danger('Error:' + JSON.stringify(err));
      });
    }

    $scope.resetAdd = function () {
      $scope.add = {};
    };

    function removeList (list){
      var confirmed = confirm($filter('translate')('PRICE_LIST.DELETE_CONFIRM'));
      if(!confirmed) return;

      connect.basicDelete('price_list', list.uuid, 'uuid')
      .then(function(v){
        if (v.status === 200){
          $scope.model.priceList.remove(list.uuid);
          messenger.success($filter('translate')('PRICE_LIST.REMOVE_SUCCESS'));
        }
      }, function(error) { 
        //FIXME Temporary 
        if (error.status===500) { 
          messenger.danger($filter('translate')('PRICE_LIST.UNABLE_TO_DELETE'), 6000);
        };
      });
    }

    $scope.editMeta = editMeta;
    $scope.saveMeta = saveMeta;
    $scope.resetMeta = resetMeta;

    $scope.editItems = editItems;
    $scope.addItem = addItem;
    $scope.saveItems = saveItems;
    $scope.shiftUp = shiftUp;
    $scope.shiftDown = shiftDown;
    $scope.deleteItem = deleteItem;

    $scope.addList = addList;
    $scope.saveAdd = saveAdd;
    $scope.removeList = removeList;
  }
]);
