angular.module('bhima.controllers')
.controller('fiscal.balance', [
  '$scope',
  '$modalInstance',
  'connect',
  'params',
  function ($scope, $modalInstance, connect, params) {
    var dependencies = {};

    dependencies.accounts = {
      tables : {
        'account' : {
          columns : ['id', 'account_txt', 'account_number']
        },
        'account_type' : {
          columns : ['type']
        }
      },
      join : ['account.account_type_id=account_type.id'],
      where : ['account.enterprise_id=' + params.enterprise.id]
    };

    $scope.enterprise = params.enterprise;
    $scope.fiscalYearId = params.fiscalYearId;

    connect.fetch(dependencies.accounts)
    .then(function (accounts) {

      accounts.forEach(function (row) {
        row.account_number = String(row.account_number); // required for sorting to work properly
        row.debit = 0;
        row.credit = 0;
      });

      $scope.accounts = accounts;
    })
    .catch(function (err) { throw err; })
    .finally();

    $scope.reset = function () {
      $scope.accounts.forEach(function (row) {
        row.credit = 0;
        row.debit = 0;
      });
    };

    $scope.submit = function () {

      var data = $scope.accounts
      .filter(function (row) {
        return row.type !== 'title';
      })
      .map(function (row) {
        return {
          account_id     : row.id,
          debit          : row.debit || 0, // default to 0
          credit         : row.credit || 0, // default to 0
          fiscal_year_id : params.fiscalYearId,
          period_id      : params.zeroId,
          enterprise_id  : params.enterprise.id,
        };
      });

      connect.basicPut('period_total', data)
      .then($modalInstance.close)
      .catch($modalInstance.dismiss)
      .finally();
    };
  }
]);
