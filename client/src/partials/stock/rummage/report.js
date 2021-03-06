angular.module('bhima.controllers')
.controller('stock.rummage.report', [
  '$scope',
  '$routeParams',
  '$window',
  'validate',
  'appstate',
  function ($scope, $routeParams, $window, validate, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    session.timestamp = new Date();

    dependencies.receipt = {
      query : {
        identifier : 'uuid',
        tables : {
          consumption : {
            columns : ['uuid', 'depot_uuid', 'tracking_number', 'quantity', 'date']
          },
          stock : {
            columns : ['expiration_date', 'entry_date', 'lot_number', 'purchase_order_uuid']
          },
          inventory : {
            columns : ['code', 'text::inventory_text']
          },
          depot : {
            columns : ['reference', 'text']
          }
        },
        join : [
          'consumption.depot_uuid=depot.uuid',
          'consumption.tracking_number=stock.tracking_number',
          'stock.inventory_uuid=inventory.uuid'
        ]
      }
    };

    function sum(a, b) {
      return a + b.quantity;
    }

    $scope.print = function print() {
      $window.print();
    };

    function startup(models) {
      angular.extend($scope, models);

      session.depotEntry = $scope.receipt.data.length ? $scope.receipt.data[0].depot_entry : null;
      session.total = $scope.receipt.data.reduce(sum, 0);
    }

    appstate.register('project', function (project) {
      $scope.project = project;

      session.documentId = $routeParams.documentId;

      if (!session.documentId) { return; }

      dependencies.receipt.query.where =
        ['consumption.document_id=' + session.documentId];

      validate.process(dependencies)
      .then(startup);
    });
  }
]);
