angular.module('kpk.controllers')
.controller('updateStock', function ($scope, $filter, validate, connect, messenger) {
  var dependencies = {}, selectedStock;
  var session = $scope.session = {
    search: true
  };

  dependencies.inventory = {
    query : {
      tables : {
        inventory : { columns : ['uuid', 'code', 'text', 'price', 'group_uuid', 'unit_id'] }
                    // origin_stamp
      }
    }
  };

  // dependencies.history = {
  //   query : {
  //     tables : {
  //       inventory_log : { columns : ['log_timestamp', 'price', 'code'] }
  //     }
  //   }
  // }

  validate.process(dependencies).then(updateStock);

  function updateStock(model) {
    $scope.model = model;
  }

  function selectStock(uuid) {
    selectedStock = $scope.selectedStock = $scope.model.inventory.get(uuid);
    $scope.cachePrice = angular.copy(selectedStock.price);
  }

  function loadStock(id) {
    session.search = false;

    // dependencies.history.when = ['inventory_id=' + id];
    // validate.process(dependencies).then(displayHistory);
  }

  // function displayHistory(model) {}

  function refreshSession() {
    session.search = true;
    selectedStock = $scope.selectedStock = null;
    $scope.session.stockSearch = '';
  }

  function submitUpdate() {
    var updateLine = connect.clean(selectedStock);
 
    // basic validation
    if(isNaN(Number(updateLine.price))) return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_PRICE'));
 
    // if(updateLine.code==='') return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_CODE'));
    // if(updateLine.text==='') return messenger.danger($filter('translate')('UPDATE_STOCK.INVALID_TEXT'));
 
    console.log(selectedStock, updateLine);
    connect.basicPost('inventory', [updateLine], ['uuid']).then(function (res) {
      messenger.success($filter('translate')('UPDATE_STOCK.UPDATE_SUCCESS'));
      $scope.cachePrice = angular.copy(selectedStock.price);
    }, function (err) {
      messenger.danger($filter('translate')('UPDATE_STOCK.UPDATE_FAILUER'));
    });
  }

  $scope.loadStock = loadStock;
  $scope.selectStock = selectStock;
  $scope.refreshSession = refreshSession;
  $scope.submitUpdate = submitUpdate;
});
