angular.module('bhima.controllers')
.controller('reportAccountBalance', [
  '$scope',
  'appstate',
  'connect',
  function ($scope, appstate, connect) {
    'use strict';

    var models = $scope.models = {};
    var imports = {},
        stores = {};

    imports.enterprise = appstate.get('enterprise');

    function run () {
      connect.req('/account_balance/'+imports.enterprise.id)
      .then(function (store) {
        var data = store.data;

        function getDepth (row) {
          if (!row || row.parent === 0) return 1;
          return 1 + getDepth(data.filter(function (r) { return r.account_number === row.parent; })[0]);
        }

        var processed = store.data.map(function (row) {
          row.account_number = String(row.account_number);
          row.depth = getDepth(row);
          return row;
        });

        window.arr = models.accounts = processed;
     
      });

      $scope.date = new Date();
    }

    $scope.getPadding = function (row) {
      return { 'padding-left' : (15 * row.depth) + 'px' };
    };

    run();

  }
]);
