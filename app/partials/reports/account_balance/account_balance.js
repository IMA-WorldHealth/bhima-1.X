angular.module('kpk.controllers')
.controller('reportAccountBalanceCtrl', function ($scope, appstate, connect) {
  'use strict';

  var models = $scope.models = {};
  var imports = {};

  imports.enterprise = appstate.get('enterprise');

  function run () {
    connect.fetch('/account_balance/'+imports.enterprise.id)
    .then(function (model) {
      models.accounts = model.data;
    });

    $scope.date = new Date();
  }

  $scope.$watch('models.accounts', function () {
    if (!models.accounts) return;
  }, true);

  run();

});
