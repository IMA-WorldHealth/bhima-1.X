angular.module('bhima.controllers')
.controller(
  'DepotDistributionsCancelController', DepotDistributionsCancelController
);

DepotDistributionsCancelController.$inject = ['$routeParams', 'connect'];

/**
* This controller is responsible for canceling (or reversing) stock
* dispercements that were made in error.  It should be used in proportion to
* the number of errors made by pharmacists.
*
* @constructor
* @class StockDistributionsCancelController
*/
function DepotDistributionsCancelController($routeParams, connect) {
  var vm = this;

  // bind to view
  vm.id      = $routeParams.consumptionId;
  vm.depotId = $routeParams.depotId;
  vm.submit  = submit;
  vm.loading = false;

  // startup the module by loading the distribution record
  load(vm.depotId, vm.id);

  /* ------------------------------------------------------------------------ */

  function handler(error) {
    console.error(error);
  }

  function submit() {
    connect.fetch('journal/reversing_stock/' + vm.id)
    .then(function (response) {

      // flip the canceled switch in the database
      var data = {
        document_id : vm.id,
        canceled : 1
      };

      return connect.put('consumption', 'document_id', data);
    })
    .catch(handler);
  }

  function load(depotId, consumptionId) {
    vm.loading = true;
    connect.fetch('/depots/' + depotId + '/distributions/' + consumptionId)
    .then(function (data) {
      vm.data = data;
      vm.reference = data[0];
    })
    .catch(handler)
    .finally(function () { vm.loading = false; });
  }
}
