angular.module('kpk.controllers')
.controller('locationCtrl', function ($scope, $q, connect, messenger, validate, appstate) {
  'use strict';

  var dependencies = {};
  $scope.model = {};

//dependencies

dependencies.location = {
  query : 'location/'
};


//fonction
 
function manageLocation(model){
  for (var k in model) $scope.model[k] = model[k]; 
}

validate.process(dependencies).then(manageLocation);
});
