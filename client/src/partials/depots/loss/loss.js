angular.module('bhima.controllers')
.controller('DepotLossController', DepotLossController);

DepotLossController.$inject = [
  '$routeParams', '$q', '$http', '$location', 'connect', 'util', 'DepotService',
  'InventoryService', 'SessionService', 'QueueFactory'
];

function DepotLossController($routeParams, $q, $http, $location, connect, Depots, Inventory, Session, Queue) {
  var vm = this;

  // bind variables
  vm.depotId = $routeParams.depotId;
  vm.date = new Date();
  vm.queue = new Queue();
  vm.user = Session.user;
  vm.enterprise = Session.enterprise;
  vm.totals = { cost : 0 };

  // bind methods
  vm.retotal = retotal;
  vm.remove = remove;
  vm.add = function () { vm.queue.enqueue({}); };


  initialise();
  /* ------------------------------------------------------------------------ */

  // generic error handler
  function handler(error) {
    console.log(error);
  }

  // called to initialize the module
  function initialise() {

    // keys to associate data to on the view
    var keys = [
      'depot',
      'lots',
      'inventory'
    ];

    $q.all([
      Depots.getDepots(vm.depotId),
      Depots.getAvailableStock(vm.depotId),
      Inventory.getInventoryItems()
    ])
    .then(function (requests) {

      // bind data to view
      requests.forEach(function (data, idx) {
        console.log(keys[idx], data);
        vm[keys[idx]] = data;
      });

    })
    .catch(handler)
    .finally(function () { vm.loading = false; });
  }

  function remove(idx) {
    var item,
        i = 0,
        removed = vm.queue.dequeue(idx);

    // ensure that the inventory item has actually been selected.
    if (!removed.code) { return; }

    // linear search: find the inventory item that we just dequeued by linearly
    // searching through the inventory for a matching code
    do {
      item = vm.inventory[i++];
    } while (removed.code !== item.code);

    // set the item to be visible again in the typeahead
    item.used = false;
  }

  // this function totals the items in the queue
  function retotal() {

    // FIXME: ironic name.  So, so close @jniles
    vm.totals.cost = vm.queue.queue.reduce(function (accumulator, row) {
      return accumulator + (row.price * row.quantity);
    }, 0);
  }
}
