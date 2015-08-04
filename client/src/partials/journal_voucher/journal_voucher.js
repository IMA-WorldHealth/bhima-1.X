angular.module('bhima.controllers')
.controller('JournalVoucherController', [
  '$http',
  'appcache',
  'messenger',
  'uuid',
  'exchange',
  function ($http, AppCache, messenger, uuid, exchange) {

    var dependencies = {},
        db = new AppCache('journal.voucher');

    var self = this;

    // load dependencies
    $http.get('/finance/currencies')
    .success(function (data) {
      self.currencies = data;
    })
    .error(function (error) {
      console.error(error);
    });

    // current timestamp
    self.today = new Date();

    self.showComment = false;
    self.showReference = false;

    // toggle comment field
    self.toggleComment = function () {
      self.showComment = !self.showComment;
    };

    // toggle reference field
    self.toggleReference = function () {
      self.showReference = !self.showReference;
    };

    // do the final submit checks
    self.submitForm = function (isValid) {
      // TODO
    };

  }
])

.controller('JournalVoucherTableController', ['$http', '$q', function ($http, $q) {

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

  // alias this
  var self = this;

  // self is the format of the rows in the journal voucher table
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
  self.rows = [generateRow(), generateRow()];
  self.totals = {
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
    self.accounts = data;
  })
  .error(handle);

  // load debtors
  $http.get('/finance/debtors')
  .success(function (data) {
    self.debtors = data;
  })
  .error(handle);

  // load creditors
  $http.get('/finance/creditors')
  .success(function (data) {
    self.creditors = data;
  })
  .error(handle);

  /* Toggles */

  // switches between the account typeahead
  // and the debtor/creditor typeahead
  self.toggleAccountSwitch = function (row) {
    row.selectAccount = !row.selectAccount;
  };

  // switches the debtor or creditor type
  self.setDebtorOrCreditorType = function (row, type) {
    row.deb_cred_type = type;
  };

  /* Totalling */

  // total debits
  self.totalDebit = function () {
    self.totals.debits = self.rows.reduce(function (total, row) {
      return total + row.debit;
    }, 0);
  };

  // total credits
  self.totalCredit = function () {
    self.totals.credits = self.rows.reduce(function (total, row) {
      return total + row.credit;
    }, 0);
  };

  /* Row Controls */

  // adds a row to the table
  self.addRow = function () {
    self.rows.push(generateRow());
  };

  // removes a row from the table
  self.removeRow = function (idx) {
    self.rows.splice(idx, 1);
  };

}]);
