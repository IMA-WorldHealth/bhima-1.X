angular.module('kpk.controllers')
.controller('trialBalance', function ($scope, $modalInstance, request, connect, messenger) {
  console.log('Recieved data:', request, 'from server!');

  $scope.errors = request.errors;
  $scope.hasErrors = !!request.errors.length;
  $scope.data = request.data;

  var total = $scope.total = {};

  // TODO
  // this is slightly inefficient.
  $scope.data.forEach(function (item) {
    total.before = (total.before || 0) + item.balance;
    total.debit = (total.debit || 0) + item.debit;
    total.credit = (total.credit || 0) + item.credit;
    total.after = (total.after || 0) + item.balance + (item.credit - item.debit);
  });

  $scope.ok = function () {
    connect.fetch('/post/'+ request.key +'/')
    .then(function () {
      $modalInstance.close();
    }, function (error) {
      messenger.warning('Posting Failed ' +  JSON.stringify(error));
    });
  };

  $scope.cancel = function () {
    $modalInstance.dismiss();
  };
});
