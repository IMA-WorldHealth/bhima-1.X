angular.module('bhima.controllers')
.controller('TrialBalanceController', [
  '$scope',
  '$modalInstance',
  '$location',
  '$http',
  'errorCodes',
  'precision',
  'transactions',
  function ($scope, $modalInstance, $location, $http, errorCodes, precision, transactions) {

    // alais controller object
    var self = this;

    // globals
    self.totals = {};
    self.state = 'loading';

    // load data and perform totalling
    $http.get('/journal/trialbalance?transactions=' + transactions.join(','))
    .then(function (response) {
      self.state = 'default';

      // attach to controller
      self.balances = response.data.balances;
      self.metadata = response.data.metadata;
      self.exceptions = response.data.exceptions;

      console.log('Exceptions:', self.exceptions);

      // helper toggles
      self.hasExceptions = self.exceptions.length > 0;
      self.hasErrors = self.exceptions.some(function (e) {
        return e.fatal;
      });

      // sum the totals up
      self.totals  = self.balances.reduce(function (totals, row) {
        totals.before += row.balance;
        totals.debit += row.debit;
        totals.credit += row.credit;
        totals.after += (row.balance + precision.round(row.credit - row.debit));
        return totals;
      }, { before : 0, debit : 0, credit : 0, after : 0 });
    })
    .catch(function (error) {
      console.error(error);
    });

    self.postToGeneralLedger = function submit () {
      $http.post('/journal/togeneraledger')
      .then(function () {
        $modalInstance.close();
      })
      .catch(function (error) {
        console.log(error);
      });
    };

    self.cancelModal = function () {
      $modalInstance.dismiss();
    };

    self.print = function print () {
      $location.path('/trialbalance/print?transactions=' + transactions.join(','));
      $modalInstance.dismiss();
    };

    self.toggleExceptionState = function () {
      self.state = (self.state === 'exception') ? 'default' : 'exception';
    };
    
    self.toggleVisibility = function (e) {
      e.visible = !e.visible;
    };
  }
]);
