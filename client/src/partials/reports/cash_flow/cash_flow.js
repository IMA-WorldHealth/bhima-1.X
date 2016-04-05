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
  * @todo remove selection by period_number is not effective when more than one fiscal year
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
  vm.mappingText     = transactionSource.mappingText;
  vm.util            = util;
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
    session.currency_id  = session.selectedCash.currency_id; 
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
    session.openningBalance = exchange.convertir(rows.data.openningBalance.balance, SessionService.enterprise.currency_id, session.currency_id, new Date());

    session.periodicData.forEach(function (flow) {
      groupingResult(flow.incomes, flow.expenses, util.htmlDate(flow.period.period_start));
    });

    session.periodStartArray = session.periodicData.map(function (flow) {
      return util.htmlDate(flow.period.period_start);
    });

    /** openning balance by period */
    session.periodicData.forEach(function (flow) {
      summarization(util.htmlDate(flow.period.period_start));
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
        session.sum_incomes[period] += exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
        session.incomesLabels.push(transaction.service_txt);
      });
    }

    if(session.summationExpense[period]) {
      session.summationExpense[period].forEach(function (transaction) {
        session.sum_expense[period] += exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
        session.expensesLabels.push(transaction.service_txt);
      });
    }

    session.periodicBalance[period] = isFirstPeriod(period) ? 
      session.sum_incomes[period] - session.sum_expense[period] : 
      session.periodicBalance[previousPeriod(period)] + session.sum_incomes[period] - session.sum_expense[period];

    session.periodicOpenningBalance[period] = isFirstPeriod(period) ? 
      session.openningBalance : 
      session.periodicBalance[previousPeriod(period)];

  }

  function isFirstPeriod(period) {
    var reference = session.periodStartArray[0];

    var bool = (new Date(reference).getDate() === 1 && new Date(reference).getMonth() === 0) ?
      new Date(period).getDate() === 1 && new Date(period).getMonth() === 0 : 
      new Date(period).getDate() === new Date(reference).getDate() && 
        new Date(period).getMonth() === new Date(reference).getMonth() && 
        new Date(period).getYear() === new Date(reference).getYear();

    return bool;
  }

  function previousPeriod(period) {
    var currentIndex = session.periodStartArray.indexOf(util.htmlDate(period));
    return (currentIndex !== 0) ? session.periodStartArray[currentIndex - 1] : session.periodStartArray[currentIndex];
  }

  function labelization () {
    var uniqueIncomes = [], uniqueExpenses = [];
    session.incomesLabels = uniquelize(session.incomesLabels);
    session.expensesLabels = uniquelize(session.expensesLabels);

    /** incomes rows */
    session.periodicData.forEach(function (flow) {
      session.incomes[util.htmlDate(flow.period.period_start)] = {};
      session.incomesLabels.forEach(function (label) {
        session.summationIncome[util.htmlDate(flow.period.period_start)].forEach(function (transaction) {
          if (transaction.service_txt === label) {
            session.incomes[util.htmlDate(flow.period.period_start)][label] = exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
          }
        });
      });
    });

    /** totals incomes rows */
    session.periodicData.forEach(function (flow) {
      session.totalIncomes[util.htmlDate(flow.period.period_start)] = 0;
      session.summationIncome[util.htmlDate(flow.period.period_start)].forEach(function (transaction) {
        session.totalIncomes[util.htmlDate(flow.period.period_start)] += exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
      });
    });

    /** expense rows */
    session.periodicData.forEach(function (flow) {
      session.expenses[util.htmlDate(flow.period.period_start)] = {};
      session.expensesLabels.forEach(function (label) {
        session.summationExpense[util.htmlDate(flow.period.period_start)].forEach(function (transaction) {
          if (transaction.service_txt === label) {
            session.expenses[util.htmlDate(flow.period.period_start)][label] = exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
          }
        });
      });
    });

    /** totals expenses rows */
    session.periodicData.forEach(function (flow) {
      session.totalExpenses[util.htmlDate(flow.period.period_start)] = 0;
      session.summationExpense[util.htmlDate(flow.period.period_start)].forEach(function (transaction) {
        session.totalExpenses[util.htmlDate(flow.period.period_start)] += exchange.convertir(transaction.value, SessionService.enterprise.currency_id, session.currency_id, new Date());
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
            'currency_id' : item.currency_id,
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
            'currency_id' : item.currency_id,
            'value'       : value
          });
        }
      });
    }
  }

  function error(err) {
    console.log(err);
  }

}
