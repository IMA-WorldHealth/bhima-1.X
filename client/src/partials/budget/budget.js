angular.module('bhima.controllers')
.controller('budget', [
  '$scope', 
  '$window',
  '$translate',
  'validate',
  'precision',
  'messenger',
  'appstate',
  function($scope, $window, $translate, validate, precision, messenger, appstate) {
    var dependencies = {},
        enterprise_id = null,
        session = $scope.session = {};

    // Set up session defaults
    session.mode = 'select';
    session.fiscal_year = null;
    
    // Define the database queries
    dependencies.accounts = {
      query : '/InExAccounts/'
    };

    // TODO: Convert this into a server-side get query that does totals
    // NOTE: No need to restrict this to income/expense since budgets are
    //       never added to anything else.
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
      var totals = {};
      $scope.budgets.data.forEach(function (bud) {
	if (bud.account_id in totals) {
	  totals[bud.account_id] += bud.budget;
	  }
	else {
	  totals[bud.account_id] = bud.budget;
	  }
	});

      // Insert the budget totals into the account data
      $scope.accounts.data.forEach(function (acct) {
	if (acct.id in totals) {
	  acct.budget = precision.round(totals[acct.id], 4);
	  }
	else {
	  if (acct.type === 'title') {
	    acct.budget = null;
	    }
	  else {
	    acct.budget = 'NA';
	    }
	  }
	});
    }

    function start(models) {
      angular.extend($scope, models);
      $scope.accounts.data.forEach(function (acct) {
	if ((acct.type !== 'title') && (acct.balance === null)) {
	  acct.balance = 0.0;
	  }
	});
      addBudgetData();
      session.mode = 'display';
    }

    function displayAccounts() {
      dependencies.accounts.query += enterprise_id;
      dependencies.budgets.query.where = ['period.fiscal_year_id=' + session.fiscal_year.id];
      validate.refresh(dependencies, ['accounts', 'budgets'])
 	.then(start);
    }

    function selectYear(id) {
      session.fiscal_year = $scope.fiscal_years.data.filter(function (obj) {
	return obj.id === id;
	})[0];
    }

    function loadFiscalYears(models) {
      angular.extend($scope, models);
      // Default to the last fiscal year
      session.fiscal_year = $scope.fiscal_years.data[$scope.fiscal_years.data.length - 1];
    }

    // Register this controller
    appstate.register('enterprise', function (enterprise) {
      enterprise_id = Number(enterprise.id);
      $scope.enterprise = enterprise;
      dependencies.fiscal_years.query.where = [ 'fiscal_year.enterprise_id=' + enterprise_id ];
      validate.process(dependencies, ['fiscal_years'])
        .then(loadFiscalYears);
    });


    function print() {
      $window.print();
    }

    // Set up the exported functions
    $scope.selectYear = selectYear;
    $scope.displayAccounts = displayAccounts;
    $scope.print = print;

}]);
