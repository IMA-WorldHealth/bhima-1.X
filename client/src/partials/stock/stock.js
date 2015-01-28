angular.module('bhima.controllers')
.controller('stock.main', [
  '$scope',
  '$location',
  '$translate',
  '$window',
  'appstate',
  'validate',
  'messenger',
  'appcache',
  function ($scope, $location, $translate, $window, appstate, validate, messenger, AppCache) {
    var config, dependencies = {};
    var session = $scope.session = {
      configured : false,
      configure : false
    };
    var cache = new AppCache('stock.in');

    config = $scope.config = {};

    config.modules = [
      {
        key : 'STOCK.EXIT.KEY',
        ico : 'glyphicon-export',
        link : '/stock/distribution'
      },

      {
        key : 'STOCK.EXIT_SERVICE.KEY',
        ico : 'glyphicon-export',
        link : '/stock/distribution_service'
      },

      {
        key : 'STOCK.LOSS.KEY',
        ico : 'glyphicon-cloud',
        link : '/stock/loss'
      },

      {
        key : 'STOCK.MOVEMENT.KEY',
        ico : 'glyphicon-transfer',
        link : '/stock/movement'
      }
    ];

    config.modules_warehouse = [
      {
        key       : 'STOCK.ENTRY.KEY',
        ico       : 'glyphicon-import',
        link      : '/stock/entry/start'
      },

      {
        key       : 'STOCK.DONATION.KEY',
        ico       : 'glyphicon-heart',
        link      : '/stock/donation_management'
      }
    ];

    config.utilities = [
/*      {
        key : 'STOCK.SEARCH.KEY',
        ico : 'glyphicon-search',
        link : '/stock/search'
      },
      {
        key : 'STOCK.EXPIRE.KEY',
        ico : 'glyphicon-exclamation-sign',
        link : '/stock/expiring'
      }*/
      {
        key : 'STOCK.DISTRIBUTION_RECORDS.REVERSING_TITLE_PATIENT',
        ico : 'glyphicon-refresh',
        link : '/stock/distribution_record'
      },

      {
        key : 'STOCK.DISTRIBUTION_SERVICE_RECORDS.REVERSING_TITLE_SERVICE',
        ico : 'glyphicon-refresh',
        link : '/stock/distribution_service_record'
      }
    ];

    config.reports = [
      /*{
        key : 'STOCK.REPORT.STOCK_COUNT',
        ico : 'glyphicon-list-alt',
        link : '/count/'
      },*/

      {
        key : 'STOCK.DISTRIBUTION_RECORDS.KEY',
        ico : 'glyphicon-list-alt',
        link : '/reports/distribution_record'
      },

      {
        key : 'STOCK.DISTRIBUTION_SERVICE_RECORDS.KEY',
        ico : 'glyphicon-list-alt',
        link : '/reports/distribution_service_record'
      },

      {
        key : 'STOCK.LOSS.LOSS_RECORDS',
        ico : 'glyphicon-list-alt',
        link : '/stock/loss_record'
      }
      
    ];

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


    appstate.register('project', initialise);

    // FIXME functions doing 100 things at once
    function initialise(project) {
      $scope.project = project;
      dependencies.depots.query.where = ['depot.enterprise_id=' + project.enterprise_id];

      validate.process(dependencies).then(loadDefaultDepot);
    }

    function loadDefaultDepot (model) {
      angular.extend($scope, model);

      cache.fetch('depot')
      .then(function (depot) {
        if (depot) {
          // var validDepot = model.depots.data.some(function (filterDepot) { return filterDepot.uuid === depot.uuid });
          var validDepot = model.depots.get(depot.uuid);

          if (!validDepot) {
            messenger.danger('The stored depot could not be found. Please select the correct depot or contact the system administrator.', 8000);
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

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.depots.query.where =
        ['depot.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(startup)
      .catch(error);
    });

    $scope.loadPath = function (defn) {

      // User shouldn't be able to get here
      /*if (!$scope.depot && config.modules.indexOf(defn) > -1) {
        return messenger.danger('NO_DEPOT_SELECTED');
      }*/

      // build dynamically the report list links in report panel
      var isModules = (config.modules.indexOf(defn) > -1),
          isUtilities = (config.utilities.indexOf(defn) > -1),
          isReports = (config.reports.indexOf(defn) > -1 );

      var path = isModules ? defn.link + '/' + $scope.depot.uuid
        : isUtilities ? defn.link+ '/' + $scope.depot.uuid 
        : isReports ? defn.link+ '/' + $scope.depot.uuid : defn.link;
        
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
      var verifyConfigure = confirm('Are you sure you want to change the depot for Stock Management? The current depot is \'' + $scope.depot.text + '\'');
      if (!verifyConfigure) { return; }

      $scope.depot = null;

      config.modules = [
        {
          key : 'STOCK.EXIT.KEY',
          ico : 'glyphicon-export',
          link : '/stock/distribution'
        },

        {
          key : 'STOCK.EXIT_SERVICE.KEY',
          ico : 'glyphicon-export',
          link : '/stock/distribution_service'
        },

        {
          key : 'STOCK.LOSS.KEY',
          ico : 'glyphicon-cloud',
          link : '/stock/loss'
        },

        {
          key : 'STOCK.MOVEMENT.KEY',
          ico : 'glyphicon-transfer',
          link : '/stock/movement'
        }
      ];

      cache.remove('depot');
      session.configured = false;
      session.configure = true;
    };
  }
]);
