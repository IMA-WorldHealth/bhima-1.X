angular.module('bhima.controllers')
.controller('operating_account', [
  '$scope',
  '$http',
  '$translate',
  'validate',
  'appstate',
  function ($scope, $http, $translate, validate, appstate) {
    var dependencies = {},
        session = $scope.session = {},
        state = $scope.state;

    dependencies.fiscalYears = {
      query : {
        identifier : 'id',
        tables : {
          'fiscal_year' : {
            columns : ['id', 'fiscal_year_txt']
          }
        }
      }
    };

    dependencies.periods = {
      query : {
        identifier : 'id',
        tables : {
          'period' : {
            columns : ['id', 'fiscal_year_id', 'period_start', 'period_stop']
          }
        }
      }
    };

    function getPeriods () {
      var selectablePeriods = $scope.periods.data.filter(function (p) {return p.fiscal_year_id == session.fiscal_year_id;});
      $scope.selectablePeriods = selectablePeriods;
    }

    function initialize (models) {
      angular.extend($scope, models);
    }

    function generate () {
      if(session.period_id === 'all'){
        $scope.all_period = $translate.instant('OPERATING_ACCOUNT.ALL');
      }

      $http.get(
        '/getExploitationAccount/',
        {params : {'period_id' : session.period_id, 'fiscal_year_id' : session.fiscal_year_id}
      }).success(function (data) {
        $scope.debitTotal = 0;
        $scope.creditTotal = 0;
        $scope.Result = 0;

        for(var item in data){
          $scope.debitTotal += data[item].debit;
          $scope.creditTotal += data[item].credit;
          $scope.Result = $scope.creditTotal - $scope.debitTotal;
        }
        $scope.records = data;
        $scope.state = 'generate';
      });
    }

    function reconfigure () {
      $scope.state = null;
      session.fiscal_year_id = null;
      session.period_id = null;
    }

    function printReport () {
      print();
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(initialize);
    });

    $scope.all = 'all';
    $scope.getPeriods = getPeriods;
    $scope.generate = generate;
    $scope.reconfigure = reconfigure;
    $scope.printReport = printReport;
  }
]);

