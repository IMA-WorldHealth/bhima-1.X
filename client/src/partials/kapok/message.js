angular.module('bhima.controllers')
.controller('message', [
  '$scope',
  '$timeout',
  'messenger',
  function ($scope, $timeout, messenger) {
    // This binds the message service to the DOM
    $scope.messages = messenger.messages;
    $scope.close = messenger.close;
  }
]);
