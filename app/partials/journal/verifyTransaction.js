angular.module('kpk.controllers').controller('verifyTransaction', function($scope, $modalInstance,connect) { 
  var transaction = $scope.transaction = {};
  
  transaction.date = inputDate(new Date());
 
  connect.req('/max/trans_id/general_ledger/posting_journal/').then(function(res) { 
    transaction.id = ++res.data.max;
    console.log('tr', transaction);
  }, function(err) { console.log(err) });

  function submitTransaction() { 

    $modalInstance.close(transaction);
  }

  function inputDate(date) {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    console.log('date', date);
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
  }

  $scope.cancel = function() { $modalInstance.dismiss() };
  $scope.submit = submitTransaction;
});
