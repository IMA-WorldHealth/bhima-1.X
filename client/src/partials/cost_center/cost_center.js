angular.module('bhima.controllers')
.controller('costCenter', [
  '$scope',
  '$location',
  '$translate',
  'connect',
  function ($scope, $location, $translate, connect) {

    var requettes, models, principal_centers, auxiliary_centers,
        configuration = $scope.configuration = {};

    configuration.operations = [
      {
        key : $translate.instant('COST_CENTER.OPERATIONS.CC'),
        link : '/cost_center/center/'
      },

      {
        key : $translate.instant('COST_CENTER.OPERATIONS.VERSEMENT'),
        link : '/cost_center/versement/'
      },

      {
        key : $translate.instant('COST_CENTER.OPERATIONS.ASSIGN'),
        link : '/cost_center/assigning/'
      }
    ];

    function run() {
      connect.req(requettes.cost_centers)
      .then(init);
    }

    function init (records) {
      models.cost_centers = records[0].data;
      groupCenters();
      //defineTypeCenter(models.cost_centers);
      updateChecks(false);
    }

    function defineTypeCenter(tbl) {
      tbl.map(function (item) {
        item.type = (item.pc) ? 'Principal Center' : 'auxiliary Center';
      });
    }

    function groupCenters() {
      models.cost_centers.forEach(function (item) {
        if (item.pc) {
          principal_centers.push(item);
        } else {
          auxiliary_centers.push(item);
        }
      });
    }

    function updateChecks(value) {
      principal_centers.map(function (item) {
        if (item.pc) { item.checked = value; }
      });
    }

    $scope.loadPath = function loadPath(path) {
      $location.path(path);
    };
  }
]);
