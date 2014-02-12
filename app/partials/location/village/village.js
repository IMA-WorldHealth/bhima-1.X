angular.module('kpk.controllers')
.controller('village', function ($scope, $q, connect, messenger, validate) {
  'use strict';

  var dependencies = {},
      flags = $scope.flags = {};

  $scope.model = {};
//dependencies
dependencies.sector = {
  query :  {tables: { 'sector' : { columns : ['id', 'name', 'province_id']}}}
};

dependencies.village = {
  query :  'village/'
};


//fonction
 
function manageVillage(model){
  for (var k in model) $scope.model[k] = model[k]; 
}

function setOp(action, village){
$scope.village = angular.copy(village) || {};
$scope.op = action;
}

function addVillage(obj){
 var  newObject = {};
 newObject.name = obj.name;
 newObject.sector_id = obj.sector_id;
 connect.basicPut('village', [connect.clean(newObject)])
   .then(function (res) {
    newObject.id = res.data.insertId;
    newObject.village = obj.name;
    newObject.sector = $scope.model.sector.get(obj.sector_id).name;
     $scope.model.village.post(newObject);
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
  connect.basicDelete('village', $scope.village.id).
    then(function(res){
      $scope.model.village.remove($scope.village.id);
      $scope.village = {};
    });
}



validate.process(dependencies).then(manageVillage);

$scope.setOp = setOp;
$scope.addVillage = addVillage;
$scope.editVillage = editVillage;
$scope.removeVillage = removeVillage;
});
