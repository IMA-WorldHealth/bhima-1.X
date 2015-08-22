angular.module('bhima.controllers')

.controller('DebtorGroupDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  self.isLoading = true;
 
  /*
  Finance.getTopDebtorGroups()
  .then(function (response) {
    self.isLoading = false;
    self.data = response.data;
  });
  */
}]);
