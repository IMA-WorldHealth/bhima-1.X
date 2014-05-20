angular.module('bhima.controllers')
.controller('trialbalance.print', [
  '$scope',
  'connect',
  'messenger',
  'errorCodes',
  'precision',
  function ($scope, connect, messenger, errorCodes, precision) {
    var session = $scope.session = {};

    $scope.timestamp = new Date();

    connect.fetch('trialbalance/initialize')
    .success(function (request) {
      $scope.transactions = request.transactions;
      $scope.balances = request.balances;
      var total = $scope.total = {};

      $scope.balances.forEach(function (item) {
        total.before = (total.before || 0) + item.balance;
        total.debit = (total.debit || 0) + item.debit;
        total.credit = (total.credit || 0) + item.credit;
        total.after = (total.after || 0) + item.balance + precision.round(item.credit - item.debit);
      });

      var dates = $scope.transactions.map(function (row) {
        return new Date(row.trans_date);
      });

      session.max = Math.max.apply(Math.max, dates);
      session.min = Math.min.apply(Math.min, dates);
      session.count = $scope.transactions.reduce(function (a,b) { return a + b.lines; }, 0);

      $scope.errors = request.errors.map(function (error) {
        return angular.extend(errorCodes[error.code], {affectedRows : error.details});
      });
    })
    .catch(function (error) {
      messenger.error(error);
    });
  }
]);
