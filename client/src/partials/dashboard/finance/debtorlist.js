angular.module('bhima.controllers')

.controller('DebtorListDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  // toggle loading state
  self.isLoading = true;

  // limits
  self.limits = Finance.limits;
  self.limit = 25;
 
  // load data
  Finance.getTopDebtors()
  .then(function (response) {
    self.isLoading = false;
    self.data = response.data;
  });
}]);
