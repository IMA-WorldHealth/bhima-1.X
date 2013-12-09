angular.module('kpk.controllers').controller('inventoryRegisterController', function ($scope, appstate, connect, $q, $modal) {

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
    initia();
    function initia(){
      $q.all([
      connect.req(account_defn),
      connect.req(inv_unit_defn),
      connect.req(inv_group_defn),
      connect.req(inv_type_defn),
      connect.req(inv_defn)
    ]).then(init);
    }

    

    var stores = {},
      models = ['account', 'inv_unit', 'inv_group', 'inv_type', 'inventory'],
      item;
    $scope.models = {};
    $scope.item = item = {};

    function init(arr) {
      for (var i = 0, l = arr.length; i < l; i++) {
        stores[models[i]] = arr[i];
        $scope.models[models[i]] = arr[i].data;
      }

      item.unit_weight = 0;
      item.unit_volume = 0;
      item.enterprise_id = eid; //101; // FIXME: maybe
      //console.log('line 2144', stores.account); console.log('line 2144', stores.inv_unit);
      //console.log($scope.models.account);
    }


    function reset () {
      $scope.item = item = {};
      item.unit_weight = 0;
      item.unit_volume = 0;
    }

    $scope.submit = function () {
      if ($scope.inventory.$valid) {
        item.id = stores.inventory.generateid(); 
        stores.inventory.put(item);
        console.log("line 2151 controllerjs item:", item);
        item.enterprise_id = appstate.get("enterprise").id;
        connect.basicPut('inventory', [item]);
        stores.inventory.post(item);
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

    $scope.logStore = function () {
      console.log(stores.inv_group.data); 
    };

    // New Type Instance Modal/Controller
    $scope.newUnitType = function () {
      var instance = $modal.open({
        templateUrl: 'unitmodal.html',
        controller: function($scope, $modalInstance, unitStore) {
          var unit = $scope.unit = {};
          $scope.units = unitStore.data;
          console.log('line 2177 units', unitStore);

          $scope.submit = function () {
            // validate
            $scope.unit.id = unitStore.generateid();
            if (unit.text) {
              // process
              var text = unit.text.toLowerCase();
              text = text[0].toUpperCase() + text.slice(1);
              unit.text = text;

              /*unitStore.put(unit);
              connect.basicPut('inv_unit', [{id: unit.id, text: unit.text}]); //FIXME: AUGHAUGH*/
              $modalInstance.close({id: unit.id, text: unit.text});
            }
          };

          $scope.discard = function () {
            $modalInstance.dismiss(); 
          };

        },
        resolve: {
          unitStore: function() { return stores.inv_unit; }
        }
      });

      instance.result.then(function (value) {
        //unitStore.put(unit);
        connect.basicPut('inv_unit', [value]);
        initia();
        //console.log("Submitted Successfully.");
      }, function () {
        console.log("Closed Successfully."); 
      });
    };

    $scope.newInventoryGroup = function () {
      var instance = $modal.open({
        templateUrl: "inventorygroupmodal.html",
        controller: function ($scope, $modalInstance, groupStore, accountModel) {
          var group = $scope.group = {},
            clean = {},
            cols = ["id", "name", "symbol", "sales_account", "cogs_account", "stock_account", "tax_account"];

          $scope.accounts = accountModel;

          $scope.submit = function () {
            group.id = groupStore.generateid();
            cols.forEach(function (c) { clean[c] = group[c]; }); // FIXME: AUGHGUGHA
            groupStore.put(group);
            //fix me for writting this in a good way
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
            clean.symbol = clean.symbol[0];
            connect.basicPut('inv_group', [clean]);
            $modalInstance.close(clean);
          };

          $scope.discard = function () {
            $modalInstance.dismiss(); 
          };

        },
        resolve: {
          groupStore: function () { return stores.inv_group; },
          accountModel: function () { return $scope.models.account; }
        }
      });

      instance.result.then(function (model) {
        console.log("Closed with:", model);
        stores.inv_group.post(model);
        console.log("Submitted Successfully.");
      }, function () {
        console.log("Closed Successfully."); 
      });
    };

    $scope.reset = function () {
      reset();
    };

  });
