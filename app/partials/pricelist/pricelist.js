angular.module('kpk.controllers')
.controller('priceListController', function ($scope, $q, connect, messenger, appstate, validate) {
  'use strict';

  var dependencies = {},
      stores = {};

  $scope.action = '';

  dependencies.lists = {
    required : true,
  };

  dependencies.types = {
    required : true,
    query : {
      tables: {
        'inv_type' : {
          columns : ['id', 'text']
        }
      }
    } 
  };

  dependencies.groups = {
    required : true,
    query : {
      tables : {
        'inv_group' : {
          columns : ['id', 'name', 'symbol']
        }
      }
    }
  };

  dependencies.inventory = {
    required : true, 
    query : {
      tables : {
        'inventory' : {
          columns : ['id', 'text', 'group_id', 'type_id', 'code']
        }
      },
    }
  };

  appstate.register('enterprise', function (enterprise) {
    $scope.enterprise = enterprise;
    dependencies.lists.query = '/price_list/' + enterprise.id;
    dependencies.inventory.query.where = ['inventory.enterprise_id=' + enterprise.id];
    validate.process(dependencies).then(run);
  });

  function run (model) {
    for (var k in model) $scope[k] = model[k];
  }

  $scope.editMeta = function (list) {
    $scope.edit = {};
    $scope.action = 'meta';
    $scope.edit = angular.copy(list);
  };

  $scope.saveMeta = function () {
    var count = $scope.edit.count;
    delete $scope.edit.count;
    connect.basicPost('price_list', [connect.clean($scope.edit)], ['id'])
    .then(function (res) {
      messenger.success('Successfully edited price list');
      $scope.edit.count = count; 
      $scope.lists.put($scope.edit);
      $scope.action = '';
    }, function (err) {
      messenger.danger('error:' + JSON.stringify(err));
    });
  };

  $scope.resetMeta = function  () {
    $scope.edit = {};
  };

  $scope.addList = function () {
    $scope.add = {};
    $scope.action = 'add';
  };

  $scope.saveAdd = function () {
    $scope.add.enterprise_id = $scope.enterprise.id;
    connect.basicPut('price_list', [connect.clean($scope.add)])
    .then(function (result) {
      messenger.success('Posted new price list!');
      $scope.add.id = result.data.insertId;
      $scope.add.count = 0;
      $scope.lists.post(connect.clean($scope.add));
      $scope.action = '';
    }, function (err) {
      messenger.danger('Error:' + JSON.stringify(err));
    });
  };

  $scope.resetAdd = function () {
    $scope.add = {}; 
  };

  $scope.removeList = function (list) {
    connect.basicDelete('price_list', list.id)
    .then(function (success) {
      messenger.success('Delete the price list.');
      $scope.lists.remove(list.id);
    }, function (err) {
      messenger.danger('Error:' + JSON.stringify(err)); 
    });
  };


  // items namespaces

  $scope.editItems = function (list) {
    connect.req({
      tables : {
        'price_list_detail' : {columns : ['id', 'list_id', 'inventory_id', 'amount', 'percent', 'note']}
      },
      where : ['price_list_detail.list_id=' + list.id]
    })
    .then(function (model) {
      $scope.details = model;
      $scope.action = 'item';
      $scope.detail_list = list;
    });
  };

  $scope.filterInventory = function (item) {
    var list = $scope.detail_list;
    var bool = angular.isDefined(list.inventory_group) ? item.group_id === list.inventory_group : true;
    return bool && angular.isDefined(list.inventory_type) ? item.type_id === list.inventory_type : true;
  };

  $scope.addItem = function () {
    $scope.details.data.push({ editing: true});
  };

  $scope.removeItem = function (idx) {
    // make sure item exists in the database,
    // or if it volitile
    var item = $scope.details.data[idx];
    if (angular.isDefined(item.id)) {
      connect.basicDelete('price_list_detail', $scope.details.data[idx].id)
      .then(function (result) {
        $scope.details.data.splice(idx, 1);
        $scope.lists.get($scope.detail_list.id).count -= 1; 
      }, function (err) {
        messenger.danger('Failed to delete item:', $scope.details.data[idx].id);
      });
    } else $scope.details.data.splice(idx, 1);
  };

  $scope.editItem = function (item) {
    item.editing = true;
  };

  $scope.$watch('details.data', function () {
    // only lets you save if there is nothing being edited
    if (!$scope.details || !$scope.details.data) return;
    $scope.canSave = $scope.details.data.every(function (item) {
      return !item.editing; 
    }); 
  }, true);

  $scope.isValid = function (item) {
    return angular.isDefined(item.inventory_id) &&
      angular.isDefined(item.note) &&
      angular.isDefined(item.amount);
  };

  $scope.saveList = function () {
    // save any changes
    var newItems = [];
    var updateItems = [];
    // this discovers update changes and 
    // new items.  New items are easy -- they do not have
    // ids.  Anything with an id has had a round trip
    // into the db and back.
    $scope.details.data.forEach(function (item) {
      if (angular.isDefined(item.id) && angular.isDefined(item.editing)) {
        delete item.editing;
        updateItems.push(connect.clean(item));
      }

      if (!angular.isDefined(item.id) && angular.isDefined(item.editing)) {
        delete item.editing;
        item.list_id = $scope.detail_list.id;
        newItems.push(connect.clean(item));
      }

    });

    // normalize with promises

    var promise_new = new $q.defer(),
        promise_update = new $q.defer();

    if (newItems.length) {
      connect.basicPut('price_list_detail', [newItems])
      .then(function (res) {
        promise_new.resolve();
      }, function (err) {
        promise_new.reject(err); 
      }); 
    } else promise_new.resolve();

    if (updateItems.length) {
      // TODO : Make it so that we can do this in one query
      // loop through everything and send update queries
      $q.all(updateItems.map(function (row) {
        return connect.basicPost('price_list_detail', [row], ['id']);
      }))
      .then(function (res) {
        promise_update.resolve(res);
      }, function (err) {
        promise_update.reject(err); 
      });
    } else promise_update.resolve();
  
    $q.all([
      promise_new,
      promise_update
    ]).then(function (res) {
      messenger.success('Successfully posted changes.');
      // We can update the count of items
      $scope.lists.get($scope.detail_list.id).count = newItems.length;
    }, function (err) {
      messenger.danger('Error. ' + JSON.stringify(err));
    });

  };

});
