angular.module('kpk.controllers').controller('trialBalance', function ($scope, $modalInstance, request, ids, connect, messenger) {
  $scope.data = request.data;
  $scope.errors = [].concat(request.postErrors, request.sysErrors);

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
    ids =  ids.filter(function (id) { return angular.isDefined(id); });
    connect.fetch('/post/'+ request.key +'/?q=(' + ids.toString() + ')')
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
