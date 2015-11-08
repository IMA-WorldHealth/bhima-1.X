angular.module('bhima.controllers')
.controller('cashFlowReportController', CashFlowReportController);

CashFlowReportController.$inject = [
  '$q', '$http', 'connect', 'validate', 'messenger', 'util', 'appcache',
  'exchange', 'SessionService', 'transactionSource'
];

/**
  * Cash Flow Controller
  * This controller is responsible of cash flow report, that report include
  * all incomes minus all depenses
  */
function CashFlowReportController ($q, $http, connect, validate, messenger, util, Appcache, exchange, SessionService, transactionSource) {
  var vm = this,
      session = vm.session = {},
      dependencies = {},
      cache = new Appcache('income_report'),
      state = vm.state;

  session.dateFrom = new Date();
  session.dateTo = new Date();
  session.loading = false;

  dependencies.cashes = {
    required: true,
    query : {
      tables : {
        'cash_box' : {
          columns : ['text', 'project_id']
        },
        'cash_box_account_currency' : {
          columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
        },
        'currency' : {
          columns : ['symbol']
        }
      },
      join : [
        'cash_box.id=cash_box_account_currency.cash_box_id',
        'currency.id=cash_box_account_currency.currency_id'
      ]
    }
  };

  dependencies.cashflow = {};

  dependencies.currencies = {
    required : true,
    query : {
      tables : {
        'currency' : {
          columns : ['id', 'symbol']
        }
      }
    }
  };

  // Expose to the view
  vm.setSelectedCash = setSelectedCash;
  vm.fill            = fill;
  vm.convert         = convert;
  vm.reconfigure     = reconfigure;
  vm.getSource       = getSource;
  vm.print           = function () { print(); };

  cache.fetch('selectedCash').then(load);

  // Functions
  function load (selectedCash) {
    if (selectedCash) { session.selectedCash = selectedCash; }

    session.project = SessionService.project;
    dependencies.cashes.query.where = ['cash_box.project_id=' + session.project.id, 'AND', 'cash_box.is_auxillary=0'];
    validate.process(dependencies, ['cashes'])
    .then(init)
    .catch(function (err) {
      messenger.error(err.toString());
    });
  }

  function init (model) {
    session.model = model;
  }

  function setSelectedCash (obj) {
    session.loading = true;
    vm.state = 'generate';
    session.selectedCash = obj;
    cache.put('selectedCash', obj);
    fill();
  }

  function fill () {
    var request = session.request = {
      dateFrom : util.sqlDate(session.dateFrom),
      dateTo : util.sqlDate(session.dateTo),
    };

    // Make sure the account_id has a valid value
    if (session.selectedCash) {
      request.account_id = session.selectedCash.account_id;
    }
    else {
      request.account_id = null;
    }

    getCashflow()
    .then(getCurrencies)
    .then(prepareReport)
    .then(convert)
    .catch(function (err) {
      messenger.danger(err.toString());
    });
  }

  function getCashflow () {
    return $http({
      url : '/cashflow/report/',
      method : 'GET',
      params : session.request
    });
  }

  function getCurrencies(model) {
    console.log(model);
    session.summationExpense = model.data.expenses;
    session.summationIncome = model.data.incomes;
    return validate.process(dependencies, ['currencies']);
  }


  function prepareReport (model) {
    session.model = model;
    vm.currencies = session.model.currencies;
    session.currency = SessionService.enterprise.currency_id;
    session.loading = false;
  }

  function convert (){
    session.sum_debit = 0;
    session.sum_credit = 0;
    if(session.summationIncome) {
      session.summationIncome.forEach(function (transaction) {
        session.sum_debit += exchange.convertir(transaction.value, transaction.currency_id, session.currency, new Date()); //transaction.trans_date
      });
    }

    if(session.summationExpense) {
      session.summationExpense.forEach(function (transaction) {
        session.sum_credit += exchange.convertir(transaction.value, transaction.currency_id, session.currency, new Date()); //transaction.trans_date
      });
    }
  }

  function reconfigure () {
    vm.state = null;
    vm.session.selectedCash = null;
    vm.session.dateFrom = new Date();
    vm.session.dateTo = new Date();
  }

  /**
    * getSource
    * This function translate humanly a transaction type
    * @param : txt = string correponding to a transaction type
    */
  function getSource (txt) {
    return transactionSource.get(txt);
  }
}
