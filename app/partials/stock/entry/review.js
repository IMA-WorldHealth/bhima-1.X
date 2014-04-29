angular.module('kpk.controllers')
.controller('stock.review', [
  '$scope',
  '$location',
  'validate',
  'appstate',
  'connect',
  function ($scope, $location, validate, appstate, connect) {
    /*
    var session = $scope.session = {};

    appstate.register('project', function (project) {
      $scope.project = project;
      angular.extend(session, appstate.get('stock.review'));
    });


    function processStock () {
      var stock = [];
      session.lots.data.forEach(function (stockLot) {
        console.log(stockLot);
      });
    }

    $scope.submit = function () {
      processStock();
      //connect.basicPut('stock');
    };
    */

  }
]);
