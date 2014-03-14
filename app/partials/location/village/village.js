angular.module('kpk.controllers')
.controller('village', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  'uuid',
  function ($scope, $q, connect, messenger, validate, uuid) {
    var dependencies = {},
        flags = $scope.flags = {};

    $scope.model = {};
    //dependencies
    dependencies.sector = {
      identifier : 'uuid',
      query :  {
        tables: {
          'sector' : {
            columns : ['uuid', 'name', 'province_uuid']
          }
        }
      }
    };

    dependencies.village = {
      query :  'village/'
    };

    function manageVillage(model){
      for (var k in model) { $scope.model[k] = model[k]; }
    }

    function setOp(action, village){
      $scope.village = angular.copy(village) || {};
      $scope.op = action;
    }

    function addVillage(obj){

      var v = {
        uuid : uuid(),
        name : obj.name,
        sector_uuid : obj.sector_uuid,
      };

      connect.basicPut('village', [v])
      .then(function (res) {
        $scope.model.village.post(v);
      });
    }

    function editVillage(){
      var village = {id :$scope.village.id, name : $scope.village.village, sector_id :$scope.village. sector_id};
      connect.basicPost('village', [connect.clean(village)], ['id'])
      .then(function (res) {
        $scope.village.sector = $scope.model.sector.get(village.sector_id).name;
        $scope.model.village.put($scope.village);
        $scope.village = {};
      });
    }

    function removeVillage(obj){
      $scope.village = angular.copy(obj);
      connect.basicDelete('village', $scope.village.id)
      .then(function(res){
        $scope.model.village.remove($scope.village.id);
        $scope.village = {};
      });
    }

    validate.process(dependencies).then(manageVillage);

    $scope.setOp = setOp;
    $scope.addVillage = addVillage;
    $scope.editVillage = editVillage;
    $scope.removeVillage = removeVillage;
  }
]);
