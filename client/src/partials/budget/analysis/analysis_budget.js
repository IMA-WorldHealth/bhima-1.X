angular.module('bhima.controllers')
.controller('budget.analysis', [
  '$q',
  '$scope', 
  '$window',
  '$translate',
  'validate',
  'precision',
  'messenger',
  'appstate',
  'util',
  function($q, $scope, $window, $translate, validate, precision, messenger, appstate, util) {
    var dependencies = {},
        enterprise_id = null,
        session = $scope.session = {},
        config = $scope.config = {};

    // Set up session defaults
    session.mode = 'configuration';
    session.periods = null;
    session.selectedPreviousFY = null;

    $scope.months = {
      0 : 'OPERATING_ACCOUNT.ALL',
      1 : 'OPERATING_ACCOUNT.JANUARY',
      2 : 'OPERATING_ACCOUNT.FEBRUARY',
      3 : 'OPERATING_ACCOUNT.MARCH',
      4 : 'OPERATING_ACCOUNT.APRIL',
      5 : 'OPERATING_ACCOUNT.MAY',
      6 : 'OPERATING_ACCOUNT.JUNE',
      7 : 'OPERATING_ACCOUNT.JULY',
      8 : 'OPERATING_ACCOUNT.AUGUST',
      9 : 'OPERATING_ACCOUNT.SEPTEMBER',
      10 : 'OPERATING_ACCOUNT.OCTOBER',
      11 : 'OPERATING_ACCOUNT.NOVEMBER',
      12 : 'OPERATING_ACCOUNT.DECEMBER'
    };
    $scope.total = {};

    dependencies.accounts = {};
    dependencies.budgets = {
      query : {
        tables : {
          'budget' : { 
            columns : ['id', 'account_id', 'period_id', 'budget']
            },
          'period' : {
            columns : ['fiscal_year_id', 'period_number', 'period_start', 'period_stop', 'locked' ]
            }
          },
        join : [ 'period.id=budget.period_id' ]
      }
    };

    dependencies.fiscal_years = {
      query : {
        tables : {
          'fiscal_year' : {
            columns : ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year']
          },
        },
        orderby : ['fiscal_year.start_year', 'fiscal_year.start_month'],
      }
    };

    function addBudgetData() {
      // Insert the budget numbers into the account data
      // TODO: The following procedural hacks can be simplified by better SQL queries...
      // First compute the totals for any accounts with budgets
      var totalBudget = 0.0;
      var totalBalance = 0.0;
      var totals = {};
      $scope.budgets.data.forEach(function (bud) {
        if (bud.account_id in totals) {
          totals[bud.account_id] += bud.budget;
        }
        else {
          totals[bud.account_id] = bud.budget;
        }
        totalBudget += bud.budget;
      });

      var accounts_data_id = [];
      $scope.accounts.data.forEach(function (acct) {
        accounts_data_id.push(acct.id);
      });

      // Previous Budgets processing
      // Total budget per fiscal year
      var totalsFY = {},
          totalBudgetFY = {};
      session.selectedPreviousFY.forEach(function (fy) {
        totalsFY[fy.id] = {};
        totalBudgetFY[fy.id] = 0.0;
        $scope.fiscalYearBudget[fy.id].forEach(function (bud) {
          if (bud.account_id in totalsFY[fy.id]) {
            totalsFY[fy.id][bud.account_id] += bud.budget;
          }
          else {
            totalsFY[fy.id][bud.account_id] = bud.budget;
          }
          // FIXME totalBudgetFY[fy.id] must be for either expense, or income or all
          // FIXME but retrieving for all account type at all time
          totalBudgetFY[fy.id] += bud.budget;
        });
      });


      // Insert the budget totals into the account data
      $scope.accounts.data.forEach(function (acct) {
        // Current budget
        if (acct.id in totals) {
          acct.budget = precision.round(totals[acct.id], 2);
        } else {
          if (acct.type === 'title') {
            acct.budget = null;
          } else {
            acct.budget = 0; // No budget means 0 budget!
          }
        }

        // Previous Budgets
        acct.previousBudget = {};
        session.selectedPreviousFY.forEach(function (fy) {
          if (acct.id in totalsFY[fy.id]) {
            acct.previousBudget[fy.id] = precision.round(totalsFY[fy.id][acct.id], 2);
          } else {
            if (acct.type === 'title') {
              acct.previousBudget[fy.id] = null;
            } else {
              acct.previousBudget[fy.id] = 0; // No budget means 0 budget!
            }
          }
        });

        // Increment total balance
        if (!isNaN(acct.balance)) {
          totalBalance += acct.balance;
        }
      });

      $scope.total.budget = precision.round(totalBudget, 2);
      $scope.total.balance = precision.round(totalBalance, 2);
      // Previous Budget Data
      $scope.totalPreviousBudget = {};
      session.selectedPreviousFY.forEach(function (fy) {
        $scope.totalPreviousBudget[fy.id] = Math.round(totalBudgetFY[fy.id], 2);
      });
    }

    function parseAccountDepth(accountData, accountModel) {
      // Copied from chart of accounts, should refactor surplus deficit
      var totalSurplus = 0.0,
          totalDeficit = 0.0;

      accountData.forEach(function (account) {
        var parent, depth = 0;
        if(account.classe === 6 || account.classe === 2){
          if(account.budget > account.balance) {
            account.surplus = account.budget - account.balance;
            account.deficit = 0;
          } else if (account.budget < account.balance) {
            account.deficit = account.balance - account.budget;
            account.surplus = 0;
          } else {
            account.deficit = 0;
            account.surplus = 0;
          }
        } else if(account.classe === 7 || account.classe === 1 || account.classe === 5){
          if(account.budget < account.balance) {
            account.surplus = account.balance - account.budget ;
            account.deficit = 0;
          } else if (account.budget > account.balance) {
            account.deficit = account.budget - account.balance;
            account.surplus = 0;
          } else {
            account.deficit = 0;
            account.surplus = 0;
          }
        }
        totalSurplus += account.surplus;
        totalDeficit += account.deficit;  

        //TODO if parent.depth exists, increment and kill the loop (base case is ROOT_NODE)
        parent = accountModel.get(account.parent);
        depth = 0;
        while (parent) {
          depth += 1;
          parent = accountModel.get(parent.parent);
        }
        account.depth = depth;
      });
      $scope.total.surplus = precision.round(totalSurplus);
      $scope.total.deficit = precision.round(totalDeficit);  
    }

    function start(models) {
      angular.extend($scope, models);
      $scope.accounts.data.forEach(function (acct) {
        if ((acct.type !== 'title') && (acct.balance === null)) {
          acct.balance = 0.0;
        }
      });

      filterAccounts($scope.accounts.data)
      .then(addBudgetData);
      parseAccountDepth($scope.accounts.data, $scope.accounts);
      session.mode = 'budget-analysis';
    }

    function displayAccounts() {
      dependencies.accounts.query = '/InExAccounts/' +enterprise_id;
      // Process period
      var periodCriteria;
      var selectedPeriod = session.periods.filter(function (p) {
        return p.id === config.period_id;
      })[0];
      if (selectedPeriod.period_number === 0) {
        dependencies.budgets.query.where = ['period.fiscal_year_id=' + config.fiscal_year_id];
      } else {
        dependencies.budgets.query.where = ['period.fiscal_year_id=' + config.fiscal_year_id, 'AND', 'period.id='+selectedPeriod.id];
      }
      validate.refresh(dependencies, ['accounts', 'budgets'])
      .then(start);
    }

    function previousFYBudget(selectedPreviousFY) {
      // Get budget data for all previous fiscal years
      $scope.fiscalYearBudget = {};
      for(var fy in selectedPreviousFY) {
        var budget = { 
          id           : selectedPreviousFY[fy].id, 
          data         : null, 
          totalBudget  : 0, 
          totalBalance : 0 
        };
        $scope.fiscalYearBudget[budget.id] = {};
        getBudget(budget.id);
      }

      function getBudget(fiscal_year_id) {
        // Work with a copy of dependencies.budgets structure
        // for a temporary previous fiscal years budgets
        dependencies.previousFYBudget = dependencies.budgets;
        // Process period
        var periodCriteria;
        var selectedPeriod = session.periods.filter(function (p) {
          return p.id === config.period_id;
        })[0];
        if (selectedPeriod.period_number === 0) {
          dependencies.previousFYBudget.query.where = ['period.fiscal_year_id=' + fiscal_year_id];
        } else {
          dependencies.previousFYBudget.query.where = ['period.fiscal_year_id=' + fiscal_year_id, 'AND', 'period.period_number='+selectedPeriod.period_number];
        }
        validate.refresh(dependencies, ['previousFYBudget'])
        .then(function (model) {
          var data = model.previousFYBudget.data;
          handleFiscalYearBudget(fiscal_year_id, data);
        });
      }

      function handleFiscalYearBudget(fiscal_year_id, data) {
        $scope.fiscalYearBudget[fiscal_year_id] = data;
      }
    }

    function loadFiscalYears(models) {
      angular.extend($scope, models);
    }

    // Register this controller
    appstate.register('enterprise', function (enterprise) {
      enterprise_id = Number(enterprise.id);
      $scope.enterprise = enterprise;
      dependencies.fiscal_years.query.where = [ 'fiscal_year.enterprise_id=' + enterprise_id ];
      validate.process(dependencies, ['fiscal_years'])
        .then(loadFiscalYears);
    });

    function loadPeriod(fiscal_year_id) {
      dependencies.period = {
        query : {
          tables : {
            'period' : { columns : ['id', 'period_number', 'period_start', 'period_stop'] }
          },
          where : ['period.fiscal_year_id=' + fiscal_year_id, 'AND', 'period.id<>0']
        }
      };

      validate.refresh(dependencies, ['period'])
      .then(function (model) {
        session.periods = model.period.data;
        loadPreviousFiscalYears(fiscal_year_id);
      });
    }

    function loadPreviousFiscalYears(fiscal_year_id) {
      session.previous_fiscal_years = [];
      var current = $scope.fiscal_years.get(fiscal_year_id);
      if (current.previous_fiscal_year) {
        session.previous_fiscal_years = $scope.fiscal_years.data.filter(function (fy) {
          var currentDate = new Date(current.start_year, current.start_month, 1);
          var otherDate = new Date(fy.start_year, fy.start_month, 1);
          return (currentDate > otherDate) ? true : false;
        });
      }
    }

    function budgetAnalysis() {

      if (config.fiscal_year_id && config.period_id) {
        var selectedPeriod = session.periods.filter(function (p) {
          return p.id === config.period_id;
        })[0];
        session.selectedPeriod = $translate.instant($scope.months[selectedPeriod.period_number]);
        session.selectedFiscalYear = $scope.fiscal_years.get(config.fiscal_year_id);
        getSelectPreviousFY()
        .then(previousFYBudget)
        .then(displayAccounts);
      }

      function getSelectPreviousFY() {
        var def = $q.defer();
        session.selectedPreviousFY = session.previous_fiscal_years.filter(function(fy) {
          return fy.checked;
        });
        def.resolve(session.selectedPreviousFY);
        return def.promise;
      }
    }

    function exportToCSV() {
      // Construct the raw CSV string with the account budget/balance data
      var lf = '%0A';
      var sp = '%20';

      // Get previous fy labels
      var previousLabels = '';
      session.selectedPreviousFY.forEach(function (fy, index) {
        previousLabels += (index === session.selectedPreviousFY.length - 1) ? '"'+ fy.fiscal_year_txt +'"' : '"'+ fy.fiscal_year_txt +'", ';
      });

      var csvStr = '"AccountId", "AccountNum", "AccountName", "Budget", "Balance", "Gap Surplus", "Gap Deficit", ' + previousLabels + ', "Type"' + lf;
      $scope.accounts.data.forEach(function (a) {
      var budget = a.budget;
      if (budget === null) {
        budget = '';
        }
      var balance = a.balance;
      if (balance === null) {
        balance = '';
      }

      // Get previous fy budget data
      var previousBudget = '';
      session.selectedPreviousFY.forEach(function (fy, index) {
        previousBudget += (index === session.selectedPreviousFY.length - 1) ? a.previousBudget[fy.id] : a.previousBudget[fy.id] + ', ';
      });


      var title = a.account_txt.replace(/"/g, '\'').replace(/ /g, sp);
      csvStr += a.id + ', ' + a.account_number + ', "' + title + '", ' + budget + ', ' + balance + ', ' + a.surplus + ', ' + a.deficit + ', ' + previousBudget + ', "' + a.type + '"' + lf;
      });

      var today = new Date();
      var date = today.toISOString().slice(0, 19).replace('T', '-').replace(':', '-').replace(':', '-');
      var path = 'budget-' + date + '.csv';

      // Construct a HTML 'download' element to download the CSV data (at the end of the body)
      var e         = document.createElement('a');
      e.href        = 'data:attachment/csv,' + csvStr;
      e.className   = 'no-print';
      e.target      = '_blank';
      e.download    = path;
      document.body.appendChild(e);
      e.click();
    }

    function reconfigure() {
      session.mode = 'configuration';
    }

    function print() {
      $window.print();
    }

    function formatFiscalYear(obj) {
      return '' + obj.fiscal_year_txt + ' - ' + obj.start_month + '/' + obj.start_year;
    }

    function formatPeriod(obj) {
      return '' + $translate.instant($scope.months[obj.period_number]);
    }

    function filterAccounts(model) {
      var accountClass = config.account_class || 0,
          expense = ''+ $translate.instant('BUDGET.ANALYSIS.EXPENSE'),
          income = ''+ $translate.instant('BUDGET.ANALYSIS.INCOME');

      if (accountClass === 6 || accountClass === expense) {
        // Class 6 accounts
        $scope.accounts.data = model.filter(function (acct) {
          return acct.classe === 6 || acct.classe === '6';
        });
      } else if (accountClass === 7 || accountClass === income) {
        // Class 7 accounts
        $scope.accounts.data = model.filter(function (acct) {
          return acct.classe === 7 || acct.classe === '7';
        });
      } 

      return $q.when(true);
    }

    $scope.togglePreviousFY = function togglePreviousFY(bool) {
      session.previous_fiscal_years.forEach(function (fy) {
        fy.checked = bool;
      });
    };

    $scope.deselectAllFY = function deselectAllFY(bool) {
      if (!bool) { $scope.previousFY.all = false; }
    };

    // Set up the exported functions
    $scope.displayAccounts = displayAccounts;
    $scope.exportToCSV = exportToCSV;
    $scope.print = print;
    $scope.loadPeriod = loadPeriod;
    $scope.formatFiscalYear = formatFiscalYear;
    $scope.formatPeriod = formatPeriod;
    $scope.budgetAnalysis = budgetAnalysis;
    $scope.reconfigure = reconfigure;

}]);
