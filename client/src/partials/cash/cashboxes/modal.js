angular.module('bhima.controllers')
.controller('CashboxCurrencyModalController', CashboxCurrencyModalController);

CashboxCurrencyModalController.$inject = [
  '$uibModalInstance', 'AccountService', 'CashboxService',
  'currency', 'cashboxId'
];

/**
* CashboxCurrencyModalController
*
* This modal is responsible for creating the currency infrastructure behind
* cashboxes.  Each cashbox must a currencied account defined for each currency
* supported by the application.
*/
function CashboxCurrencyModalController($instance, Accounts, Boxes, currency, cashboxId) {
  var vm = this;

  // bind data
  vm.currency = currency;
  vm.data = {
    cashbox_id : cashboxId,
    currency_id : currency.id
  };

  // bind methods
  vm.cancel = cancel;
  vm.submit = submit;

  /* ------------------------------------------------------------------------ */

  // generic error handling
  function handler(error) {
    vm.error = true;
    console.log(error);
  }

  function startup() {
    loadAccounts();
  }

  // loads accounts and properly formats their
  function loadAccounts() {
    Accounts.list().then(function (accounts) {

      // label accounts
      accounts.forEach(function (account) {
        account.label = account.account_number + ' ' + account.account_txt;
      });

      vm.accounts = accounts;
    }).catch(handler);
  }

  // return data to the 
  function submit(invalid) {
    if (invalid) { return; }
    $instance.close(vm.data);
  }

  function cancel() {
    $instance.dismiss();
  }

  // startup the controller
  startup();
}
