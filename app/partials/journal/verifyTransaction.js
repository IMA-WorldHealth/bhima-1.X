angular.module('kpk.controllers')
.controller('verifyTransaction', [
  '$scope',
  '$modalInstance',
  'connect',
  'updateType',
  'transaction',
  function($scope, $modalInstance, connect, updateType, transaction) {
    var transaction = $scope.transaction = {},
        defaultLogId = 0,
        defaultTransactionId = 1;

    var typeMap = {
      'split' : split,
      'add' : add
    };

    function split()  {

    }

    function add() {
 
    }

    $scope.formComplete = false;
    $scope.invalidSubmit = "";

    transaction.date = inputDate(new Date());

    connect.req('/max/trans_id/general_ledger/posting_journal/').then(function(res) {
      transaction.id = ++res.data.max || defaultTransactionId;
   
      connect.req('/max/id/journal_log/').then(loadNote);
    }, function(err) { console.log(err); });
   
    function loadNote(res) {
      var maxid = res.data.max || defaultLogId;
      transaction.logId = ++maxid;
      connect.req('/user_session/').then(loadUser);
    }

    function loadUser(res) {
      transaction.userId = res.data.id;
      $scope.formComplete = true;
    }

    function submitTransaction() {
      if (!$scope.formComplete) {
        return $scope.invalidSubmit = "Unable to verify transaction, required data is missing.";
      }
      $modalInstance.close(transaction);
    }

    function inputDate(date) {
      //Format the current date according to RFC3339 (for HTML input[type=="date"])
      return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2);
    }

    $scope.cancel = function() { $modalInstance.dismiss(); };
    $scope.submit = submitTransaction;
  }
]);
