angular.module('kpk.controllers').controller('verifyTransaction', function($scope, $modalInstance) { 
  var transaction = $scope.transaction = {};
  transaction.date = inputDate(new Date());
  console.log($scope.transaction);

  function inputDate(date) {
    //Format the current date according to RFC3339 (for HTML input[type=="date"])
    console.log('date', date);
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
  }
});
