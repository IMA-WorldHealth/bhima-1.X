angular.module('bhima.controllers')
.controller('JournalVoucherController', [
  '$scope',
  '$http',
  'appcache',
  'messenger',
  'uuid',
  'exchange',
  function ($scope, $http, AppCache, messenger, uuid, exchange) {

    var dependencies = {},
        db = new AppCache('journal.voucher');

    // load dependencies
    $http.get('/finance/currencies')
    .success(function (data) {
      $scope.currencies = data;
    })
    .error(function (error) {
      console.log('financeCurrencies error');
      console.log(error);
    });

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
    };

  }
])

.controller('JournalVoucherTableController', ['$scope', '$http', '$q', function ($scope, $http, $q) {

  /* This controller is somewhat complex because it handles the
   * behavior of either specifying an account OR a debtor/creditor
   * to debit/credit.
   *
   * If the user has seleted an account, we must remove the deb_cred_type
   * before submitting to the server. This is done in the .submitForm()
   * method of the parent controller.
   *
   * If the user has selected a debtor/creditor, we must be sure that the
   * row contains
   *   1) the account_id associated with the debtor/creditor
   *   2) the debtor/creditor uuid
   *   3) the debtor/creditor type
   * Most of these are taken care of automatically by the user
   * when selecting the debtor/creditor.
   *
   * Every time a row is updated, the totals must be recalculated.  Since a
   * transaction can only be in one currency, we don't need to know the
   * curreny - simply that the transaction balances.  The currency is specified
   * in the parent controller (JournalVoucherController).
   *
  */

  // this is the format of the rows in the journal voucher table
  function generateRow() {
    return {
      account_id    : undefined,
      deb_cred_uuid : undefined,
      deb_cred_type : 'D',
      debit         : 0,
      credit        : 0,
      cc_id         : undefined,
      pc_id         : undefined,
      selectAccount : true,       // by default, filter accounts
    };
  }

  // start out with two rows
  this.rows = [generateRow(), generateRow()];
  this.totals = {
    credits : 0,
    debits : 0
  };

  /* Load dependencies */

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

  /* Toggles */

  // switches between the account typeahead
  // and the debtor/creditor typeahead
  this.toggleAccountSwitch = function (row) {
    row.selectAccount = !row.selectAccount;
  };

  // switches the debtor or creditor type
  this.setDebtorOrCreditorType = function (row, type) {
    row.deb_cred_type = type;
  };

  /* Totalling */

  // total debits
  this.totalDebit = function () {
    this.totals.debits = this.rows.reduce(function (total, row) {
      return total + row.debit;
    }, 0);
  };

  // total credits
  this.totalCredit = function () {
    this.totals.credits = this.rows.reduce(function (total, row) {
      return total + row.credit;
    }, 0);
  };

  /* Row Controls */

  // adds a row to the table
  this.addRow = function () {
    this.rows.push(generateRow());
  };

  // removes a row from the table
  this.removeRow = function (idx) {
    this.rows.splice(idx, 1);
  };

}]);
