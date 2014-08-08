angular.module('bhima.controllers')
.controller('report.transactions.account', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  function ($scope, validate, connect, appstate) {
    var session = $scope.session = {};
    var dependencies = {};

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        }
      }
    };

    session.timestamp = new Date();

    session.limits = [10, 25, 50, 75, 100];

    function startup(models) {
      models.accounts.data.forEach(function (acc) {
        acc.account_number = String(acc.account_number);
      });
      session.limit = 25;
      angular.extend($scope, models);
    }

    $scope.search = function search() {
      if (!session.account || !session.limit) { return; }
      var query = '?account=' + session.account.id;
      query += '&limit=' + session.limit;
      connect.fetch('/reports/transactions/' + query)
      .then(function (data) {
        $scope.transactions = data;
      });
    };

    appstate.register('enterprise', function (enterprise) {
      session.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.print = function print() {
      window.print();
    };

  }
]);
