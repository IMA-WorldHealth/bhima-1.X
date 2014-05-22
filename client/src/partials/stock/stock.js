angular.module('bhima.controllers')
.controller('stock.main', [
  '$scope',
  '$location',
  '$translate',
  'appstate',
  'validate',
  'messenger',
  'appcache',
  function ($scope, $location, $translate, appstate, validate, messenger, AppCache) {
    var config, dependencies = {};

    var cache = new AppCache('stock.in');

    config = $scope.config = {};

    config.modules = [
      {
        key : 'STOCK.ENTRY.KEY',
        ico : 'glyphicon-import',
        link : '/stock/entry/start'
      },
      {
        key : 'STOCK.EXIT.KEY',
        ico : 'glyphicon-export',
        link : '/stock/distribution'
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

    config.utilities = [
      {
        key : 'STOCK.SEARCH.KEY',
        ico : 'glyphicon-search',
        link : '/stock/search'
      },
      {
        key : 'STOCK.EXPIRE.KEY',
        ico : 'glyphicon-exclamation-sign',
        link : '/stock/expiring'
      }
    ];

    config.reports = [
      {
        key : 'STOCK.REPORT.STOCK_COUNT',
        link : '/report/stock_count'
      }
    ];

    dependencies.depots = {
      required : true,
      query : {
        tables : {
          'depot' : {
            columns : [ 'id', 'text']
          }
        }
      }
    };

    function loadDefaultDepot (depot) {
      if (!depot) { return; }
      $scope.setDepot(depot);
    }

    cache.fetch('depot').then(loadDefaultDepot);

    function startup (models) {
      angular.extend($scope, models);
    }

    function error (err) {
      messenger.danger(JSON.stringify(err));
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

      if (!$scope.depot && config.modules.indexOf(defn) > -1) {
        return messenger.danger('NO_DEPOT_SELECTED');
      }

      var path = config.modules.indexOf(defn) > -1 ? defn.link + '/' + $scope.depot.id : defn.link;
      $location.path(path);
    };

    $scope.setDepot = function setDepot (depot) {
      $scope.depot = depot;
      cache.put('depot', depot);
    };

  }
]);
