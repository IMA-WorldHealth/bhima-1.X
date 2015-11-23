angular.module('bhima.controllers')
.controller('ExchangeRateController', ExchangeRateController);

ExchangeRateController.$inject = [
  'SessionService', 'DateService', 'CurrencyService', 'ExchangeRateService'
];

/**
* This controller works in tandem with the ExchangeRateService to allow a user to
* set an exchange rate for a given day.
*
* TODO
*   - do not require a new exchange rate every day (see issue #619).
*   - rename service `exchange` to be `ExchangeRateService`
*
* @controller ExchangeRateController
*/
function ExchangeRateController(Session, Dates, Currencies, Rates) {
  var vm = this;

  // bind data
  vm.today = new Date();
  vm.tomorrow = Dates.next.day();
  vm.enterprise = Session.enterprise;
  vm.form = { date : vm.today };

  vm.submit    = submit;

  /* ------------------------------------------------------------------------ */

  // generic error handler
  function handler(error) {
    console.log(error);
  }

  // start up the module
  function startup() {

    // load supported currencies
    Currencies.read().then(function (data) {
      vm.currencies = data;
    }).catch(handler);

    // load supported rates
    Rates.read().then(function (data) {
      vm.rates = data;
    }).catch(handler);
  }

  function submit() {}

  

  // startup the module
  startup();
}
