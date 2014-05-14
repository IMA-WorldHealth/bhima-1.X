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

    session.depotId = $routeParams.depotId;

    cache.fetch('order')
    .then(function (order) {
      session.lots = [];
      order.data.forEach(function (order) { session.lots = session.lots.concat(order.lots); });
    })
    .catch(function (err) {
      console.log(err);
    });

    appstate.register('project', function (project) {
      $scope.project = project;
      angular.extend(session, appstate.get('stock.data'));
      session.valid = !!appstate.get('stock.data');
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
          purchase_order_uuid : stock.purchase_order_uuid,
          tracking_number     : stock.tracking_number,
          quantity            : stock.quantity
        });
      });

      return stocks;
    }

    function processMovements () {
      var movements = [];
      var doc_id = uuid();
      session.lots.forEach(function (stock) {
        movements.push({
          document_id     : doc_id,
          tracking_number : stock.tracking_number,
          direction       : 'Enter',
          date            : util.convertToMysqlDate(new Date()),
          quantity        : stock.quantity,
          depot_id        : session.depotId,
          destination     : session.depotId
        });
      });

      return movements;
    }

    function invalid () {
    }

    $scope.submit = function () {
      var stock = processStock();
      var movements = processMovements();
      connect.basicPut('stock', stock)
      .then(function () {
        return connect.basicPut('stock_movement', movements);
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
