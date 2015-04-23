angular.module('bhima.controllers')
.controller('fiscal.create', [
  '$scope',
  '$http',
  '$translate',
  'validate',
  'appstate',
  'connect',
  'messenger',
  function ($scope, $http, $translate, validate, appstate, connect, messenger) {
    var data,
        imports = $scope.$parent,
        session = $scope.session = {},
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
        key : 'FISCAL_YEAR.CLOSE_NOTICE'
      },
      {
        id : '2b',
        key : 'FISCAL_YEAR.CREATE_OPENING_BALANCES'
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

    dependencies.user = {
      query : '/user_session'
    };

    // returns true if the years array contains a
    // year with previous_fiscal_year matching the
    // year's id.
    function hasChild(year, years) {
      return years.some(function (otherYear) {
        return otherYear.previous_fiscal_year === year.id;
      });
    }

    // Make sure that only years without children show
    // up in the view for selection as previous_fiscal_year
    function filterParentYears() {
      // copy the fiscal year store from the parent
      var years = angular.copy(imports.fiscal.data);

      // filter out years that have children
      var childless = years.filter(function (year) {
        return !hasChild(year, years);
      });

      // expose the years to the view
      $scope.years = childless;
    }

    // fires on controller load
    function onLoad() {

      // filter years that are parents out of the selection
      // in the view
      filterParentYears();

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

        // get user id
        session.user_id = models.user.data.id;

        // initialise account balances
        resetBalances();
      });
    }

    // set the account balance to 0 for all accounts
    function resetBalances() {
      $scope.accounts.data.forEach(function (row) {

        // make account_number a string to sort properly
        row.account_number = String(row.account_number);
        row.debit = 0;
        row.credit = 0;
      });
    }

    // sorts accounts based on account_number (string)
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

    // normalizes a date to a UTC date for the server
    // TODO Put this functionality in a service
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
            return account.type !== 'title' && (account.debit > 0 || account.credit > 0);
          })
          .map(function (account) {
            return { 'account_id' : account.id, 'debit' : account.debit, 'credit' : account.credit };
          });
      }

      // attach the enterprise id to the request
      bundle.enterprise_id = $scope.enterprise.id;

      // attach the user id to the request
      bundle.user_id = session.user_id;

      // attach the currency id to the request
      bundle.currency_id = $scope.enterprise.currency_id;

      if (hasPreviousYear) {
        // Not first Fiscal year
        // submit data the server
        postCreateFiscalYear();

      } else if (!hasPreviousYear) {
        // First Fiscal year
        if (checkEquilibrium(bundle.balances)) {
          // submit data the server
          postCreateFiscalYear();
          
        } else {
          messenger.info($translate.instant('FISCAL_YEAR.ALERT_BALANCE'), true);
        }
      }

      function postCreateFiscalYear () {
        $http.post('/fiscal/create', bundle)
        .success(function (results) {
          stepThree();
          $scope.$emit('fiscal-year-creation', results.id);
        })
        .error(function (err) {
          throw err;
        });
      }
    }

    function sumObjectProperty (objArray, property) {
      return objArray.reduce(function (a, b) {
        return a + b[property];
      }, 0);
    }

    function checkEquilibrium (objArray) {
      return (sumObjectProperty(objArray, 'debit') === sumObjectProperty(objArray, 'credit')) ? true : false;
    }

    // force refresh of the page
    function forceRefresh() {

      // refresh the form
      data = $scope.data = { year : 'true' };

      // refresh the imports, in case the parent has
      // loaded new data
      imports = $scope.$parent;

      // refresh parent filter
      filterParentYears();

      stepOne();
    }

    // listen for refresh chime
    $scope.$on('fiscal-year-create-refresh', forceRefresh);

    // collect the enterprise id and load the controller
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where[2] = 'account.enterprise_id=' + enterprise.id;
      onLoad();
    });
  }
]);
