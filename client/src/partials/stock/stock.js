angular.module('bhima.controllers')
.controller('stock.main', MainStockController);

MainStockController.$inject = [
  '$scope', '$location', '$translate', '$window', 'validate', 'messenger',
  'appcache', 'SessionService'
];

function MainStockController($scope, $location, $translate, $window, validate, messenger, AppCache, Session) {
  var config, dependencies = {};
  var session = $scope.session = {
    configured : false,
    configure : false
  };

  var cache = new AppCache('stock.in');

  // load session variables
  $scope.enterprise = Session.enterprise;

  config = $scope.config = {};

  config.modules = [{
    key : 'STOCK.INTEGRATION.KEY',
    ico : 'glyphicon-th-large',
    link : '/stock/integration'
  }, {
    key : 'STOCK.EXIT.KEY',
    ico : 'glyphicon-export',
    link : '/stock/distribution'
  }, {
    key : 'STOCK.EXIT_SERVICE.KEY',
    ico : 'glyphicon-export',
    link : '/stock/distribution_service'
  }, {
    key : 'STOCK.LOSS.KEY',
    ico : 'glyphicon-cloud',
    link : '/stock/loss'
  }, {
    key : 'STOCK.MOVEMENT.KEY',
    ico : 'glyphicon-transfer',
    link : '/stock/movement'
  }];

  config.modules_warehouse = [{
    key  : 'STOCK.ENTRY.KEY',
    ico  : 'glyphicon-import',
    link : '/stock/entry/start'
  }, {
    key  : 'STOCK.DONATION.KEY',
    ico  : 'glyphicon-heart',
    link : '/stock/donation_management'
  }];

  config.utilities = [{
    key  : 'DEPOT.DISTRIBUTION.PATIENTS',
    ico  : 'glyphicon-th-list',
    link : '/depots/:uuid/distributions/patients'
  }, {
    key : 'DEPOT.DISTRIBUTION.SERVICES',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/distributions/services'
  }, {
    key : 'DEPOT.DISTRIBUTION.RUMMAGE',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/distributions/rummage'
  }, {
    key : 'DEPOT.DISTRIBUTION.LOSSES',
    ico : 'glyphicon-th-list',
    link : '/depots/:uuid/distributions/loss'
  }];

  config.reports = [{
    key : 'REPORT.STOCK',
    ico : 'glyphicon-list-alt',
    link : '/reports/stock_store'
  }, {
    key : 'STOCK.DISTRIBUTION_RECORDS.KEY',
    ico : 'glyphicon-list-alt',
    link : '/reports/distribution_record'
  }, {
    key : 'STOCK.DISTRIBUTION_SERVICE_RECORDS.KEY',
    ico : 'glyphicon-list-alt',
    link : '/reports/distribution_service_record'
  }, {
    key : 'STOCK.LOSS.LOSS_RECORDS',
    ico : 'glyphicon-list-alt',
    link : '/stock/loss_record'
  }];

  dependencies.depots = {
    required : true,
    query : {
      identifier : 'uuid',
      tables : {
        'depot' : {
          columns : [ 'uuid', 'reference', 'text', 'is_warehouse']
        }
      }
    }
  };

  // FIXME functions doing 100 things at once
  function initialise() {
    dependencies.depots.query.where = ['depot.enterprise_id=' + $scope.enterprise.id];

    validate.process(dependencies)
    .then(loadDefaultDepot);
  }

  function loadDefaultDepot (model) {
    angular.extend($scope, model);

    cache.fetch('depot')
    .then(function (depot) {
      if (depot) {

        var validDepot = model.depots.get(depot.uuid);

        if (!validDepot) {
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
    .catch(error);
  }

  function startup (models) {
    angular.extend($scope, models);
  }

  function error (err) {
    messenger.danger(JSON.stringify(err));
  }

  function warehouseModules(){
    if($scope.depot && $scope.depot.is_warehouse) {
      config.modules = config.modules_warehouse.concat(config.modules);
    }
  }

  $scope.loadPath = function (defn) {

    // build dynamically the report list links in report panel
    var isModules = (config.modules.indexOf(defn) > -1),
        isUtilities = (config.utilities.indexOf(defn) > -1),
        isReports = (config.reports.indexOf(defn) > -1 );

    var path = isModules ? defn.link + '/' + $scope.depot.uuid
      : isUtilities ? defn.link+ '/' + $scope.depot.uuid
      : isReports ? defn.link+ '/' + $scope.depot.uuid : defn.link;

    $location.path(path);
  };

  // better version of load path, that allows uuid to be in arbitrary
  // places.
  // TODO - standardize path loading
  $scope.loadPathBetter = function (defn) {
    var path = defn.link.replace(':uuid', $scope.depot.uuid);
    console.log('Path:', path);
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
