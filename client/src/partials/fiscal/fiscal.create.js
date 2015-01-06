angular.module('bhima.controllers')
.controller('fiscal.create', [
  '$scope',
  'validate',
  'appstate',
  'connect',
  '$http',
  function ($scope, validate, appstate, connect, $http) {
    var data,
        imports = $scope.$parent,
        dependencies = {};

    // Set up default option for year
    data = $scope.data = { year : 'true' };

    // module steps
    var steps = [
      {
        id : '1',
        key : 'FISCAL_YEAR.CREATE_YEAR_DETAILS'
      },
      {
        id : '2a',
        key : 'FISCAL_YEAR.IMPORT_OPENING_BALANCES'
      },
      {
        id : '2b',
        key : 'FISCAL_YEAR.CREATE_BEGINNING_BALANCES'
      },
      {
        id : '3',
        key : 'FISCAL_YEAR.CREATE_SUCCESS'
      }
    ];

    // expose methods and data to the $scope
    $scope.resetBalances = resetBalances;
    $scope.isFullYear = isFullYear;
    $scope.calculateEndDate = calculateEndDate;
    $scope.stepOne = stepOne;
    $scope.stepTwo = stepTwo;
    $scope.stepThree = stepThree;
    $scope.labelAccount = labelAccount;
    $scope.submitFiscalYearData = submitFiscalYearData;

    // dependencies
    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_txt', 'account_number', 'parent']
          },
          'account_type' : {
            columns : ['type']
          }
        },
        join : ['account.account_type_id=account_type.id'],
        where : [['account_type.type=balance', 'OR', 'account_type.type=title'],
                'AND']
      }
    };

    // fires on controller load
    function onLoad() {
      // expose the fiscal years from the parent to the view
      $scope.fiscal = imports.fiscal;

      // Trigger step one
      stepOne();

      validate.process(dependencies)
      .then(function (models) {

        // sort the accounts based on account number
        sortAccounts(models.accounts);

        // add account depth onto the account list
        parseAccountDepth(models.accounts);

        // loads the accounts and exposes to the view
        angular.extend($scope, models);

        // initialise account balances
        resetBalances();
      });
    }

    // set the account balance to 0 for all accounts
    function resetBalances() {
      $scope.accounts.data.forEach(function (row) {
        row.account_number = String(row.account_number); // required for sorting to work properly
        row.debit = 0;
        row.credit = 0;
      });
    }

    // sorts accounts based on account_number
    function sortAccounts(accountModel) {
      var data = accountModel.data;

      data.sort(function (a, b) {
        var left = String(a.account_number), right = String(b.account_number);
        return (left === right) ? 0 : (left > right ? 1 : -1);
      });

      accountModel.recalculateIndex();
    }

    // adds acount depth into the equation
    function parseAccountDepth(accountModel) {
      accountModel.data.forEach(function (account) {
        var parent, depth = 0;

        // TODO if parent.depth exists, increment and kill the loop (base case is ROOT_NODE)
        parent = accountModel.get(account.parent);
        while (parent) {
          depth += 1;
          parent = accountModel.get(parent.parent);
        }
        account.depth = depth;
      });
    }

    // STEP 1: transitions module to create fiscal year details
    function stepOne() {
      $scope.step = steps[0];
    }

    // STEP 2: transitions module state to either
    //  1) import opening balances from a previous fiscal year
    //  2) create new opening balances
    function stepTwo() {
      var hasPreviousYear = angular.isDefined(data.previous_fiscal_year);
      $scope.step = steps[hasPreviousYear ?  1 : 2];
    }

    // STEP 3: submits the year details
    function stepThree() {
      $scope.step = steps[3];
    }

    // returns true if the fiscal year is for 12 months
    function isFullYear() {
      return data.year === 'true';
    }

    // gets the end date of the fiscal year
    function calculateEndDate() {
      if (isFullYear()) {
        var start = data.start;
        if (start) {
          var ds = new Date(start);
          var iterate = new Date(ds.getFullYear() + 1, ds.getMonth() - 1);
          data.end = iterate;
        }
      }
    }

    // label the account select nicely
    // NOTE : This exposes a function to the view which is recalculated each
    // time.  Is there a better way?
    function labelAccount(account) {
      return account.account_number + ' ' + account.account_txt;
    }

    // normalizes a date to a UTC date for the server
    function normalizeUTCDate(date) {
      var year = date.getFullYear(),
          month = date.getMonth(),
          day = date.getDate();
      return Date.UTC(year, month, day);
    }

    // submits the fiscal year to the server all at once
    function submitFiscalYearData() {
      var bundle = connect.clean(data);
      var hasPreviousYear = angular.isDefined(bundle.previous_fiscal_year);

      // normalize the dates to UTC timezone
      bundle.start = normalizeUTCDate(bundle.start);
      bundle.end = normalizeUTCDate(bundle.end);

      // if no previous fiscal year is selected, we must ship back
      // the opening balances for each account to be inserted into
      // period 0 on the server.
      if (!hasPreviousYear) {
        bundle.balances = $scope.accounts.data
          .filter(function (account) {
            return account.type !== 'title';
          })
          .map(function (account) {
            return { 'account_id' : account.id, 'debit' : account.debit, 'credit' : account.credit };
          });
      }

      // attach the enterprise id to the request
      bundle.enterprise_id = $scope.enterprise.id;

      // submit data the server
      $http.post('/fiscal/create', bundle)
      .success(function (results) {
        console.log('[Success]', results);
        $scope.stepThree();
      })
      .error(function (err) {
        throw err;
      });
    }

    // collect the enterprise id and load the controller
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where[2] = 'account.enterprise_id=' + enterprise.id;
      onLoad();
    });
  }
]);
