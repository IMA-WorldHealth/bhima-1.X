angular.module('bhima.controllers')
.controller('stock.search', [
  '$scope',
  'connect',
  'appstate',
  'validate',
  'store',
  'messenger',
  function ($scope, connect, appstate, validate, Store, messenger) {
    var dependencies = {};
    var session = $scope.session = { search: true, totals : {} };
    var selectedStock;

    dependencies.inventory = {
      query : {
        identifier : 'uuid',
        tables : {
          inventory : { columns : ['uuid', 'code', 'text', 'price', 'purchase_price', 'group_uuid', 'unit_id'] }
        }
      }
    };

    function startup (models) {
      angular.extend($scope, models);
    }

    function error (err) {
      messenger.danger(err);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies, ['inventory'])
      .then(startup)
      .catch(error);
    });

    $scope.refreshSession = function refreshSession() {
      session.search = true;
      selectedStock = $scope.selectedStock = null;
      $scope.session.stockSearch = '';
    };

    $scope.loadStock = function loadStock (uuid) {
      selectedStock = $scope.selectedStock = $scope.inventory.get(uuid);
      session.search = false;
      connect.fetch('/reports/stock_location/?id=' + uuid)
      .success(function (data) {
        var stock = new Store({ data : [], identifier : 'tracking_number' });


        data.forEach(function (row) {
          if (!stock.get(row.tracking_number)) {
            row.total = 0;
            stock.post(row);
          }
          stock.get(row.tracking_number).total += row.direction === "Enter" ? row.quantity : -1 * row.quantity;
        });

        session.stock = stock;
      })
      .catch(error);
    };

    $scope.$watch('session.stock.data', function () {
      if (!session.stock || !session.stock.data) { return; }
      session.totals.quantity = 0;
      session.stock.data.forEach(function (row) {
        session.totals.quantity += row.quantity;
      });
    });

  }
]);
