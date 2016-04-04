angular.module('bhima.services')
.service('transactionSource', ['$translate', function ($translate) {
  var sources = {
      'accounting'            : 'CASH.FLOW.GROUP_DEB_INVOICE',
      'pcash_convention'      : 'CASH.FLOW.CONVENTION_PAYMENT',
      'pcash_transfert'       : 'CASH.FLOW.PATIENT_PAYMENT',
      'generic_income'        : 'CASH.FLOW.GENERIC_INCOME',
      'generic_expense'       : 'CASH.FLOW.GENERIC_EXPENSE',
      'indirect_purchase'     : 'CASH.FLOW.INDIRECT_PURCHASE',
      'pcash_employee'        : 'CASH.FLOW.PCASH_EMPLOYEE',
      'cash_return'           : 'CASH.FLOW.CASH_RETURN',
      'cotisation_paiement'   : 'CASH.FLOW.COTISATION_PAYMENT',
      'tax_payment'           : 'CASH.FLOW.TAX_PAYMENT',
      'salary_advance'        : 'CASH.FLOW.SALARY_ADVANCE',
      'import_automatique'    : 'CASH.FLOW.IMPORT_AUTO',
      'cash'                  : 'CASH.FLOW.CASH',
      'journal'               : 'CASH.FLOW.JOURNAL'
    };

  this.mappingText = function (text) {
    return sources[text] ? sources[text] : text;
  };

}]);
