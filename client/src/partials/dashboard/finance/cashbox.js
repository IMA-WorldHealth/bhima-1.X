angular.module('bhima.controllers')

// Cash Box Chart Controllers
// 
// The framework for how to do dashboards is still a work in progress.
// The code below is poorly written, as I am still prototyping how to
// all the different pieces together.  It should be rewritten as soon
// as we understand what each chart/controller will do.
.controller('CashBoxChartController', ['$scope', '$filter', 'appcache', 'FinanceDashboardService', function ($scope, $filter, AppCache, Finance) {

  // alias this
  var self = this,
      cache = new AppCache('CashBoxChart'),
      $date = $filter('date');
      

  // defaults
  self.currencyId = 1;
  self.hasPostingJournal = 1;

  // TODO
  // This should be chosen, and format the axes labels appropriately
  self.cashBoxGrouping = 'month';

  // records the data for the chart
  self.chart = {};

  // load defaults from localstorage
  function loadChartDefaults() {
    return cache.fetch('options')
    .then(function (options) {
      if (options) {
        self.currencyId = options.currencyId;
        self.hasPostingJournal = options.hasPostingJournal;
        self.cashBoxId = options.cashBoxId;
      }
    });
  }

  // retrieve the list of cashboxes from the server
  self.getCashBoxes = function () {
    return Finance.getCashBoxes();
  };

  // load the balance data for a single account
  self.getCashBalance = function (cashBoxId) {
    console.log('Loading cash balance:', cashBoxId);
    Finance.getCashBoxBalance(cashBoxId, self.currencyId, self.hasPostingJournal)
    .then(function (response) {
      console.log('CashBoxBalance:', response.data);

      // this is the immediate overview (income, expense, balance)
      self.meta = response.data[0];
    });
  };

  // load the analytics history of the given cashbox
  self.getCashHistory = function (cashBoxId) {
    console.log('Loading cash history:', cashBoxId);
    Finance.getCashBoxHistory(cashBoxId, self.currencyId, self.hasPostingJournal, self.cashBoxGrouping)
    .then(function (response) {
      var data = response.data;
      console.log('CashBoxHistory', response.data);

      // assign chart data
      self.chart.data = [
        data.map(function (row) { return row.debit; }),
        data.map(function (row) { return row.credit; }),
        data.map(function (row) { return row.balance; })
      ];

      // assign the chart series
      self.chart.series = ['Income', 'Expense', 'Balance'];
      
      // assign the chart labels
      self.chart.labels = data.map(function (row) { return $date(row.trans_date, 'MMM yyyy'); });

      console.log(self.chart);

    });
  };

  // in initialize the module
  self.getCashBoxes()
  .then(function (response) {
    self.cashBoxes = response.data;
    return loadChartDefaults();
  })
  .then(function () {

    // make sure we have a cash box id defined
    if (!self.cashBoxId) {
      self.cashBoxId = self.cashBoxes[0].id;
    }

    // load module data
    self.getCashBalance(self.cashBoxId);
    self.getCashHistory(self.cashBoxId);
  });

  function saveChartDefaults() {
    cache.put('options', {
      currencyId : self.currencyId,
      hasPostingJournal : self.hasPostingJournal,
      cashBoxId : self.cashBoxId
    });
  }

  // refreshes the chart
  self.refresh = function () {

    // first, save the metadata
    saveChartDefaults();

    // load module data
    self.getCashBalance(self.cashBoxId);
    self.getCashHistory(self.cashBoxId);
  };

}]);
