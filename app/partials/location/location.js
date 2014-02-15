angular.module('kpk.controllers')
.controller('locationCtrl', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  'appstate',
  function ($scope, $q, connect, messenger, validate, appstate) {

    var dependencies = {};
    $scope.model = {};

    dependencies.location = {
      query : 'location/'
    };


    //fonction
    function manageLocation(model){
      for (var k in model) { $scope.model[k] = model[k]; }
    }

    validate.process(dependencies).then(manageLocation);
  }
]);
