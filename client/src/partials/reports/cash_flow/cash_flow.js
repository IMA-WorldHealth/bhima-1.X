angular.module('bhima.controllers')
.controller('cashFlowReportController', CashFlowReportController);

CashFlowReportController.$inject = [
  '$q', '$http', 'connect', 'validate', 'messenger', 'util', 'appcache',
  'exchange', 'SessionService', 'transactionSource', '$translate'
];

/**
  * Cash Flow Controller
  * This controller is responsible of cash flow report, that report include
  * all incomes minus all depenses
  */
function CashFlowReportController ($q, $http, connect, validate, messenger, util, Appcache, exchange, SessionService, transactionSource, $translate) {
  var vm = this,
      session = vm.session = {},
      dependencies = {},
      cache = new Appcache('cashflow_report'),
      state = vm.state;

  session.dateFrom         = new Date();
  session.dateTo           = new Date();
  session.details          = false;
  session.summationIncome  = [];
  session.summationExpense = [];

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
  vm.reconfigure     = reconfigure;
  vm.getSource       = getSource;
  vm.showDetails     = showDetails;
  vm.print           = function () { print(); };

  // setting date default for a year
  session.dateFrom.setMonth(0, 1); // 01 Jan.
  session.dateTo.setMonth(11, 31); // 31 Dec.

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
    vm.state = 'generate';
    session.selectedCash = obj;
    cache.put('selectedCash', obj);
    fill();
  }

  function fill () {
    initialization();

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
    .then(prepareReport)
    .then(labelization)
    .catch(error);
  }

  function getCashflow () {
    return $http({
      url : '/cash_flow/report/',
      method : 'GET',
      params : session.request
    });
  }

  function prepareReport(rows) {
    initialization();

    session.periodicData = rows.data.flows;
    session.openningBalance = rows.data.openningBalance.balance;

    session.periodicData.forEach(function (flow) {
      groupingResult(flow.incomes, flow.expenses, flow.period.period_number);
    });

    /** openning balance by period */
    session.periodicData.forEach(function (flow) {
      summarization(flow.period.period_number);
    });
  }

  function initialization () {
    session.incomes          = {};
    session.expenses         = {};
    session.summationIncome  = {};
    session.summationExpense = {};
    session.sum_incomes      = {};
    session.sum_expense      = {};
    session.periodicBalance  = {};
    session.periodicOpenningBalance = {};
    session.incomesLabels    = [];
    session.expensesLabels   = [];
    session.totalIncomes     = {};
    session.totalExpenses    = {};
  }
  
  function summarization (period){
    session.sum_incomes[period] = 0;
    session.sum_expense[period] = 0;
    
    if(session.summationIncome[period]) {
      session.summationIncome[period].forEach(function (transaction) {
        session.sum_incomes[period] += transaction.value;
        session.incomesLabels.push(transaction.service_txt);
      });
    }

    if(session.summationExpense[period]) {
      session.summationExpense[period].forEach(function (transaction) {
        session.sum_expense[period] += transaction.value;
        session.expensesLabels.push(transaction.service_txt);
      });
    }

    session.periodicBalance[period] = (period === 1) ? 
      session.openningBalance + session.sum_incomes[period] - session.sum_expense[period] : 
      session.periodicBalance[period - 1] + session.sum_incomes[period] - session.sum_expense[period];

    session.periodicOpenningBalance[period] = (period === 1) ? 
      session.openningBalance : 
      session.periodicBalance[period - 1];
  }

  function labelization () {
    var uniqueIncomes = [], uniqueExpenses = [];
    session.incomesLabels = uniquelize(session.incomesLabels);
    session.expensesLabels = uniquelize(session.expensesLabels);

    /** incomes rows */
    session.periodicData.forEach(function (flow) {
      session.incomes[flow.period.period_number] = {};
      session.incomesLabels.forEach(function (label) {
        session.summationIncome[flow.period.period_number].forEach(function (transaction) {
          if (transaction.service_txt === label) {
            session.incomes[flow.period.period_number][label] = transaction.value;
          }
        });
      });
    });

    /** totals incomes rows */
    session.periodicData.forEach(function (flow) {
      session.totalIncomes[flow.period.period_number] = 0;
      session.summationIncome[flow.period.period_number].forEach(function (transaction) {
        session.totalIncomes[flow.period.period_number] += transaction.value;
      });
    });

    /** expense rows */
    session.periodicData.forEach(function (flow) {
      session.expenses[flow.period.period_number] = {};
      session.expensesLabels.forEach(function (label) {
        session.summationExpense[flow.period.period_number].forEach(function (transaction) {
          if (transaction.service_txt === label) {
            session.expenses[flow.period.period_number][label] = transaction.value;
          }
        });
      });
    });

    /** totals expenses rows */
    session.periodicData.forEach(function (flow) {
      session.totalExpenses[flow.period.period_number] = 0;
      session.summationExpense[flow.period.period_number].forEach(function (transaction) {
        session.totalExpenses[flow.period.period_number] += transaction.value;
      });
    });

  }

  function uniquelize (array) {
    var u = {}, a = [];
    for(var i = 0; i < array.length; i++){
      if(u.hasOwnProperty(array[i])) {
         continue;
      }
      a.push(array[i]);
      u[array[i]] = 1;
    }
    return a;
  }

  function reconfigure () {
    vm.state = null;
    initialization();
  }

  function showDetails () {
    session.details = session.details ? false : true;
  }

  // Grouping by source
  function groupingResult (incomes, expenses, period) {
    var tempIncome  = {},
        tempExpense = {};

    session.summationIncome[period] = [];
    session.summationExpense[period] = [];

    // income
    if (incomes) {
      incomes.forEach(function (item, index) {
        tempIncome[item.service_txt] = angular.isDefined(tempIncome[item.service_txt]) ? false : true;

        if (tempIncome[item.service_txt] === true) {
          var value = incomes.reduce(function (a, b) {
            return b.service_txt === item.service_txt ? b.debit_equiv + a : a;
          }, 0);
          session.summationIncome[period].push({
            'service_txt' : item.service_txt,
            'value'       : value
          });
        }
      });
    }

    // Expense
    if (expenses) {
      expenses.forEach(function (item, index) {
        tempExpense[item.service_txt] = angular.isDefined(tempExpense[item.service_txt]) ? false : true;

        if (tempExpense[item.service_txt] === true) {
          var value = expenses.reduce(function (a, b) {
            return b.service_txt === item.service_txt ? b.credit_equiv + a : a;
          }, 0);
          session.summationExpense[period].push({
            'service_txt' : item.service_txt,
            'value'       : value
          });
        }
      });
    }
  }  

  function error (err) {
    messenger.danger(err.toString());
  }

  /**
    * getSource
    * This function translate humanly a transaction type
    * @param : txt = string correponding to a transaction type
    */
  function getSource (txt) {
    // FIXME: translation broken
    // return transactionSource.source(txt);
    return txt;
  }
}
