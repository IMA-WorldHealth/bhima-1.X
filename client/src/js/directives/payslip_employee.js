/**
  * This Directive is responsible for generate an employee block of data
  */
angular.module('bhima.directives')
.directive('bhimaPayslipEmployee', function () {
  return {
    restrict    : 'E',
    templateUrl : '/partials/templates/payslipEmployee.tmpl.html',
    scope       : {
      row             : '=employee',
      cotisations     : '=cotisations',
      rubriques       : '=rubriques',
      taxesEmployee   : '=taxesEmployee',
      taxesEnterprise : '=taxesEnterprise',
      currency        : '=currency',
      submit          : '&onSubmit'
    }
  };
});
