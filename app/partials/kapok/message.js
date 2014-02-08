angular.module('kpk.controllers')
.controller('message', function ($scope, $timeout, messenger) {
  // This binds the message service to the DOM
  'use strict';

  messenger.warning('This is a test', 500000);

  $scope.messages = messenger.messages;
  $scope.close = messenger.close;

});
