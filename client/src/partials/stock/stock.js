angular.module('bhima.controllers')
.controller('stock.main', MainStockController);

MainStockController.$inject = [
  '$scope', '$location', '$translate', '$window', 'messenger',
  'appcache', 'StockDataService'
];

/**
* Main Stock Controller
*
* This module is actually the main depot controller (we should rename it).  It
* allows a user to choose a depot (persistent across sessions), and perform
* actions relative to that selection.  It also provides a list of links to
* other modules that contain depot-specific actions or reports.
*
* To add links to this module, consider the following flowchart:
*   Action specific to a warehouse? - add to warehouseModules object
*   Action shared between all pharmacies? - add to sharedModules object
*   Report? - add to reports object
*   Utility? - add to utilities oject
*/
function MainStockController($scope, $location, $translate, $window, messenger, AppCache, StockDataService) {
  var vm = this; // TODO complete migration of the to 'controller as' syntax

  var config, dependencies = {};
  var session = $scope.session = {
    configured : false,
    configure : false
  };

  var cache = new AppCache('stock.in');

  config = $scope.config = {};

  // these modules are shared between warehouses and regular pharmacies
  config.sharedModules = [{
    key : 'STOCK.INTEGRATION.KEY',
    ico : 'glyphicon-th-large',
    link : '/depots/:uuid/integrations'
  }, {
    key : 'STOCK.EXIT.KEY',
    ico : 'glyphicon-export',
    link : '/depots/:uuid/distributions/patients'
  }, {
    key : 'STOCK.EXIT_SERVICE.KEY',
    ico : 'glyphicon-export',
    link : '/depots/:uuid/distributions/services'
  }, {
    key : 'STOCK.LOSS.KEY',
    ico : 'glyphicon-cloud',
    link : '/depots/:uuid/losses'
  }, {
    key : 'STOCK.MOVEMENT.KEY',
    ico : 'glyphicon-transfer',
    link : '/depots/:uuid/movements'
  }];

  // these will be concatenated with the config modules if the depot chosen is
  // a warehouse, since they present warehouse-specific functionality
  config.warehouseModules = [{
    key  : 'STOCK.ENTRY.KEY',
    ico  : 'glyphicon-import',
    link : '/stock/entry/start/:uuid'
  }, {
    key  : 'STOCK.DONATION.KEY',
    ico  : 'glyphicon-heart',
    link : '/stock/donation_management/:uuid'
  }];

  // utility modules
  config.utilities = [{
    key  : 'DEPOT.DISTRIBUTION.PATIENTS',
    ico  : 'glyphicon-th-list',
    link : '/depots/:uuid/reports/distributions/patients'
  }, {
    key : 'DEPOT.DISTRIBUTION.SERVICES',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/reports/distributions/services'
  }, {
    key : 'DEPOT.DISTRIBUTION.RUMMAGE',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/reports/distributions/rummage'
  }, {
    key : 'DEPOT.DISTRIBUTION.LOSSES',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/reports/distributions/loss'
  }];

  config.reports = [{
    key : 'REPORT.STOCK',
    ico : 'glyphicon-list-alt',
    link : '/reports/stock_store/:uuid'
  }, {
    key : 'STOCK.DISTRIBUTION_RECORDS.KEY',
    ico : 'glyphicon-list-alt',
    link : '/reports/distribution_record/:uuid'
  }, {
    key : 'STOCK.DISTRIBUTION_SERVICE_RECORDS.KEY',
    ico : 'glyphicon-list-alt',
    link : '/reports/distribution_service_record/:uuid'
  }, {
    key : 'STOCK.LOSS.LOSS_RECORDS',
    ico : 'glyphicon-list-alt',
    link : '/stock/loss_record/:uuid'
  }];

  function initialise() {
    StockDataService.getDepots()
    .then(function (response) {
      $scope.depots = response.data;
      loadDefaultDepot();
    })
    .catch(handler);
  }

  // fetch the cached depot from appcache
  function loadDefaultDepot() {
    cache.fetch('depot')
    .then(function (depot) {
      if (depot) {

        if (!depot) {
          messenger.danger($translate.instant('DEPOT.NOT_FOUND'), 8000);
          cache.remove('depot', depot);
          session.configure = true;
          return;
        }

        $scope.depot = depot;

        session.configured = true;

        warehouseModules();

      } else {
        session.configure = true;
      }
    })
    .catch(handler);
  }

  function handler(err) {
    messenger.danger(JSON.stringify(err));
  }

  // load in warehouse modules, if appropriate.  Otherwise, just load
  // the shared modules
  function warehouseModules() {
    if ($scope.depot && $scope.depot.is_warehouse) {
      config.modules = config.warehouseModules.concat(config.sharedModules);
    } else {
      config.modules = config.sharedModules;
    }
  }

  // better version of load path, that allows uuid to be in arbitrary places.
  $scope.loadPath = function (defn) {
    var path = defn.link.replace(':uuid', $scope.depot.uuid);
    $location.path(path);
  };

  $scope.setDepot = function (depot) {
    var message = $translate.instant('STOCK.MAIN.CONFIRM');
    var verifySet = $window.confirm(message + ' ' + depot.text);
    if (!verifySet) { return; }

    cache.put('depot', depot);
    $scope.depot = depot;
    warehouseModules();
    session.configured = true;
    session.configure = false;
  };

  $scope.reconfigure = function () {
    var verifyConfigure =
          confirm('Are you sure you want to change the depot for Stock Management? The current depot is \'' + $scope.depot.text + '\'');

    if (!verifyConfigure) { return; }

    $scope.depot = null;

    cache.remove('depot');
    session.configured = false;
    session.configure = true;
  };

  // startup the controller
  initialise();
}
