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
    var session = $scope.session = {
      configured : false,
      configure : false
    };
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
        link : '/count/'
      }
    ];

    dependencies.depots = {
      required : true,
      query : {
        identifier : 'uuid',
        tables : {
          'depot' : {
            columns : [ 'uuid', 'reference', 'text']
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
            messenger.warning('The stored depot could not be found. Please select the correct depot or contact the system administrator.', 8000);
            session.configure = true;
            return;
          }
          $scope.depot = depot;
          session.configured = true;
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

      console.log($scope.depot);
      var path = config.modules.indexOf(defn) > -1 ? defn.link + '/' + $scope.depot.uuid
      : (config.utilities.indexOf(defn) > -1 )? defn.link+ '/' + $scope.depot.uuid : defn.link
      $location.path(path);
    };

    $scope.setDepot = function setDepot (depot) {
      console.log('mesage apres')
      $translate('STOCK.MAIN.CONFIRM')
      .then(function (message){
        console.log('message est :', message);
        var verifySet = confirm(message+depot.text);
        if (!verifySet) { return; }

        cache.put('depot', depot);
        $scope.depot = depot;
        session.configured = true;
        session.configure = false;
      });
    };

    $scope.reconfigure = function () {
      var verifyConfigure = confirm('Are you sure you want to change the depot for Stock Management? The current depot is \'' + $scope.depot.text + '\'');
      if (!verifyConfigure) { return; }

      $scope.depot = null;
      cache.remove('depot');
      session.configured = false;
      session.configure = true;
    };
  }
]);
