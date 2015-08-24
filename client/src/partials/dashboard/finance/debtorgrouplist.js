angular.module('bhima.controllers')

.controller('DebtorGroupListDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  // toggle loading state
  self.isLoading = true;

  // limits
  self.limits = Finance.limits;
  self.limit = 25;
 
  // load list data
  Finance.getTopDebtorGroups()
  .then(function (response) {
    self.isLoading = false;
    self.data = response.data;
  });
}]);
