angular.module('bhima.controllers')
.controller('JournalVoucher', [
  '$scope',
  '$http',
  'appcache',
  'messenger',
  'uuid',
  'exchange',
  'JournalVoucherTableService',
  function ($scope, $http, AppCache, messenger, uuid, exchange, TableService) {

    var dependencies = {},
        db = new AppCache('journal.voucher'),
        data = $scope.data = { rows : [] },
        session = $scope.session = {};

    // current timestamp
    this.today = new Date();

    this.showComment = false;
    this.showReference = false;

    // toggle comment field
    this.toggleComment = function () {
      this.showComment = !this.showComment;
    };

    // toggle reference field
    this.toggleReference = function () {
      this.showReference = !this.showReference;
    };
    
    // do the final submit checks
    this.submitForm = function (isValid) {
      
      // TODO
      if (isValid) {
        alert('Awesome!');
      }
    };

    // totaler fn
    function total(column) {
      function sum(prev, next) { return prev + next[column]; }
      return data.rows.reduce(sum, 0);
    }

    $scope.totalDebit = function () {
      session.totalDebit = total('debit');
      session.validTotals = session.totalCredit === session.totalDebit && session.totalCredit !== 0;
    };

    $scope.totalCredit = function () {
      session.totalCredit = total('credit');
      session.validTotals = session.totalCredit === session.totalDebit && session.totalCredit !== 0;
    };

    $scope.remove = function (index) {
      data.rows.splice(index,1);
    };

    $scope.addRow = function () {
      $scope.totalDebit();
      $scope.totalCredit();
    };

    $scope.selectDebCred = function (row) {
      var e = row.deb_cred;
      row.deb_cred_uuid = e.uuid;
      row.deb_cred_type = e.type === 'd' ?  'D' : 'C';
      row.account_id = $scope.accounts.get(e.account_number).id;
    };

    $scope.selectAccount = function (row) {
      delete row.deb_cred_uuid;
      delete row.deb_cred_type;
      row.account_id = row.account.id;
    };

    $scope.switchEntity = function (row) {
      // We are going from entity --> account
      delete row[row.selectEntity ? 'deb_cred' : 'account'];
      row.selectEntity = !row.selectEntity;
    };
  }
])

.controller('JournalVoucherTableController', ['$scope', '$http', 'JournalVoucherRowFactory'], function ($scope, $http, rowFactory) {
 
  // the rows in the 
  this.tableRows = [rowFactory(), rowFactory()];

  // load dependencies
  
  // error handler
  function handle(error) {
    console.error(error);
  }
  
  // load all accounts
  $http.get('/accounts?type=ohada')
  .success(function (data) {
    $scope.accounts = data;
  })
  .error(handle);

  // load debtors
  $http.get('/finance/debtors')
  .success(function (data) { 
    $scope.debtors = data;
  })
  .error(handle);

  // load creditors
  $http.get('/finance/creditors')
  .success(function (data) {
    $scope.creditors = data;
  })
  .error(handle);
  
  this.selectAccount = function (account) {
        
  };

});
