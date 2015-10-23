angular.module('bhima.controllers')
.controller('DepotLossController', DepotLossController);

DepotLossController.$inject = [
  '$routeParams', '$q', '$http', '$location', 'DepotService',
  'InventoryService', 'SessionService', 'QueueFactory'
];

function DepotLossController($routeParams, $q, $http, $location, Depots, Inventory, Session, Queue) {
  var vm = this;

  // bind variables
  vm.depotId = $routeParams.depotId;
  vm.date = new Date();
  vm.queue = new Queue();
  vm.user = Session.user;
  vm.enterprise = Session.enterprise;
  vm.totals = { cost : 0 };

  // bind methods
  vm.clear = clear;
  vm.retotal = retotal;
  vm.remove = vm.queue.dequeue; // NOTE -- this isn't actually necessary, but is
                                // done for symmetry with vm.add()
  vm.add = function () { vm.queue.enqueue({}); };
  vm.submit = submit;
  vm.filterUsedLots= filterUsedLots;

  initialise();
  /* ------------------------------------------------------------------------ */

  // generic error handler
  function handler(error) {
    console.log(error);
  }

  // called to initialize the module
  function initialise() {

    // add the first item to the queue
    vm.add();

    // send HTTP request
    $q.all([
      Depots.getDepots(vm.depotId),
      Depots.getAvailableStock(vm.depotId),
      Inventory.getInventoryItems()
    ])
    .then(function (responses) {
      var lots, inventory;

      vm.depot = responses[0];
      lots = responses[1];
      inventory = responses[2];

      // associate inventory items with lots
      inventory.forEach(function (i) {

        i.lots = lots.filter(function (s) {
          return s.code === i.code;
        })
        .map(function (s) {
          return {
            lot_number      : s.lot_number,
            fmtLabel        : s.lot_number + '  [' + s.quantity + ']',
            quantity        : s.quantity,
            tracking_number : s.tracking_number,
            expiration_date : new Date(Date.parse(s.expiration_date))
          };
        });

        // create a nicely formatted label for the typeahead
        i.fmtLabel = i.code + ' ' + i.label;
      });

      // expose to view
      vm.inventory = inventory;
    })
    .catch(handler)
    .finally(function () { vm.loading = false; });
  }

  // Totals the items in the queue, skipping those that are empty
  function retotal() {

    // FIXME: ironic name.  So, so close @jniles
    vm.totals.cost = vm.queue.queue.reduce(function (accumulator, row) {
      var hasData = row.item && row.item.price && row.quantity;
      return accumulator + (hasData ? (row.item.price * row.quantity) : 0);
    }, 0);
  }

  // clears the queue row at a given index in the queue  This is done to ensure
  // when a user changes an inventory item, all the other values in the row are
  // cleared, and we do not submit false information.
  function clear(idx) {

    // clear the user input values
    vm.queue.queue[idx].lot = null;
    vm.queue.queue[idx].price = null;
    vm.queue.queue[idx].quantity = 0;

    // Since we changed the values outside of angular's detection, re-run the
    // totalling function to calculate the correct totals.
    retotal();
  }

  // validate and submit the form
  function submit(invalid) {

    // NOTE -- angular validation will take care of all the missing and UI
    // validation portions.  If the form is invalid, simply return the function
    if (invalid) { return; }

    // do not submit a form with no data in it.
    if (vm.queue.length < 1) { return; }

    console.log(vm.queue);
  }

  // filters out lots that are in use
  // returns true to allow elements through, false removes them
  function filterUsedLots(value, index) {

    // contains a list of items
    var items = vm.queue.queue.filter(function (row, idx) {

      // filter out rows with not enough data
      if (!row.item || !row.lot) { return false; }

      // if we have a match, filter it out
      return row.lot.tracking_number === value.tracking_number;
    });

    return items.length === 2;
  }
}
