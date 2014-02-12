angular.module('kpk.controllers')
.controller('province', function ($scope, $q, connect, messenger, validate) {
  'use strict';

  var dependencies = {},
      flags = $scope.flags = {};

  $scope.model = {};
//dependencies
dependencies.country= {
  query :  {tables: { 'country' : { columns : ['id', 'country_en', 'country_fr']}}}
};

dependencies.province = {
  query :  'province/'
};


//fonction
 
function manageProvince (model){
  for (var k in model) $scope.model[k] = model[k]; 
}

function setOp(action, province){
$scope.province  = angular.copy(province) || {};
$scope.op = action;
}

function addProvince (obj){
  var newObject = {};
  newObject.name = obj.name;
  newObject.country_id = obj.country_id;
 connect.basicPut('province', [connect.clean(newObject)])
   .then(function (res) {
    newObject.id = res.data.insertId;
    newObject.province  = obj.name;
    newObject.country_en  = $scope.model.country.get(obj.country_id).country_en;
     $scope.model.province.post(newObject);
   });
}

function editProvince(){
  var province  = {id :$scope.province.id, name : $scope.province.province, country_id :$scope.province.country_id};
 connect.basicPost('province', [connect.clean(province)], ['id'])   
   .then(function (res) {
      console.log('le modele apre update est :', res);
      $scope.province.country_en  = $scope.model.country.get(province.country_id).country_en;
      $scope.model.province.put($scope.province);
      $scope.village = {};
   });
}

function removeProvince(obj){
  $scope.province = angular.copy(obj);
  connect.basicDelete('province', $scope.province.id).
    then(function(res){
      $scope.model.province.remove($scope.province.id);
      $scope.province = {};
    });
}



validate.process(dependencies).then(manageProvince);

$scope.setOp = setOp;
$scope.addProvince = addProvince;
$scope.editProvince = editProvince;
$scope.removeProvince = removeProvince;
});
