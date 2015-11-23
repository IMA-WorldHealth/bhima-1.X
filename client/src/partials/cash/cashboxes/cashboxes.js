angular.module('bhima.controllers')
.controller('CashboxController', CashboxController);

CashboxController.$inject = [
  '$window', '$uibModal', 'SessionService', 'ProjectService', 'CashboxService', 'CurrencyService'
];

/**
* Cashbox Controller
*
* This controller is responsible for creating new cashboxes for the enterprise.
* A valid cashbox must have accounts defined for each enterprise currency, for
* ease of use trhought the application.
*/
function CashboxController($window, $uibModal, Session, Projects, Boxes, Currencies) {
  var vm = this;

  // bind variables
  vm.enterprise = Session.enterprise;
  vm.project = Session.project;

  // bind methods
  vm.create = create;
  vm.update = update;
  vm.cancel = cancel;
  vm.submit = submit;
  vm.delete = del;

  /* ------------------------------------------------------------------------ */

  function handler(error) {
    vm.message = error.data;
    vm.message.type = 'danger';
    console.error(error.data.reason);
  }

  // state transitions
  function setState(state) {
    vm.box = {};
    vm.state = state;
    vm.message = null;
  }

  function startup() {

    // load projects
    Projects.read().then(function (data) {
      vm.projects = data;
    }).catch(handler);

    // load cashboxes
    Boxes.read().then(function (data) {
      vm.cashboxes = data;
    }).catch(handler);

    Currencies.read().then(function (data) {
      vm.currencies = data;
    }).catch(handler);

    // default state
    setState('default');
  }

  function cancel() {
    setState('default');
  }

  function create() {
    setState('create');
    vm.box.currencies = [];
  }

  function update(id) {

    // load the cashbox
    Boxes.read(id).then(function (data) {
      setState('update');

      // workaround until we build a type column into the database.
      // converts is_aux and is_bank columns into radio button select
      if (data.is_auxillary) {
        data.type = 'auxillary';
      } else if (data.is_bank) {
        data.type = 'bank';
      } else {
        data.type = 'primary';
      }

      vm.box = data;

      calculateCurrencyDiff();
    })
    .catch(handler);
  }

  // check if a currency is in the data.currencies array
  function hasCurrency(id) {
    return vm.box.currencies.some(function (c) {
      return c.currency_id === id;
    });
  }

  // calculate what currency accounts are missing from the cashbox
  function calculateCurrencyDiff() {

    vm.registeredCurrencies = vm.currencies.filter(function (currency) {
      return hasCurrency(currency.id);
    });

    vm.missingCurrencies = vm.currencies.filter(function (currency) {
      return !hasCurrency(currency.id);
    });

    vm.hasMissingCurrencies = vm.missingCurrencies.length > 0;
  }

  function submit(invalid) {
    if (invalid) { return; }

    // convert radio buttons into db columns
    switch (vm.box.type) {
      case 'bank' :
        vm.box.is_bank = 1;
        vm.box.is_auxillary = 0;
        break;
      case 'auxillary' :
        vm.box.is_bank = 0;
        vm.box.is_auxillary = 1;
        break;
      default :
        vm.box.is_bank = 0;
        vm.box.is_auxillary = 0;
        break;
    }

    var promise = (vm.state === 'create') ?
      Boxes.create(vm.box) :
      Boxes.update(vm.id, vm.box);

    promise.then(function (message) {
      setState('success');
      vm.message = message;
    })
    .catch(handler);
  }

  function del(box) {
    var yes =
      $window.confirm('Are you sure you want to delete this cashbox?');

    if (yes) {
      Boxes.delete(box.id)
      .then(function (message) {
        setState('success');
        vm.message = {
          type : 'success',
          code : 'CASHBOXES.DELETE_SUCCESS'
        };
      })
      .catch(handler);
    }
  }

  startup();
}
