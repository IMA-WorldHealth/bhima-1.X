angular.module('kpk.controllers')
.controller('messageCtrl', function ($scope, $timeout, message) {
  // This binds the message service to the DOM
  'use strict';

  var messenger = message;
  $scope.messages = messenger.messages;

});
