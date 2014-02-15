angular.module('kpk.controllers')
.controller('country', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  function ($scope, $q, connect, messenger, validate) {

    var dependencies = {},
        flags = $scope.flags = {};

    $scope.model = {};

    dependencies.country = {
      query : {
        tables: {
          'country' : {
            columns : ['id','code', 'country_en', 'country_fr']
          }
        }
      }
    };

    //fonction
    
    function manageCountry (model){
      for (var k in model) { $scope.model[k] = model[k]; }
    }

    function setOp(action, country){
      $scope.country  = angular.copy(country) || {};
      $scope.op = action;
    }

    function addCountry (obj){
      var newObject = {};
      newObject.code = obj.code;
      newObject.country_en  = obj.country_en;
      newObject.country_fr  = obj.country_fr;
      connect.basicPut('country', [connect.clean(newObject)])
      .then(function (res) {
        newObject.id = res.data.insertId;
        $scope.model.country.post(newObject);
        obj = {};
      });
    }

    function editCountry(){
      var country  = {
        id :$scope.country.id,
        code : $scope.country.code,
        country_en : $scope.country.country_en,
        country_fr : $scope.country.country_fr
      };

      connect.basicPost('country', [connect.clean(country)], ['id'])
      .then(function (res) {
        $scope.model.country.put($scope.country);
        $scope.country = {};
      });
    }

    function removeCountry(obj){
      $scope.country = angular.copy(obj);
      connect.basicDelete('country', $scope.country.id)
      .then(function(res){
          $scope.model.country.remove($scope.country.id);
          $scope.country = {};
        });
    }

    validate.process(dependencies).then(manageCountry);

    $scope.setOp = setOp;
    $scope.addCountry = addCountry;
    $scope.editCountry = editCountry;
    $scope.removeCountry = removeCountry;
  }
]);
