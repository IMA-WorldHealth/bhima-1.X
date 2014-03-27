angular.module('kpk.controllers')
.controller('sector', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  'store',
  function ($scope, $q, connect, messenger, validate, Store) {

    var dependencies = {},
        flags = $scope.flags = {};
    $scope.model = {};

    //dependencies
    dependencies.province = {
      identifier : 'uuid',
      query :  {
        tables: {
          'province' : {
            columns : ['uuid', 'name', 'country_uuid']
          }
        }
      }
    };

    //fonction

    function manageSector(model){
      for (var k in model) { $scope.model[k] = model[k]; }

      connect.fetch('/sector/')
      .success(function (data) {
        $scope.model.sector = new Store({ identifier : 'uuid' });
        $scope.model.sector.setData(data);
      })
      .error(function () {
        messenger.danger('Sectors not loaded!');
      });
    }

    function setOp(action, sector){
      $scope.sector = angular.copy(sector) || {};
      $scope.op = action;
    }

    function addSector(obj){
      var newObject = {};
      newObject.name = obj.name;
      newObject.province_uuid = obj.province_uuid;
      connect.basicPut('sector', [connect.clean(newObject)])
      .then(function (res) {
        newObject.id = res.data.insertId;
        newObject.sector = obj.name;
        newObject.province = $scope.model.province.get(obj.province_id).name;
        $scope.model.sector.post(newObject);
        $scope.op = '';
      });
    }

    function editSector(){
      var sector = {
        uuid : $scope.sector.id,
        name : $scope.sector.sector,
        province_uuid :$scope.sector.province_uuid
      };

      connect.basicPost('sector', [connect.clean(sector)], ['uuid'])
      .then(function (res) {
        $scope.model.sector.put(sector);
      });
    }

    function removeSector(uuid){
      connect.basicDelete('sector', uuid, 'uuid')
      .then(function(){
        $scope.model.sector.remove(uuid);
      });
    }

    validate.process(dependencies)
    .then(manageSector);

    $scope.setOp = setOp;
    $scope.addSector = addSector;
    $scope.editSector = editSector;
    $scope.removeSector = removeSector;
  }
]);
