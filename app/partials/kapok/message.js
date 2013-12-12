angular.module('kpk.controllers')
.controller('messageCtrl', function ($scope, $timeout, message) {
  // This binds the message service to the DOM
  'use strict';

  $scope.message = message;

});
