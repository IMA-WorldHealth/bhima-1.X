angular.module('bhima.controllers')
.controller('fiscal.update', [
  '$scope',
  'validate',
  function ($scope, validate) {
    var imports, editCache, query,
        dependencies = {}; 

    // pull in data from the parent controller to use
    // in child requests
    imports = $scope.$parent;

    // expose bindings to the scope
    $scope.viewOpeningBalance = viewOpeningBalance;

    // dependencies
    dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'number_of_months', 'fiscal_year_txt', 'transaction_start_number', 'transaction_stop_number', 'start_month', 'start_year', 'previous_fiscal_year']
          }
        }
      }
    };

    dependencies.periods = {
      query : {
        tables : {
          period : {
            columns : ['id', 'period_start', 'period_stop']
          }
        },
        where : [
          'period.fiscal_year_id=',
          'AND', 'period.period_number<>0'
        ]
      }
    };

    // Fires on load of this controller
    function onLoad() {

      // copy the fiscal year id from the parent controller
      console.log('[x]', imports.selected);
      var id = imports.selected.id;

      // format queries with the imported fiscal year parameter
      dependencies.fiscal.query.where = ['fiscal_year.id=' + id];
      dependencies.periods.query.where[0] = 'period.fiscal_year_id=' + id;

      validate.process(dependencies)
      .then(function (models) {

        // expose the data to the template
        $scope.fiscal = models.fiscal.data[0];
        $scope.periods = models.periods;

        // cache the fiscal year data for expected edits
        editCache = angular.copy($scope.fiscal);
      });
    }

    // TODO - impliment this with a reasonable UI
    function viewOpeningBalance() {
      console.log('Not Implimented');
      /*
      var id = $scope.selected.id;
      connect.fetch({
        tables : {
          'period_total' : {
            columns : ['account_id', 'debit', 'credit', 'locked']
          },
          'period' : {
            columns : ['period_number']
          },
          'account' : {
            columns: ['account_txt', 'account_number']
          },
          'account_type' : {
            columns : ['type']
          }
        },
        join : [
          'period_total.account_id=account.id',
          'period_total.period_id=period.id',
          'account.account_type_id=account_type.id'
        ],
        where : [
          'period_total.fiscal_year_id=' + id,
          'AND', 'period.period_number=0',
          'AND', 'period_total.enterprise_id=' + $scope.enterpriseId
        ]
      })
      .then(function (res) {
        if (!res.length) {
          return messenger.danger('No opening balances found for fiscal year');
        }

        $modal.open({
          templateUrl: 'viewOpeningBalanceModal.html',
          keyboard : false,
          backdrop: 'static',
          controller : 'fiscal.period',
          resolve : {
            params : function () {
              return {
                accounts: res,
                fiscal : $scope.selected,
                enterprise : $scope.enterprise
              };
            }
          }
        });
      })
      .catch(function (err) {
        messenger.danger('An error occured : ' + JSON.stringify(err));
      })
      .finally();
      */
    }

    // TODO impliment editing functionality
    function submitEdits() {
      console.log('Not Implimented');
    }


    // Fire off the onload function for this controller
    onLoad();

  }
]);
