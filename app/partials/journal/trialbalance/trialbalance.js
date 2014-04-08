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

    if (hasErrors) {
      $scope.errors = request.errors;

    } else {
      var total = $scope.total = {};
      $scope.data = request.data;

      // TODO
      // this is slightly inefficient.
      $scope.data.forEach(function (item) {
        total.before = (total.before || 0) + item.balance;
        total.debit = (total.debit || 0) + item.debit;
        total.credit = (total.credit || 0) + item.credit;
        total.after = (total.after || 0) + item.balance + (item.credit - item.debit);
      });
    }

    $scope.submit = function submit () {
      connect.fetch('/trialbalance/submit/'+ request.key +'/')
      .then(function () {
        $modalInstance.close();
      }, function (error) {
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
