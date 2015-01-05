angular.module('bhima.controllers')
.controller('fiscal.create', [
  '$scope',
  'validate',
  'appstate',
  function ($scope, validate, appstate) {
    var data, dependencies = {};

    // Set up default option for 
    data = $scope.data = { year : true };

    // expose methods to the $scope
    $scope.submitNewYear = submitNewYear;
    $scope.resetBalances = resetBalances;
    $scope.isFullYear = isFullYear;
    $scope.calculateEndDate = calculateEndDate;

    // dependencies
    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_txt', 'account_number']
          },
          'account_type' : {
            columns : ['type']
          }
        },
        join : ['account.account_type_id=account_type.id'],
      }
    };

    // fires on controller load
    function onLoad() {
      console.log('[Validate]', dependencies);
      validate.process(dependencies)
      .then(function (models) {
        
        // loads the accounts and exposes to the view
        angular.extend($scope, models);

        // initialise account balancesk
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

    // TODO - impliment this
    function submitNewYear() {
      var d = {
        enterpriseId : $scope.enterprise.id
      };
      
      // submit to the server for processing

      // connect.fetch('/fiscal/' + $scope.enterpriseId  + '/' + Number(model.start) + '/' + Number(model.end) + '/' + model.description);
    }

    // returns true if the fiscal year is for 12 months
    function isFullYear() {
      return data.year === 'true';
    }

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
    
    // collect the enterprise id and load the controller
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where = ['account.enterprise_id=' + enterprise.id];
      onLoad();
    });
  }
]);
