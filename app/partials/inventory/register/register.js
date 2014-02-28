angular.module('kpk.controllers')
.controller('inventoryRegister', [
  '$scope',
  'appstate',
  'connect',
  '$q',
  '$modal',
  'messenger',
  'validate',
  function ($scope, appstate, connect, $q, $modal, messenger, validate) {

    var dependencies = {};

    dependencies.account = {
      required : true,
      query : {
        tables: {
          'account' : {
            columns: ['enterprise_id', 'id', 'account_number', 'locked', 'account_txt', 'account_type_id']
          }
        },
      }
    };

    dependencies.inventory_unit = {
      required : true,
      query : {
        tables : {
          'inventory_unit': {
            columns: ['id', 'text']
          }
        }
      }
    };

    dependencies.inventory_group = {
      required: true,
      query : {
        tables: {
          'inventory_group': {
            columns: ['id', 'name', 'code', 'sales_account', 'cogs_account', 'stock_account', 'tax_account']
          }
        }
      }
    };
  
    dependencies.inventory = {
      query : {
        tables: {
          'inventory': {
            columns: ['enterprise_id', 'id', 'code', 'text', 'price', 'group_id', 'unit_id', 'unit_weight', 'unit_volume', 'stock', 'stock_max', 'stock_min', 'consumable']
          }
        },
      }
    };

    dependencies.inventory_type = {
      required : true,
      query : {
        tables: {
          'inventory_type': {
            columns: ['id', 'text']
          }
        }
      }
    };

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.inventory.query.where =
        ['inventory.enterprise_id=' + enterprise.id];
      dependencies.account.query.where =
        ['account.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(buildStores, handleErrors);
    });

    function handleErrors(err) {
      messenger.danger('An error occurred:' + err);
    }

    function buildStores(stores) {
      for (var k in stores) { $scope[k] = stores[k]; }

      $scope.item = {};
      $scope.item.unit_weight = 0;
      $scope.item.unit_volume = 0;
    }

    $scope.reset = function reset () {
      $scope.item =  {};
      $scope.item.unit_weight = 0;
      $scope.item.unit_volume = 0;
    };

    $scope.submit = function () {
      $scope.item.enterprise_id = $scope.enterprise.id;
      console.log($scope.inventory.$valid);
      // if ($scope.inventory.$valid) {
        connect.basicPut('inventory', [connect.clean($scope.item)])
        .then(function (result) {
          $scope.item.id = result.data.insertId;
          $scope.inventory.post($scope.item);
          messenger.success('Posted item successfully');
        }, function (err) {
          messenger.danger('An error occured' + err);
        });
        $scope.reset();
      // } else {
        // for (var k in $scope.inventory) {
          // if ($scope.inventory[k].$invalid) {
            // $scope.invalid[k] = 'true';
            // TODO: make css classes depend on this. Color
            // red for error on each input if $invalid.
          // }
        // }
      // }
    };

    // New Type Instance Modal/Controller
    $scope.newUnitType = function () {
      var instance = $modal.open({
        templateUrl: 'unitmodal.html',
        controller: 'inventoryUnit',
        resolve: {
          unitStore: function() {
            return $scope.inventory_unit;
          }
        }
      });

      instance.result.then(function (unit) {
        $scope.inventory_unit.post(unit);
      });

    };

    $scope.newInventoryGroup = function () {
      var instance = $modal.open({
        templateUrl: 'inventorygroupmodal.html',
        controller: 'inventoryGroup',
        resolve: {
          groupStore: function () {
            return $scope.inventory_group;
          },
          accountModel: function () {
            return $scope.account.data;
          }
        }
      });

      instance.result.then(function (model) {
        $scope.inventory_group.post(model);
        messenger.success('Submitted Successfully');
      }, function () {
      });
    };

  }
]);
