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

  var income_list = {
    'accounting'            : 'Autres Recettes',
    'pcash_convention'      : 'Clients Conventionnees',
    'pcash_transfert'       : 'Clients Non Conventionnees',
    'generic_income'        : 'Autres Recettes',
    'import_automatique'    : 'Autres Recettes',
    'cash'                  : 'Autres Recettes',
    'journal'               : 'Autres Recettes',
    'pcash_employee'        : 'Autres Recettes',
    'cash_return'           : 'Autres Recettes'
  };

  var expense_list = {
    'accounting'            : 'Autres Depenses',
    'generic_expense'       : 'Autres Depenses',
    'indirect_purchase'     : 'Achat',
    'pcash_employee'        : 'Personnel',
    'cash_return'           : 'Autres Depenses',
    'cotisation_paiement'   : 'Personnel',
    'tax_payment'           : 'Personnel',
    'salary_advance'        : 'Personnel',
    'import_automatique'    : 'Autres Depenses',
    'cash'                  : 'Autres Depenses',
    'journal'               : 'Autres Depenses'
  };

  this.mappingText = function (text) {
    return sources[text] ? sources[text] : text;
  };

  this.getGroup = function (service_text, debit){
    return debit > 0 ? income_list[service_text] : expense_list[service_text];
  };
}]);
