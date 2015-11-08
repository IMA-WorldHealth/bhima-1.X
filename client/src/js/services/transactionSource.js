angular.module('bhima.services')
.service('transactionSource', ['$translate', function ($translate) {
  var sources = {
    'cash' : $translate.instant('SOURCE.CASH'),
    'sale' : $translate.instant('SOURCE.SALE'),
    'journal'               : $translate.instant('SOURCE.JOURNAL'),
    'group_deb_invoice'     : $translate.instant('SOURCE.GROUP_DEB_INVOICE'),
    'credit_note'           : $translate.instant('SOURCE.CREDIT_NOTE'),
    'caution'               : $translate.instant('SOURCE.CAUTION'),
    'import_automatique'    : $translate.instant('SOURCE.IMPORT_AUTOMATIQUE'),
    'pcash_convention'      : $translate.instant('SOURCE.PCASH_CONVENTION'),
    'pcash_transfert'       : $translate.instant('SOURCE.PCASH_TRANSFERT'),
    'generic_income'        : $translate.instant('SOURCE.GENERIC_INCOME'),
    'distribution'          : $translate.instant('SOURCE.DISTRIBUTION'),
    'stock_loss'            : $translate.instant('SOURCE.STOCK_LOSS'),
    'payroll'               : $translate.instant('SOURCE.PAYROLL'),
    'donation'              : $translate.instant('SOURCE.DONATION'),
    'tax_payment'           : $translate.instant('SOURCE.TAX_PAYMENT'),
    'cotisation_engagement' : $translate.instant('SOURCE.COTISATION_ENGAGEMENT'),
    'tax_engagement'        : $translate.instant('SOURCE.TAX_ENGAGEMENT'),
    'cotisation_paiement'   : $translate.instant('SOURCE.COTISATION_PAIEMENT'),
    'generic_expense'       : $translate.instant('SOURCE.GENERIC_EXPENSE'),
    'indirect_purchase'     : $translate.instant('SOURCE.INDIRECT_PURCHASE'),
    'confirm_purchase'      : $translate.instant('SOURCE.CONFIRM_PURCHASE'),
    'salary_advance'        : $translate.instant('SOURCE.SALARY_ADVANCE'),
    'employee_invoice'      : $translate.instant('SOURCE.EMPLOYEE_INVOICE'),
    'pcash_employee'        : $translate.instant('SOURCE.PCASH_EMPLOYEE'),
    'cash_discard'          : $translate.instant('SOURCE.CASH_DISCARD')
  };

  this.get = function (txt) {
    return sources[txt];
  };

}]);
