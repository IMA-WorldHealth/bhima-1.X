angular.module('kpk.controllers')
.controller('stock.main', [
  '$scope',
  '$location',
  '$translate',
  'appstate',
  'validate',
  'messenger',
  function ($scope, $location, $translate, appstate, validate, messenger) {
    var config, dependencies = {};

    config = $scope.config = {};
    
    config.modules = [
      {
        key : $translate('STOCK.ENTRY.KEY'),
        ico : 'glyphicon-import',
        link : '/stock/entry/start'
      },
      {
        key : $translate('STOCK.EXIT.KEY'),
        ico : 'glyphicon-export',
        link : '/stock/exit'
      },
      {
        key : $translate('STOCK.LOSS.KEY'),
        ico : 'glyphicon-cloud',
        link : '/stock/loss'
      },
      {
        key : $translate('STOCK.MOVEMENT.KEY'),
        ico : 'glyphicon-transfer',
        link : '/stock/movement'
      }
    ];

    config.utilities = [
      {
        key : $translate('STOCK.SEARCH.KEY'),
        ico : 'glyphicon-search',
        link : '/stock/search'
      },
      {
        key : $translate('STOCK.EXPIRE.KEY'),
        ico : 'glyphicon-exclamation-sign',
        link : '/stock/expiring'
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

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.depots.query.where =
        ['depot.enterprise_id=' + project.enterprise_id];
      validate.process(dependencies)
      .then(function (models) {
        angular.extend($scope, models);
      })
      .catch(messenger.error);
    });

    $scope.loadPath = function (defn) {
      console.log(defn);

      if (!$scope.depot && config.modules.indexOf(defn) > -1) {
        return messenger.danger('NO_DEPOT_SELECTED');
      }

      var path = config.modules.indexOf(defn) > -1 ? defn.link + '/' + $scope.depot.id : defn.link;
      $location.path(path);
    };

    $scope.setDepot = function setDepot (depot) {
      $scope.depot = depot;
    };

  }
]);
