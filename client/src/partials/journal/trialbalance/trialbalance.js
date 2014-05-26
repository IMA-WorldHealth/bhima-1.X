angular.module('bhima.controllers')
.controller('trialBalance', [
  '$scope',
  '$modalInstance',
  '$location',
  'connect',
  'messenger',
  'request',
  'errorCodes',
  'precision',
  function ($scope, $modalInstance, $location, connect, messenger, request, errorCodes, precision) {
    var session = $scope.session = {};
    session.action = 'hide';

    console.log('request', request);

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

    $scope.submit = function submit () {
      connect.fetch('/trialbalance/submit/'+ request.key +'/')
      .then(function () {
        $modalInstance.close();
      })
      .catch(function (error) {
        console.log(error);
        messenger.error('Posting failed with ' +  JSON.stringify(error));
      });
    };

    $scope.cancel = function cancel () {
      $modalInstance.dismiss();
    };

    $scope.print = function print () {
      $location.path('/trialbalance/print');
      $modalInstance.dismiss();
    };

  }
]);
