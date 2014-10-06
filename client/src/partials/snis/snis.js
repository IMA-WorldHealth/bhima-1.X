angular.module('bhima.controllers')
.controller('snis', [
  '$scope',
  '$q',
  '$translate',
  'validate',
  'messenger',
  'connect',
  'appstate',
  'stockControler',
  function ($scope, $q, $translate, validate, messenger, connect, appstate, stockControler) {
    
    stockControler.getStock('3ebe8581-c4e3-4fb7-8ecf-330e0e529459')
    .then(function (res) {
      console.log('result', res);
    });  	   
  }
]);
