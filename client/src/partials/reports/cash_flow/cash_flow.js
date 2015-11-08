angular.module('bhima.controllers')
.controller('cashFlowReportController', CashFlowReportController);

CashFlowReportController.$inject = [
  '$scope', '$q', 'connect', 'validate', 'messenger', 'util', 'appcache',
  'exchange', 'SessionService', 'transactionSource'
];

/**
  * Cash Flow Controller
  * This controller is responsible of cash flow report, that report include
  * all incomes minus all depenses
  */
function CashFlowReportController ($scope, $q, connect, validate, messenger, util, Appcache, exchange, SessionService, transactionSource) {
  var session = $scope.session = {},
      dependencies = {},
      cache = new Appcache('income_report'),
      state = $scope.state;

  session.dateFrom = new Date();
  session.dateTo = new Date();

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

  dependencies.incomes = {};
  dependencies.expenses = {};

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
  $scope.setSelectedCash = setSelectedCash;
  $scope.fill            = fill;
  $scope.convert         = convert;
  $scope.reconfigure     = reconfigure;
  $scope.getSource       = getSource;
  $scope.print           = function () { print(); };

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
    $scope.session.model = model;
    if(session.selectedCash){
      fill();
    }
  }

  function setSelectedCash (obj) {
    $scope.state = 'generate';
    session.selectedCash = obj;
    cache.put('selectedCash', obj);
    fill();
  }

  function fill () {

    var request = {
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

    dependencies.incomes.query = '/reports/income_report/?' + JSON.stringify(request);
    dependencies.expenses.query = '/reports/expense_report/?' + JSON.stringify(request);
    validate.refresh(dependencies, ['incomes', 'expenses', 'currencies'])
    .then(prepareReport)
    .then(convert)
    .then(groupingResult)
    .catch(function (err) {
      messenger.danger(err.toString());
    });
  }

  function prepareReport (model) {
    session.model = model;
    //Currencies
    $scope.currencies = session.model.currencies;
    session.currency = SessionService.enterprise.currency_id;
  }

  function convert (){
    session.sum_debit = 0;
    session.sum_credit = 0;
    if(session.model.incomes.data) {
      session.model.incomes.data.forEach(function (transaction) {
        if(transaction.service_txt === 'indirect_purchase'){
          transaction.primary_cash_uuid = transaction.document_uuid;
        }
        session.sum_debit += exchange.convertir(transaction.debit, transaction.currency_id, session.currency, new Date()); //transaction.trans_date
      });
    }

    if(session.model.expenses.data) {
      session.model.expenses.data.forEach(function (transaction) {
        if(transaction.service_txt === 'indirect_purchase'){
          transaction.primary_cash_uuid = transaction.document_uuid;
        }
        session.sum_credit += exchange.convertir(transaction.credit, transaction.currency_id, session.currency, new Date()); //transaction.trans_date
      });
    }
  }

  function reconfigure () {
    $scope.state = null;
    $scope.session.selectedCash = null;
    $scope.session.dateFrom = null;
    $scope.session.dateTo = null;
  }

  // Grouping by source
  function groupingResult () {
    var temp = {},
        summationIncome = {},
        summationExpense = {};

    // income
    session.summationIncome = [];
    session.model.incomes.data.forEach(function (item, index) {
      temp[item.service_txt] = !temp[item.service_txt] ? true : false;

      if (temp[item.service_txt]) {
        var value = session.model.incomes.data.reduce(function (a, b) {
          return b.service_txt === item.service_txt ? b.debit + a : a;
        }, 0);
        session.summationIncome.push({
          'service_txt' : item.service_txt,
          'value'       : value
        });
      }
    });

    // Expense
    session.summationExpense = [];
    session.model.expenses.data.forEach(function (item, index) {
      temp[item.service_txt] = !temp[item.service_txt] ? true : false;

      if (temp[item.service_txt]) {
        var value = session.model.expenses.data.reduce(function (a, b) {
          return b.service_txt === item.service_txt ? b.credit + a : a;
        }, 0);
        session.summationExpense.push({
          'service_txt' : item.service_txt,
          'value'       : value
        });
      }
    });

  }
  // End Grouping by source

  /**
    * getSource
    * This function translate humanly a transaction type
    * @param : txt = string correponding to a transaction type
    */
  function getSource (txt) {
    return transactionSource.get(txt);
  }
}
