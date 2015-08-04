angular.module('bhima.controllers')

// Creates rows for the journal voucher form
.factory('JournalVoucherRowFactory', function () {
  return {
    type : 'accountSelect',
    debit : undefined,
    credit : undefined,
    account_id : undefined,

    // allows the row to select based on account or debitor
    isAccountSelect : function () {
      return this.type === 'accountSelect';
    },

    // used for validation checks
    isValid : function () {

      // must have a one non-zero value
      var validAmount = 
          (this.debit > 0 && !this.credit) ||
          (!this.debit && this.credit > 0);

      // must have either a debitor/creditor switch
      // or an account
      var validAccount =
          (angular.isDefined(this.debcred) ||
           angular.isDefined(this.account));
    
      return validAmount && validAccount;
    }
  };
});
