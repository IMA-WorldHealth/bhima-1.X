angular.module('kpk.controllers')
.controller('stock.entry.review', [
  '$scope',
  '$location',
  '$routeParams',
  'validate',
  'appstate',
  'connect',
  'messenger',
  'util',
  'uuid',
  'appcache',
  function ($scope, $location, $routeParams, validate, appstate, connect, messenger, util, uuid, AppCache) {
    var session = $scope.session = {};
    var cache = new AppCache('stock.entry');

    if (!angular.isDefined($routeParams.depotId)) {
      messenger.error('NO_DEPOT_ID');
    }

    session.timestamp = new Date();

    session.depotId = $routeParams.depotId;

    cache.fetch('order')
    .then(function (order) {
      session.lots = order.data;
      session.cfg = order.cfg;
      session.totals = order.totals;
      session.cfg.document_id = uuid();
    })
    .catch(function (err) {
      console.log(err);
    });

    appstate.register('project', function (project) {
      $scope.project = project;
    });

    function processStock () {
      var stocks = [];
      session.lots.forEach(function (stock) {
        stocks.push({
          inventory_uuid      : stock.inventory_uuid,
          //purchase_price      : stock.purchase_price,
          expiration_date     : util.convertToMysqlDate(stock.expiration_date),
          entry_date          : util.convertToMysqlDate(new Date()),
          lot_number          : stock.lot_number,
          purchase_order_uuid : session.cfg.purchase_uuid,
          tracking_number     : stock.tracking_number,
          quantity            : stock.quantity
        });
      });

      return stocks;
    }

    function processMovements () {
      var movements = [];
      session.lots.forEach(function (stock) {
        movements.push({
          uuid : uuid(),
          document_id     : session.cfg.document_id,
          tracking_number : stock.tracking_number,
          date            : util.convertToMysqlDate(new Date()),
          quantity        : stock.quantity,
          depot_entry     : session.cfg.depot.id,
        });
      });

      return movements;
    }

    $scope.submit = function () {
      var stock = processStock();
      var movements = processMovements();
      connect.basicPut('stock', stock)
      .then(function () {
        return connect.basicPut('movement', movements);
      })
      .then(function () {
        return connect.basicPost('purchase', [{ uuid : session.cfg.purchase_uuid, paid : 1 }], ['uuid']);
      })
      .then(function () {
        messenger.success("STOCK.ENTRY.WRITE_SUCCESS");
      })
      .catch(function (error) {
        messenger.error("STOCK.ENTRY.WRITE_ERROR");
      });
    };

  }
]);
