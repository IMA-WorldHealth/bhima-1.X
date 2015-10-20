angular.module('bhima.controllers')
.controller('ExchangeRateController', ExchangeRateController);

ExchangeRateController.$inject = [
  'connect', 'appstate', 'validate', 'exchange', 'SessionService', 'DateService'
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
function ExchangeRateController(connect, appstate, validate, exchange, Session, Dates) {
  var vm = this;
  var dependencies = {};

  // bind data
  vm.today = Dates.current.day();
  vm.enterprise = Session.enterprise;
  vm.form = { date : vm.today };
  vm.state = 'default';

  vm.submit    = submit;
  vm.fcurrency = fcurrency;
  vm.setState  = setState;

  /* ------------------------------------------------------------------------ */

  dependencies.currency = {
    required : true,
    query : {
      tables : {
        'currency' : { 'columns' : ['id', 'name', 'symbol', 'note']
        }
      }
    }
  };

  dependencies.rates = {
    query : {
      tables : {
        'exchange_rate' : {
          'columns' : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'rate', 'date']
        }
      }
    }
  };

  //
  appstate.register('exchange_rate', function (rates) {
    vm.globalRates = rates;
  });

  function setState(value) {
    vm.state = value;
  }

  // start up the module
  function initialise() {
    validate.process(dependencies)
    .then(buildModels)
    .catch(handler);
  }

  // generic error handler
  function handler(error) {
    console.log(error);
  }

  function buildModels(models) {
    angular.extend(vm, models);

    console.log('models:', models);

    vm.currentRates = vm.rates.data.filter(function (rate) {
      return new Date(rate.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    });
  }

  function submit() {

    var data = {
      enterprise_currency_id : vm.enterprise.currency_id,
      foreign_currency_id    : vm.form.foreign_currency_id,
      rate                   : vm.form.rate / 100.0,
      date                   : vm.form.date
    };

    connect.post('exchange_rate', [data])
    .then(function (result) {

      var hasGlobalRates = vm.globalRates && vm.globalRates.length > 0;

      vm.globalRates = hasGlobalRates ?
        vm.globalRates.concat([data]) :
        [data];

      appstate.set('exchange_rate', vm.globalRates);

      exchange.forceRefresh();

      // add to store
      data.id = result.data.insertId;
      vm.rates.data.push(data);
      vm.rates.recalculateIndex();

      // reset rate
      vm.state = 'default';
      vm.form = {};
    })
    .catch(handler);
  }

  function fcurrency(currency) {
    return currency.id !== vm.enterprise.currency_id;
  }

  // startup the module
  initialise();
}
