angular.module('bhima.controllers')
.controller('country', [
  '$scope',
  'connect',
  'validate',
  'uuid',
  function ($scope, connect, validate, uuid) {

    var dependencies = {};

    dependencies.countries = {
      identifer : 'uuid',
      query : {
        tables: {
          'country' : {
            columns : ['uuid','code', 'country_en', 'country_fr']
          }
        }
      }
    };

    function manageCountry (model) {
      angular.extend($scope, model);
    }

    function setOp(action, country){
      $scope.country  = angular.copy(country) || {};
      $scope.op = action;
    }

    function addCountry (obj){
      var country = {
        uuid : uuid(),
        code : obj.code,
        country_en : obj.country_en,
        country_fr : obj.country_fr
      };

      connect.basicPut('country', [country])
      .then(function () {
        $scope.countries.post(country);
        obj = {};
      });
    }

    function editCountry(){
      var country  = {
        uuid : $scope.country.uuid,
        code : $scope.country.code,
        country_en : $scope.country.country_en,
        country_fr : $scope.country.country_fr
      };

      connect.basicPost('country', [connect.clean(country)], ['uuid'])
      .then(function () {
        $scope.countries.put($scope.country);
        $scope.country = {};
      });
    }

    $scope.removeCountry = function removeCountry(uuid){
      connect.basicDelete('country', uuid, 'uuid')
      .then(function(){
        $scope.country.remove(uuid);
      });
    };

    validate.process(dependencies)
    .then(manageCountry);

    $scope.setOp = setOp;
    $scope.addCountry = addCountry;
    $scope.editCountry = editCountry;
  }
]);
