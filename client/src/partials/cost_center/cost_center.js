angular.module('kpk.controllers')
.controller('costCenter', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  '$location',
  '$filter',
  function ($scope, $q, connect, appstate, messenger, $location, $filter) {
    console.log('nous sommes la');
    var configuration = $scope.configuration = {};
    configuration.operations = [

      {
        key : $filter('translate')('COST_CENTER.OPERATIONS.CC'),
        link : '/cost_center/center/'
      },

      {
        key : $filter('translate')('COST_CENTER.OPERATIONS.VERSEMENT'),
        link : '/cost_center/versement/'
      },

      {
        key : $filter('translate')('COST_CENTER.OPERATIONS.ASSIGN'),
        link : '/cost_center/assigning/'
      }
    ];

    function run() {
      connect.req(requettes.cost_centers)
      .then(init);
    }

    function init (records){
      models.cost_centers = records[0].data;
      groupCenters();
      //defineTypeCenter(models.cost_centers);
      updateChecks(false);
    }

    function defineTypeCenter(tbl) {
      tbl.map(function (item){
        item.type = (item.pc) ? "Principal Center" : "auxiliary Center";
      });
    }

    function groupCenters() {
      models.cost_centers.forEach(function (item){
        if (item.pc) {
          principal_centers.push(item);
        } else {
          auxiliary_centers.push(item);
        }
      });
    }

    function checkAll () {
        models.cost_centers.forEach(function (item){
          if(item.pc) item.checked = $scope.selection.all;
        });
    }

    function updateChecks (value){
      principal_centers.map(function (item){
        if(item.pc) item.checked = value;
      });
    }

    function loadPath(path) {
      $location.path(path);
    }

    $scope.loadPath = loadPath;
  }
]);
