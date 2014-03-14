angular.module('kpk.controllers')
.controller('province', [
  '$scope',
  'connect',
  'messenger',
  'validate',
  'uuid',
  'store',
  function ($scope, connect, messenger, validate, uuid, Store) {

    var dependencies = {},
        flags = $scope.flags = {};

    //dependencies
    dependencies.countries = {
      identifier: 'uuid',
      query : {
        tables: {
          'country' : {
            columns : ['uuid', 'country_en', 'country_fr']
          }
        }
      }
    };


    //fonction
   
    function manageProvince (model) {
      for (var k in model) { $scope[k] = model[k]; }

      connect.fetch('/province/')
      .success(function (data) {
        $scope.provinces = new Store({
          identifier: 'uuid',
        });
        $scope.provinces.setData(data);
        console.log($scope.provinces.data);
      })
      .catch(function (err) {
        messenger.danger('Did not load provinces');
      });

    }

    $scope.setOp = function setOp(action, province){
      $scope.province = angular.copy(province) || {};
      $scope.op = action;
    };

    function addProvince (obj){
      var prov = {
        name : obj.name,
        country_uuid : obj.country_uuid,
        uuid : uuid()
      };

      connect.basicPut('province', [prov])
      .then(function (res) {
        $scope.provinces.post(prov);
      });
    }

    function editProvince(){
      var province  = {
        uuid         : $scope.province.uuid,
        name         : $scope.province.province,
        country_uuid : $scope.province.country_uuid
      };

      connect.basicPost('province', [province], ['uuid'])
      .then(function () {
        $scope.provinces.put(province);
      });
    }

    function removeProvince(uuid){
      connect.basicDelete('province', [uuid], 'uuid')
      .then(function(){
        $scope.provinces.remove(uuid);
      });
    }

    validate.process(dependencies)
    .then(manageProvince);

    $scope.addProvince = addProvince;
    $scope.editProvince = editProvince;
    $scope.removeProvince = removeProvince;
  }
]);
