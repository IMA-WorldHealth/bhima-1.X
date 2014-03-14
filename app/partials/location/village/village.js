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
      identifier : 'uuid',
      query :  {
        tables: {
          'sector' : {
            columns : ['uuid', 'name', 'province_uuid']
          }
        }
      }
    };

    function manageVillage(model){
      for (var k in model) { $scope.model[k] = model[k]; }

      connect.fetch('/village/')
      .success(function (data) {
        $scope.model.village = new Store({ identifier : 'uuid' });
        $scope.model.village.setData(data);
      });
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
      var village = {
        uuid : $scope.village.uuid,
        name : $scope.village.village,
        sector_uuid :$scope.village.sector_uuid
      };

      connect.basicPost('village', [village], ['uuid'])
      .then(function () {
        $scope.model.village.put(village);
      });
    }

    function removeVillage(uuid){
      connect.basicDelete('village', uuid, 'uuid')
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
