angular.module('kpk.controllers')
.controller('inventoryGroup', [
  '$scope',
  '$modalInstance',
  'connect',
  'groupStore',
  'accountModel',
  'messenger',
  function ($scope, $modalInstance, connect, groupStore, accountModel, messenger) {
    var group = $scope.group = {},
      cols = ['name', 'symbol', 'sales_account', 'cogs_account', 'stock_account', 'tax_account'];

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
        messenger.danger('Error creating new group' + error);
      });
    };

    $scope.discard = function () {
      $modalInstance.dismiss();
    };
  }
])
