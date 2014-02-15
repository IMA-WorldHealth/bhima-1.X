angular.module('kpk.controllers')
.controller('sector', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  function ($scope, $q, connect, messenger, validate) {

    var dependencies = {},
        flags = $scope.flags = {};
    $scope.model = {};

    //dependencies
    dependencies.province= {
      query :  {
        tables: {
          'province' : {
            columns : ['id', 'name', 'country_id']
          }
        }
      }
    };

    dependencies.sector = {
      query :  'sector/'
    };

    //fonction
    
    function manageSector(model){
      for (var k in model) { $scope.model[k] = model[k]; }
    }

    function setOp(action, sector){
      $scope.sector = angular.copy(sector) || {};
      $scope.op = action;
    }

    function addSector(obj){
      var newObject = {};
      newObject.name = obj.name;
      newObject.province_id = obj.province_id;
      connect.basicPut('sector', [connect.clean(newObject)])
      .then(function (res) {
        newObject.id = res.data.insertId;
        newObject.sector = obj.name;
        newObject.province = $scope.model.province.get(obj.province_id).name;
        $scope.model.sector.post(newObject);
      });
    }

    function editSector(){
      var sector = {id :$scope.sector.id, name : $scope.sector.sector,  province_id :$scope.sector. province_id};
      connect.basicPost('sector', [connect.clean(sector)], ['id'])
      .then(function (res) {
        $scope.sector.province = $scope.model.province.get(sector.province_id).name;
        $scope.model.sector.put($scope.sector);
        $scope.sector = {};
      });
    }

    function removeSector(obj){
      $scope.sector = angular.copy(obj);
      connect.basicDelete('sector', $scope.sector.id)
      .then(function(res){
        $scope.model.sector.remove($scope.sector.id);
        $scope.sector = {};
      });
    }



    validate.process(dependencies).then(manageSector);

    $scope.setOp = setOp;
    $scope.addSector = addSector;
    $scope.editSector = editSector;
    $scope.removeSector = removeSector;
  }
]);
