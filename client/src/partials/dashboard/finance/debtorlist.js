angular.module('bhima.controllers')

.controller('DebtorListDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  self.isLoading = true;

  // limits
  self.limits = {
    10 : 10,
    25 : 25,
    50 : 50,
    'ALL' : Infinity
  };

  self.limit = 25;
 
  Finance.getTopDebtors(self.limit)
  .then(function (response) {
    console.log('Debtors response.data:', response.data);
    self.isLoading = false;
    self.data = response.data;
  });
}]);
