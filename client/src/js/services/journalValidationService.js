angular.module('bhima.services')
.service('JournalValidationService', [ 
  function () {
    var validationService  = this;

    validationService.isDateValid =  function validDate (item) {
      return angular.isDefined(item.trans_date) && !isNaN(Date.parse(new Date(item.trans_date)));
    };

    validationService.isDebitsAndCreditsValid = function validDebitsAndCredits (item) {
      var credit = Number(item.credit_equiv),
          debit = Number(item.debit_equiv);
      return (angular.isDefined(item.debit_equiv) && angular.isDefined(item.credit_equiv)) &&
          (!isNaN(debit) || !isNaN(credit));
    };

    validationService.isBalanceValid = function validBalance (item) {
      var credit = Number(item.credit_equiv),
          debit = Number(item.debit_equiv);
      return (credit === 0 && debit > 0) || (debit === 0 && credit > 0);
    };

    validationService.isAccountNumberValid = function validAccountNumber (item) {
      return !isNaN(Number(item.account_number));
    };

    validationService.isTotalsValid = function validTotals (totalDebit, totalCredit) {
      return totalDebit === totalCredit;
    };

    validationService.detectSingleEntry = function detectSingleEntry (item) {
      var credit = Number(item.credit_equiv),
          debit = Number(item.debit_equiv);
      return credit === 0 && debit === 0;
    };

    validationService.isPeriodValid = function validPeriod (item) {
      return !isNaN(Number(item.period_id));
    };

    validationService.isValidFiscal = function validFiscal(item) {
      return !isNaN(Number(item.fiscal_year_id));
    };
  }
]);
