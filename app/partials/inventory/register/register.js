angular.module('kpk.controllers')
.controller('inventoryRegisterController', function ($scope, appstate, connect, $q, $modal) {
  'use strict';

  var account_defn, inv_unit_defn, inv_group_defn, inv_defn, inv_type_defn;
  var eid = appstate.get('enterprise').id;

  account_defn= {
    tables: {'account': {columns: ['enterprise_id', 'id', 'account_number', 'locked', 'account_txt', 'account_type_id']}},
    where: ["account.enterprise_id=" + eid]
  };

  inv_unit_defn = {
    tables : {'inv_unit': { columns: ["id", "text"] }}
  };

  inv_group_defn = {
    tables: {'inv_group': { columns: ['id', 'name', 'symbol', 'sales_account', 'cogs_account', 'stock_account', 'tax_account']}}
  };

  inv_defn = {
    tables: {'inventory': { columns: ['enterprise_id', 'id', 'code', 'text', 'price', 'group_id', 'unit_id', 'unit_weight', 'unit_volume', 'stock', 'stock_max', 'stock_min', 'consumable']}},
    where: ["inventory.enterprise_id=" + eid]
  };

  inv_type_defn = {
    tables: {'inv_type': { columns: ['id', 'text']}}
  };

  var stores = {},
      models = ['account', 'inv_unit', 'inv_group', 'inv_type', 'inventory'],
      item = $scope.item = {};
  $scope.models = {};

  function init() {
    $q.all([
      connect.req(account_defn),
      connect.req(inv_unit_defn),
      connect.req(inv_group_defn),
      connect.req(inv_type_defn),
      connect.req(inv_defn)
    ]).then(function (arr) {

      for (var i = 0, l = arr.length; i < l; i++) {
        stores[models[i]] = arr[i];
        $scope.models[models[i]] = arr[i].data;
      }

      item.unit_weight = 0;
      item.unit_volume = 0;
      item.enterprise_id = eid; //101; // FIXME: maybe
    });
  }


  function reset () {
    $scope.item = item = {};
    item.unit_weight = 0;
    item.unit_volume = 0;
  }

  $scope.submit = function () {
    item.enterprise_id = eid;
    if ($scope.inventory.$valid) {
      connect.basicPut('inventory', [item])
      .then(function (result) {
        console.log("Added new item successfully");
        item.id = result.data.insertId;
        stores.inventory.post(item);
      }, function (error) {
        console.error(error);
      });
      reset();
    } else {
      for (var k in $scope.inventory) {
        if ($scope.inventory[k].$invalid) {
          $scope.invalid[k] = "true"; 
          // TODO: make css classes depend on this. Color
          // red for error on each input if $invalid.
        } 
      }
    }
  };

  // New Type Instance Modal/Controller
  $scope.newUnitType = function () {
    var instance = $modal.open({
      templateUrl: 'unitmodal.html',
      controller: 'inventoryUnitCtrl',
      resolve: {
        unitStore: function() { return stores.inv_unit; }
      }
    });

    instance.result.then(function (unit) {
      stores.inv_unit.post(unit);
    }, function () {
      console.log("Dismissed Successfully."); 
    });
  };

  $scope.newInventoryGroup = function () {
    var instance = $modal.open({
      templateUrl: 'inventorygroupmodal.html',
      controller: 'inventoryGroupCtrl',
      resolve: {
        groupStore: function () { return stores.inv_group; },
        accountModel: function () { return $scope.models.account; }
      }
    });

    instance.result.then(function (model) {
      stores.inv_group.post(model);
      console.log("Submitted Successfully.");
    }, function () {
      console.log("Closed Successfully."); 
    });
  };

  $scope.reset = function () {
    reset();
  };

  init();

})

.controller('inventoryGroupCtrl', function ($scope, $modalInstance, connect, groupStore, accountModel) {
  var group = $scope.group = {},
    cols = ["name", "symbol", "sales_account", "cogs_account", "stock_account", "tax_account"];

  $scope.accounts = accountModel;

  $scope.submit = function () {
    var clean = {};
    cols.forEach(function (c) { clean[c] = group[c]; }); // FIXME: AUGHGUGHA
    //FIXME: writing this in a good way
    clean.sales_account = clean.sales_account.id;
    if (clean.cogs_account) {
      clean.cogs_account = clean.cogs_account.id;
    }
    if (clean.stock_account) {
      clean.stock_account = clean.stock_account.id;
    }
    if (clean.tax_account) {
      clean.tax_account = clean.tax_account.id;
    }

    clean.symbol = clean.symbol[0].toUpperCase();

    connect.basicPut('inv_group', [clean])
    .then(function (result) { 
      clean.id = result.data.insertId;
      $modalInstance.close(clean);
    }, function (error) {
      console.error('Error creatig new group:', error);
    });
  };

  $scope.discard = function () {
    $modalInstance.dismiss(); 
  };
})

.controller('inventoryUnitCtrl', function($scope, $modalInstance, connect, unitStore) {
  var unit = $scope.unit = {};
  $scope.units = unitStore.data;

  $scope.submit = function () {
    // validate
    if (unit.text) {
      // process
      var text = unit.text.toLowerCase();
      text = text[0].toUpperCase() + text.slice(1);
      unit.text = text;
      connect.basicPut('inv_unit', [unit])
      .then(function (result) {
        console.log("Posted new unit successfully");
        unit.id = result.data.insertId;
        $modalInstance.close(unit);
      }, function (error) {
        console.error("Error posting new unit type:", error);
        $modalInstance.dismiss();
      });
    }
  };

  $scope.discard = function () {
    $modalInstance.dismiss(); 
  };

});

