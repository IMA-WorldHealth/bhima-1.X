angular.module('bhima.controllers')

.controller('DebtorGroupListDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  self.isLoading = true;

  // limits
  self.limits = {
    10 : 10,
    25 : 25,
    50 : 50,
    'All' : Infinity
  };

  self.limit = 25;
 
  Finance.getTopDebtorGroups()
  .then(function (response) {
    console.log('DebtorGroup Response.data:', response.data);
    self.isLoading = false;
    self.data = response.data;
  });
}]);
