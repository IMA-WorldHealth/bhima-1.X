angular.module('bhima.controllers')
.controller(
  'DepotDistributionsCancelController', DepotDistributionsCancelController
);

DepotDistributionsCancelController.$inject = ['$routeParams', '$location', 'connect', 'messenger'];

/**
* This controller is responsible for canceling (or reversing) stock
* dispercements that were made in error.  It should be used in proportion to
* the number of errors made by pharmacists.
*
* @constructor
* @class StockDistributionsCancelController
*/
function DepotDistributionsCancelController($routeParams, $location, connect, messenger) {
  var vm = this;

  // bind to view
  vm.documentId  = $routeParams.consumptionId;
  vm.depotId      = $routeParams.depotId;
  vm.submit       = submit;
  vm.loading      = false;

  // startup the module by loading the distribution record
  load(vm.depotId, vm.documentId);

  /* ------------------------------------------------------------------------ */

  function handler(error) {
    console.error(error);
  }

  function submit() {
    connect.fetch('journal/reversing_stock/' + vm.documentId)
    .then(function (response) {

      // flip the canceled switch in the database
      var data = {
        document_id : vm.documentId,
        canceled : 1
      };

      return connect.put('consumption', [data], ['document_id']);
    })
    .then(function (){
      messenger.success('annulee avec success', false);
      $location.path('/depots/' + vm.depotId + '/reports/distributions/patients');
    })
    .catch(handler);
  }

  function load(depotId, documentId) {
    vm.loading = true;
    connect.fetch('/depots/' + depotId + '/distributions/' + documentId)
    .then(function (data) {
      vm.data = data;
      vm.reference = data[0];
    })
    .catch(handler)
    .finally(function () { vm.loading = false; });
  }
}
