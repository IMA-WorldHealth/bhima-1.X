angular.module('kpk.controllers')
.controller('village', [
  '$scope',
  'connect',
  'messenger',
  'validate',
  'uuid',
  'store',
  function ($scope, connect, messenger, validate, uuid, Store) {
    var dependencies = {},
        flags = $scope.flags = {};

    $scope.model = {};
    //dependencies
    dependencies.sector = {
      query :  {
        identifier : 'uuid',
        tables: {
          'sector' : {
            columns : ['uuid', 'name', 'province_uuid']
          }
        }
      }
    };

    dependencies.village = {
      identifier:'uuid',
      query : '/village/'
    };

    function manageVillage (model) {
      angular.extend($scope, model);
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
        v.village = v.name;
        v.sector = $scope.model.sector.get(v.sector_uuid).name;
        $scope.model.village.post(v);
        $scope.op='';
      });
    }

    function editVillage(){
      var village = {
        uuid : $scope.village.uuid,
        name : $scope.village.village,
        sector_uuid :$scope.village.sector_uuid
      };

      connect.basicPost('village', [village], ['uuid'])
      .then(function () {
        $scope.model.village.put(village);
        $scope.op='';
      });
    }

    function removeVillage(uuid){
      connect.basicDelete('village', [uuid], 'uuid')
      .then(function(){
        $scope.model.village.remove(uuid);
      });
    }

    validate.process(dependencies)
    .then(manageVillage);

    $scope.setOp = setOp;
    $scope.addVillage = addVillage;
    $scope.editVillage = editVillage;
    $scope.removeVillage = removeVillage;
  }
]);
