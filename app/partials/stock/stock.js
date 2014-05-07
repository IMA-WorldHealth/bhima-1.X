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

    config = $scope.config = [
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

    $scope.loadPath = function (link) {
      if (!$scope.depot) {
        return messenger.danger('NO_DEPOT_SELECTED');
      }
      $location.path(link + '/' + $scope.depot.id);
    };

    $scope.setDepot = function setDepot (depot) {
      $scope.depot = depot;
    };

  }
]);
