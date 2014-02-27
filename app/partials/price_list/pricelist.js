angular.module('kpk.controllers')
.controller('priceList', [
  '$scope',
  '$q',
  '$filter',
  'connect',
  'messenger',
  'appstate',
  'validate',
  function ($scope, $q, $filter, connect, messenger, appstate, validate) {
    var dependencies = {}, stores = {};
    var enterprise; 
    
    $scope.session = { 
      action : 'default',
      selected : null
    };

    dependencies.priceList = {
      query : {
        tables : {'price_list' : {columns:['id', 'title', 'description']}}
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
          tables : {'price_list_item' : {columns:['id', 'item_order', 'description', 'value', 'is_discount', 'is_global', 'price_list_id']}},
          where : ['price_list_item.price_list_id=' + list.id]
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
      }
      
      $scope.session.listItems = model.priceListItems.data; 
      $scope.session.listCache = angular.copy($scope.session.listItems);
      
      $scope.session.listItems.sort(function (a, b) { return (a.item_order === b.item_order) ? 0 : (a.item_order > b.item_order ? 1 : -1); });
      if($scope.session.listItems.length === 0) $scope.session.listItems.push(defaultItem);
    }

    function addItem() { 
      var defaultItem = { 
        is_discount : '0',
        is_global : '0'
      }
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
        if(item.id) $scope.session.deleteQueue.push(item.id);
      } else { 
        messenger.warning($filter('translate')("PRICE_LIST.WARN"));
      }
    }

    function saveItems() { 
      var verify, priceList = $scope.session.selected;
      var uploadPromise = [];

      // Verify items
      invalidData = $scope.session.listItems.some(function (item, index) { 
        if(!item.price_list_id) item.price_list_id = priceList.id;
        item.item_order = index;
        
        if(isNaN(Number(item.value))) return true;
        if(!item.description || item.description.length===0) return true;

        return false;
      });

      if(invalidData) return messenger.danger($filter('translate')('PRICE_LIST.INVALID_ITEMS'));
      
      // FIXME single request for all items
      $scope.session.listItems.forEach(function (item) { 
        var request, uploadItem = connect.clean(item);

        if(item.id) { 
          request = connect.basicPost('price_list_item', [uploadItem], ['id']); 
        } else { 
          request = connect.basicPut('price_list_item', [uploadItem]);
        }
        uploadPromise.push(request); 
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
      connect.basicPost('price_list', [connect.clean($scope.edit)], ['id'])
      .then(function (res) {
        messenger.success($filter('translate')('PRICE_LIST.EDITED_SUCCES'));
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
        
        messenger.success($filter('translate')('PRICE_LIST.POSTED'));
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
      var confirmed = confirm($filter('translate')('PRICE_LIST.DELETE_CONFIRM'));
      if(!confirmed) return; 

      connect.basicDelete('price_list', list.id, 'id')
      .then(function(v){
        if (v.status === 200){
          $scope.model.priceList.remove(list.id);
          messenger.success($filter('translate')('PRICE_LIST.REMOVE_SUCCESS'));
        }
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
    $scope.isValid = isValid;
    $scope.removeList = removeList;
  }
]);
