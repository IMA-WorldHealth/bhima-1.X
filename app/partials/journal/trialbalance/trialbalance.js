angular.module('kpk.controllers')
.controller('trialBalance', [
  '$scope',
  '$modalInstance',
  '$window',
  'connect',
  'messenger',
  'request',
  function ($scope, $modalInstance, $window, connect, messenger, request) {
    var hasErrors = !!request.errors;

    var session = $scope.session = {};

    $scope.errors = request.errors;
    $scope.transactions = request.transactions;
    $scope.balances = request.balances;
    var total = $scope.total = {};

    $scope.balances.forEach(function (item) {
      total.before = (total.before || 0) + item.balance;
      total.debit = (total.debit || 0) + item.debit;
      total.credit = (total.credit || 0) + item.credit;
      total.after = (total.after || 0) + item.balance + (item.credit - item.debit);
    });

    var dates = $scope.transactions.map(function (row) {
      return new Date(row.trans_date);
    });

    session.max = Math.max.apply(Math.max, dates);
    session.min = Math.min.apply(Math.min, dates);
    session.count = $scope.transactions.reduce(function (a,b) { return a + b.lines; }, 0);

    $scope.submit = function submit () {
      connect.fetch('/trialbalance/submit/'+ request.key +'/')
      .then(function () {
        $modalInstance.close();
      })
      .catch(function (error) {
        messenger.warning('Posting failed with ' +  JSON.stringify(error));
      });
    };

    $scope.cancel = function cancel () {
      $modalInstance.dismiss();
    };

    $scope.print = function print () {
      $window.print();
    };

  }
]);
