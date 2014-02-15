angular.module('kpk.controllers')
.controller('costCenter', [
  '$scope',
  '$q',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $q, connect, appstate, messenger) {
    var requettes = {},
        auxiliary_centers = [],
        principal_centers = [],
        enterprise = appstate.get('enterprise'),
        models = $scope.models = {};

    requettes.cost_centers = {
      tables : {
        'cost_center' : {
          columns : ['id', 'text', 'note', 'cost', 'pc']
        },
        'enterprise' : { columns : ['name']
        }
      },
      join : ['cost_center.enterprise_id=enterprise.id']
    };

    $scope.selection = {};

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

    //exposition
    $scope.principal_centers = principal_centers;
    $scope.auxiliary_centers = auxiliary_centers;
    $scope.checkAll = checkAll;

    //invocation

    run();
  }
]);
