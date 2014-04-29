angular.module('kpk.controllers')
.controller('stock.review', [
  '$scope',
  '$location',
  'validate',
  'appstate',
  'connect',
  'messenger',
  'util',
  function ($scope, $location, validate, appstate, connect, messenger, util) {
    var session = $scope.session = {};

    appstate.register('project', function (project) {
      $scope.project = project;
      angular.extend(session, appstate.get('stock.review'));
    });


    function processStock () {
      var stocks = [];
      session.lots.data.forEach(function (stock) {
        stocks.push({
          inventory_uuid : stock.inventory_uuid,
          purchase_price : stock.purchase_price,
          expiration_date : stock.expiration_date,
          entry_date : util.convertToMysqlDate(new Date()),
          lot_number : stock.lot_number,
          purchase_order_uuid : stock.purchase_order_uuid,
          tracking_number : stock.tracking_number,
          quantity : stock.quantity
        });
      });

      return stocks;
    }

    function processMovements () {
      var movements = [];
      session.lots.data.forEach(function (stock) {
        movements.push({
          document_id : 1,
          tracking_number : stock.tracking_number,
          direction : 'Enter',
          date : util.convertToMysqlDate(new Date()),
          quantity : stock.quantity,
          depot_id : session.depot.id,
          destination: session.depot.id
        });
      });

      return movements;
    }

    $scope.submit = function () {
      var stock = processStock();
      var movements = processMovements();
      connect.basicPut('stock', stock)
      .then(function () {
        return connect.basicPut('stock_movement', movements);
      })
      .then(function () {
        messenger.success("STOCK.ENTRY.WRITE_SUCCESS");
      })
      .catch(function (error) {
        console.log(error);
        messenger.error("STOCK.ENTRY.WRITE_ERROR");
      });
    };

  }
]);
