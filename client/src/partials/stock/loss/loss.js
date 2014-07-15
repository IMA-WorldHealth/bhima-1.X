angular.module('bhima.controllers')
.controller('stock.loss', [
  '$scope',
  '$routeParams',
  'validate',
  'appstate',
  'uuid',
  function ($scope, $routeParams, validate, appstate, uuid) {
    /* jshint unused : false */
    var session = $scope.session = {};
    var depotId;

    var dependencies = {};

    depotId  = $routeParams.depotId;
    session.block = !angular.isDefined(depotId);

    var consumptionFields = {
      uuid            : '',
      depot_uuid      : '',
      date            : '',
      document_id     : '',
      tracking_number : '',
      quantity        : ''
    };

    var consumptionLossFields = {
      uuid             : '',
      consumption_uuid : '',
      document_uuid    : ''
    };

    function startup() {
      $scope.document = {
        uuid            : uuid(),
        depot_uuid      : depotId,
        date            : new Date(),
        document_id     : '',
        tracking_number : '',
        quantity        : 0
      };

      $scope.items = [];
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      startup();
    });
  
  }
]);
