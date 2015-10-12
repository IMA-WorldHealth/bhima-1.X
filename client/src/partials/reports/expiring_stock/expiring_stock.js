angular.module('bhima.controllers')
.controller('ReportStockExpirationsController', ReportStockExpirationsController);

ReportStockExpirationsController.$inject = [
  '$http', '$window', 'DateService'
];

/**
* This controller is responsible for display data on stock that will soon be
* expiring in our inventory.  The report is filterable by a specific depot if
* required.
*
* @controller ReportStockExpirationsController
*/
function ReportStockExpirationsController($http, $window, Dates) {
  var vm = this;

  // bind variables to scope
  vm.state = 'default';
  vm.start = new Date();
  vm.end = new Date();
  vm.loading = false;

  // bind methods
  vm.print = function () { $window.print(); };
  vm.search = search;
  vm.reconfigure = reconfigure;

  // startup the module
  initialise();

  /* ------------------------------------------------------------------------ */

  // performs the initial data requests
  function initialise() {
    getDepots()
    .then(function (data) {
      vm.depots = data;
    })
    .catch(handler);
  }

  // generic error handler
  function handler(error) {
    console.log(error);
  }

  // downloads a list of depots from the server-side HTTP API.
  function getDepots() {
    return $http.get('/depots')
    .then(function (response) { return response.data; });
  }

  // fire off a search for matching drug expirations
  function search() {

    // toggle loading
    vm.loading = true;

    // if we have a depot defined, search on the depot.  Else,
    // search the entire inventory
    var url = vm.depot ?
      '/depots/' + vm.depot.uuid + '/expirations?' :
      '/inventory/expirations';

    // fetch data from teh server
    $http.get(url, {
      params : {
        start : Dates.util.str(vm.start),
        end   : Dates.util.str(vm.end)
      }
    })
    .then(function (response) {
      vm.expirations = response.data;
      vm.state = 'generate';
    })
    .catch(handler)
    .finally(function () {
      vm.loading = false;
    });
  }

  // trigger a reconfiguration of the report
  function reconfigure() {
    vm.state = 'default';
  }
}
