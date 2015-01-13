angular.module('bhima.controllers')
.controller('editAccountBudget', [
  '$scope',
  '$translate',
  '$q',
  'connect',
  'validate',
  'precision',
  'messenger',
  'appstate',
  function ($scope, $translate, $q, connect, validate, precision, messenger, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    // Set up for the database queries
    dependencies.account = {
      query : {
        tables : {
          'account' :{
            columns : ['id', 'account_type_id', 'account_txt', 'account_number']
          },
	  'account_type' : { 
	    columns : ['type'] 
	  },
        },
	join : ['account_type.id = account.account_type_id'],
	where : [ 'account.account_type_id in (1,4)' ]
      }
    };

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

    dependencies.periods = {
      query : {
	tables : {
	  'period' : {
	    columns : ['id', 'fiscal_year_id', 'period_number', 'period_start', 'period_stop', 'locked' ]
	    }
	  },
	}
    };

    dependencies.fiscal = {
      query : {
        tables : {
          'fiscal_year' : {
            columns : ['id', 'fiscal_year_txt', 'start_month', 'start_year', 'previous_fiscal_year']
          },
        },
	orderby: ['fiscal_year.start_year', 'fiscal_year.start_month'],
	limit: 2
      }
    };

    // Initialize the session
    session.state = 'search';
    session.found = false;
    session.account = null;
    session.fiscal_year = null;
    session.numPeriods = null;
    session.totalBudget = 0.0;
    session.validTotal = false;
    session.autoAdjust = false;

    // Basic setup function when the models are loaded
    function startup(models) {
      angular.extend($scope, models);

      session.found = models.budgets.data.length > 0;
      session.numPeriods = models.budgets.data.length;
      var total = 0.0;
      models.budgets.data.forEach(function (b) {
	b.freeze = false;
	b.editing = false;
 	total += Number(b.budget);
      });
      session.totalBudget = total;
    }

    // Initialize editing the selected account
    function submitAccount(newAccount) {
      if (newAccount) { 
	session.account = newAccount;
	// ??? Should this override the where?
        dependencies.account.query.where = ['account.id=' + newAccount.id];
	dependencies.budgets.query.where = [ 'period.fiscal_year_id=' + session.fiscal_year.id, 'AND',
					     'budget.account_id=' + session.account.id ];
	dependencies.periods.query.where = [ 'period.fiscal_year_id=' + session.fiscal_year.id ];
        validate.refresh(dependencies, ['account', 'budgets', 'periods'])
          .then(startup);
	session.state = 'edit';
      }
    }

    function resetAccountSearch() {
      // NOP for now (may need it later)
    }

    // BUDGET: 
    //   `id` int not null auto_increment,
    //   `account_id` int unsigned not null default '0',
    //   `period_id` mediumint unsigned not null,
    //   `budget` decimal(10,4) unsigned,

    function createBudget() {
      var newBudgets = [];
      $scope.periods.data.forEach(function (per, index) {
	newBudgets.push({'account_id' : session.account.id,
			 'period_id' : per.id,
			 'budget' : 0.0});
      });

      connect.post('budget', newBudgets, ['id'])
	.then(function () {
	  messenger.success($translate.instant('BUDGET.EDIT.CREATE_OK'));
	  submitAccount(session.account);
	})
	.catch(function (err) {
	  messenger.danger($translate.instant('BUDGET.EDIT.CREATE_FAIL'));
	  console.log(err);
	});
    }

    function updateBudget() {
      // Save the budget data for all the periods
      var dbPromises = [];
      $scope.budgets.data.forEach(function (bud) {
	dbPromises.push( 
	  connect.put('budget', 
		      [{'id' : bud.id,
			'account_id' : session.account.id,
			'period_id' : bud.period_id,
			'budget' : bud.budget}],
		      ['id']));
      });

      $q.all(dbPromises)
	.then(function () {
	  messenger.success($translate.instant('BUDGET.EDIT.UPDATE_OK'));
	  submitAccount(session.account);
	})
	.catch(function (err) {
	  messenger.danger($translate.instant('BUDGET.EDIT.UPDATE_FAIL'));
	  console.log(err);
	});
    }

    function selectYear(id) {
      session.fiscal_year = $scope.fiscal.data.filter(function (obj) {
	return obj.id === id;
	})[0];
    }

    function accountWhere() {
      // only unlocked income/expense accounts
      return [ 'account.account_type_id IN (1,4)', 'AND', 'account.locked=0' ];
    }

    function restartSearch() {
      session.state = 'search';
    }

    function toggleFreeze(budget) {
      budget.freeze = !budget.freeze;
    }

    function startEditing(budget) {
      budget.editing = true;
    }

    function endEditing(budget) {
      budget.editing = false;
    }

    function recompute() {
      if (session.autoAdjust) {
	var totalFrozen = 0.0,  // Total budget that is frozen/editing on the form
        totalFree = 0.0,    // Total budget that is NOT frozen/editing on the form
        numFree = 0;        // Number of budgets that are not frozen/editing on the form

	// First figure out how much is free
	$scope.budgets.data.forEach(function (bud) {
	  if (bud.freeze || bud.editing) {
	    totalFrozen += bud.budget;
	  }
	  else {
	    totalFree += bud.budget;
	    numFree += 1;
	  }
	});

	totalFree = session.totalBudget - totalFrozen;

	// Redistribute
	if (numFree > 0) {
	  $scope.budgets.data.forEach(function (bud) {
	    if (!bud.freeze && !bud.editing) {
	      bud.budget = totalFree / numFree;
	    }
	  });
	  session.validTotal = true;
	}
      }

      // Double-check the totals
      var total = 0.0;
      $scope.budgets.data.forEach(function (bud) {
	total += bud.budget;
      });
      if (isNaN(session.totalBudget) || session.totalBudget === null ||
	  isNaN(total) || total === null) {
	// Make sure we have real numbers
	session.validTotal = false;
	}
      else {
	session.validTotal = precision.round(total, 6) === precision.round(session.totalBudget, 6);
	}
    }


    function loadFiscalYears(models) {
      angular.extend($scope, models);
      // Default to the last fiscal year
      session.fiscal_year = $scope.fiscal.data[$scope.fiscal.data.length - 1];
    }

    // Register this controller
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies, ['fiscal'])
        .then(loadFiscalYears);
    });

    // Set up the visible functions
    $scope.submitAccount = submitAccount;
    $scope.resetAccountSearch = resetAccountSearch;

    $scope.selectYear = selectYear;
    $scope.createBudget = createBudget;
    $scope.accountWhere = accountWhere;
    $scope.restartSearch = restartSearch;
    $scope.updateBudget = updateBudget;
    $scope.toggleFreeze = toggleFreeze;
    $scope.startEditing = startEditing;
    $scope.endEditing = endEditing;
    $scope.recompute = recompute;
  }

]);
