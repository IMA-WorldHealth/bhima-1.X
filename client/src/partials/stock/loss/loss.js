angular.module('bhima.controllers')
.controller('stock.loss', [
  '$scope',
  '$routeParams',
  'validate',
  function ($scope, $routeParams, validate) {
    var session = $scope.session = {};
    var depotId;

    depotId  = $routeParams.depotId;
    session.block = !depotId;

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
 
  
  }
]);
