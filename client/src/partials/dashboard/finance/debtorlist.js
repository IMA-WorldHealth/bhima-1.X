angular.module('bhima.controllers')

.controller('DebtorListDashboardController', ['FinanceDashboardService', function (Finance) {
  var self = this;

  self.isLoading = true;

  // limits
  self.limits = {
    10 : 10,
    25 : 25,
    50 : 50,
    'All' :1000 
  };

  self.limit = 25;
 
  Finance.getTopDebtors()
  .then(function (response) {
    console.log('Debtors response.data:', response.data);
    self.isLoading = false;
    self.data = response.data;
  });
}]);
