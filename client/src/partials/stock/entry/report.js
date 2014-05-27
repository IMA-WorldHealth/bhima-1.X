angular.module('bhima.controllers')
.controller('stock.entry.report', [
  '$scope',
  '$routeParams',
  'validate',
  'appstate',
  function ($scope, $routeParams, validate, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.receipt = {
      query : {
        identifier : 'uuid',
        tables : {
          movement : {
            columns : ['uuid', 'depot_entry', 'tracking_number', 'quantity', 'date']
          },
          depot : {
            columns : ['reference', 'text']
          }
        },
        join : ['movement.depot_entry=depot.uuid']
      }
    };

    function startup(models) {
      angular.extend($scope, models);
    }

    appstate.register('project', function (project) {
      $scope.project = project;

      session.document_id = $routeParams.document_id;
      if (!session.document_id) { return; }

      dependencies.query.where =
        ['movement.document_id=' + session.documentId];

      validate.process(dependencies)
      .then(startup);
    });
  }
]);
