angular.module('bhima.controllers')
.controller('PrimaryCashController', PrimaryCashController);

PrimaryCashController.$inject = [
  '$location', '$q', '$modal', 'validate', 'appcache', 'exchange', 'messenger'
];

/**
  * Primary Cash controller
  * This controller is responsible to manage the main menu of primary cash module
  */
function PrimaryCashController ($location, $q, $modal, validate, AppCache, exchange, messenger) {
  var vm = this,
      dependencies  = {},
      configuration = vm.configuration = {},
      session       = vm.session = { configure : false, complete : false },
      cache         = new AppCache('primary_cash');

  dependencies.cashBox = {
    query : {
      tables : {
        cash_box : { columns : ['id', 'text', 'project_id', 'is_auxillary'] }
      },
      where : ['cash_box.is_auxillary=0']
    }
  };

  configuration.income = [
    {
      key : 'PRIMARY_CASH.INCOME.TRANSFER',
      link : '/primary_cash/transfert/'
    },
    {
      key : 'PRIMARY_CASH.INCOME.CONVENTION',
      link : '/primary_cash/convention/'
    },
    {
      key : 'PRIMARY_CASH.INCOME.SUPPORT',
      link : '/primary_cash/support/'
    },
    {
      key : 'PRIMARY_CASH.INCOME.GENERIC.TITLE',
      link : '/primary_cash/income/generic/'
    }
  ];

  configuration.expense = [
    {
      key : 'PRIMARY_CASH.EXPENSE.PURCHASE',
      link : '/primary_cash/expense/purchase/'
    },
    {
     key : 'PRIMARY_CASH.EXPENSE.CASH_RETURN',
     link : '/primary_cash/expense/cash_return/'
    },
    {
       key : 'PRIMARY_CASH.EXPENSE.PAYROLL',
       link : '/primary_cash/expense/payroll/'
    },
    {
      key : 'PRIMARY_CASH.EXPENSE.GENERIC_TITLE',
      link : '/primary_cash/expense/generic/'
    }
  ];

  // Expose to view
  vm.loadPath         = loadPath;
  vm.setConfiguration = setConfiguration;
  vm.reconfigure      = reconfigure;

  // Startup
  startup();

  // Functions
  function startup() {
    session.hasDailyRate = exchange.hasDailyRate();

    validate.process(dependencies)
    .then(parseDependenciesData)
    .then(readConfiguration)
    .then(parseConfiguration)
    .catch(handleError);
  }

  function parseDependenciesData(model) {
    angular.extend(vm, model);
  }

  function readConfiguration() {
    return cache.fetch('cash_box');
  }

  function parseConfiguration(cashbox) {
    var currentModel = vm.cashBox;
    var validConfiguration;

    if (!cashbox) {
      session.configure = true;
      return;
    }

    validConfiguration = angular.isDefined(currentModel.get(cashbox.id));
    if (!validConfiguration) {
      session.configure = true;
      return;
    }

    session.cashbox = cashbox;
    session.complete = true;
    return;
  }

  function loadPath(path) {
    $location.path(path + session.cashbox.id);
  }

  function setConfiguration (cashbox) {
    cache.put('cash_box', cashbox);
    session.configure = false;
    session.complete = true;
    session.cashbox = cashbox;
  }

  function reconfigure() {
    cache.remove('cash_box');
    session.cashbox = null;
    session.configure = true;
    session.complete = false;
  }

  function handleError(error) {
    throw error;
  }

}
