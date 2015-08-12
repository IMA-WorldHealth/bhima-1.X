angular.module('bhima.controllers')
.controller('JournalVoucherController', [
  '$scope',
  '$http',
  'appcache',
  'messenger',
  'uuid',
  'exchange',
  function ($scope, $http, AppCache, messenger, uuid, exchange) {

    /* This controller wraps all the global metadata
     * for the journal voucher and the JournalVoucherTableController.
     * It is responsible for validation checks, submitting
     * the form, and any error handling.
     *
     * AngularJS only allows child $scopes access to parents (via
     * prototypical inheritence on the $parent property), so we define
     * the transaction rows here (master.rows).  All the mechanics of
     * adding and removing rows is done in JournalVoucherTableController,
     * however the final validation check is done here in the function
     * correctTableInput().
     *
     * This is one of the better models for sharing data we have
     * used so far...  Can we do better?
    */

    var dependencies = {},
        isDefined = angular.isDefined,

        // cache TODO
        db = new AppCache('journal.voucher');

    // alias this
    var self = this;

    // trigger error/success text for the transaction table
    self.clientTableError = false;
    self.serverSuccessMessage = false;
    self.serverFailureMessage = false;

    // current timestamp
    self.today = new Date();

    self.showComment = false;
    self.showReference = false;

    // the master form
    // We must define this on the $scope so that the
    // child can access it via $scope.$parent
    $scope.master = self.master = {
      date : self.today,
      rows : [] // the child
    };

    // load dependencies
    $http.get('/finance/currencies')
    .success(function (data) {
      self.currencies = data;
    })
    .error(function (error) {
      console.error(error);
    });


    // toggle comment field
    self.toggleComment = function () {
      self.showComment = !self.showComment;
    };

    // toggle reference field
    self.toggleReference = function () {
      self.showReference = !self.showReference;
    };

    // do the final submit checks
    self.submitForm = function () {
      self.serverFailureMessage = false;
      self.serverSuccessMessage = false;

      if (!correctTableInput()) {
        self.clientTableError = true;
        return;
      }

      $http.post('/finance/journalvoucher', { data : $scope.master })

      // success!  Clear the data to start again.
      .success(function (data) {

        self.serverSuccessMessage = data;

        // reset form validation checks
        $scope.VoucherForm.$setPristine();

        // new form set up
        self.master = $scope.master = { date : self.today, rows : [] };

        // tell the child controller to import the new form
        $scope.$broadcast('table.reset');
      })

      // something went wrong... log it!
      .error(function (error) {
        self.serverFailureMessage = error;
        console.error(error);
      });
    };


  // ensure that the table portion is valid before submitting
  function correctTableInput() {

    // validate that the rows contain the correct format
    var validRows = self.master.rows.every(function (row) {

      // must have a one non-zero value
      var validAmount =
          (row.debit > 0 && !row.credit) ||
          (!row.debit && row.credit > 0);

      // must have either a debitor/creditor switch
      // or an account
      var validAccount =
          (isDefined(row.deb_cred_uuid) && isDefined(row.deb_cred_type)) ||
           isDefined(row.account_id);

      return validAmount && validAccount;
    });

    // validate that the transaction balances
    var totals = self.master.rows.reduce(function (aggregate, row) {
      aggregate.debit += row.debit;
      aggregate.credit += row.credit;
      return aggregate;
    }, { debit : 0, credit : 0 });

    var validTotals = totals.debit === totals.credit;

    // validate that there is only one cost or profit center per line
    var validCenters = self.master.rows.every(function (row) {
      return !(row.cc_id && row.pc_id);
    });

    // TODO
    // Should we include specific error messages (the debits/credits
    // do not balance, missing an account?)
    // It would be easy to do, but very verbose, especially considering
    // translation..
    return validRows && validTotals && validCenters;
  }


}])

.controller('JournalVoucherTableController', ['$http', '$q', '$scope', function ($http, $q, $scope) {

  /* This controller is somewhat complex because it handles the
   * behavior of either specifying an account OR a debtor/creditor
   * to debit/credit in the journal voucher table.
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
   * currency - simply that the transaction balances.  The currency is specified
   * in the parent controller (JournalVoucherController).
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

  // reset when all done
  $scope.$on('table.reset', function () {
    self.rows = $scope.$parent.master.rows;
    self.rows.push(generateRow());
    self.rows.push(generateRow());
    self.totalCredit();
    self.totalDebit();
  });


  // pull in parent rows
  self.rows = $scope.$parent.master.rows;

  // start out with two rows
  self.rows.push(generateRow());
  self.rows.push(generateRow());

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

  // load profit + cost centers
  $http.get('/finance/profitcenters')
  .success(function (data) {
    self.profitcenters = data;
  })
  .error(handle);

  $http.get('/finance/costcenters')
  .success(function (data) {
    self.costcenters = data;
  })
  .error(handle);

  /* Toggles */

  // switches between the account typeahead
  // and the debtor/creditor typeahead
  self.toggleAccountSwitch = function (row) {
    row.selectAccount = !row.selectAccount;
  };

  // switches the debtor or creditor type
  // NOTE switching debtor/creditor type destroys
  // previously cached data
  self.setDebtorOrCreditorType = function (row, type) {
    row.deb_cred_uuid = undefined;
    row.entity = undefined;
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

  /* formatters */
  self.fmtAccount = function (account) {
    return account ?  account.account_number + ' ' +  account.account_txt : '';
  };

  // Set a debtor or creditor for the row
  // First, remove the old account_id.
  // Then, set the deb_cred_uuid and account_id properly
  self.setDebtorOrCreditor = function (row) {
    row.account_id = row.entity.account_id;
    row.deb_cred_uuid = row.entity.uuid;
  };

  // set the account for a row
  // remove all debtor/creditor properties that may
  // have been set on a previous selection
  self.setAccount = function (row) {
    row.account_id = row.account.id;
    row.deb_cred_uuid = undefined;
    row.entity = undefined;
  };

}]);
