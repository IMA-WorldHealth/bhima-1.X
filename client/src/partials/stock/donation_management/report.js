angular.module('bhima.controllers')
.controller('donation_management.report', [
  '$scope',
  '$routeParams',
  '$window',
  'validate',
  'appstate',
  function ($scope, $routeParams, $window, validate, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    session.timestamp = new Date();

    dependencies.donations = {
      query : {
        tables : {
          movement  : { columns : ['uuid','depot_entry', 'tracking_number', 'quantity']},
          donations : { columns : ['date']},
          inventory : { columns : ['code']},
          stock     : { columns : ['lot_number','expiration_date', 'entry_date']},
          donor     : { columns : ['name']},
          depot     : { columns : ['reference','text']}
        },
        join : [
          'movement.depot_entry=depot.uuid',
          'donations.donor_id=donor.id',
          'inventory.uuid=stock.inventory_uuid',
          'stock.tracking_number=donations.tracking_number',
          'movement.tracking_number=stock.tracking_number',
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
      session.total = $scope.donations.data.reduce(sum, 0);
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      session.documentId = $routeParams.documentId;
      if (!session.documentId) { return; }
      dependencies.donations.query.where = ['movement.document_id=' + session.documentId];
      validate.process(dependencies)
      .then(startup);
    });

  }]);
