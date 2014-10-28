angular.module('bhima.controllers')
.controller('operating_account', [
  '$scope',
  '$translate',
  '$http',
  '$routeParams',
  'connect',  
  'validate',
  'appstate',
  'util',
  function ($scope, $translate, $http, $routeParams, connect, validate, appstate, util) {
    var dependencies = {},
        session = $scope.session = {};

   dependencies.getFiscalYears = {
      query : {
        identifier : 'id',
        tables : {
          'fiscal_year' : { 
            columns : ['id', 'fiscal_year_txt']
          }
        }
      }
    };

    $scope.Reports = '';

    function reset () {
      var record = connect.clean(session);
      var fiscalYear = $scope.getFiscalYears.data.filter(function (item) {
        return item.id == record.fiscal_year_id;
      });

      $scope.fiscal_year_report = fiscalYear[0].fiscal_year_txt;

      $http.get('/getPeriodeFiscalYear/',{params : {
            'fiscal_year_id' : record.fiscal_year_id
          }  
      }).
      success(function(data) {
        $scope.Periods = data;
      });
    }

    function reset2 () {
      var record = connect.clean(session);
      console.log('La liste des annees fiscal',record.period_id);
      var tabMonth = ['OPERATING_ACCOUNT.JANUARY',
        'OPERATING_ACCOUNT.FEBRUARY',
        'OPERATING_ACCOUNT.MARCH',
        'OPERATING_ACCOUNT.APRIL',
        'OPERATING_ACCOUNT.MAY',
        'OPERATING_ACCOUNT.JUNE',
        'OPERATING_ACCOUNT.JULY',
        'OPERATING_ACCOUNT.AUGUST',
        'OPERATING_ACCOUNT.SEPTEMBER',
        'OPERATING_ACCOUNT.OCTOBER',
        'OPERATING_ACCOUNT.NOVEMBER',
        'OPERATING_ACCOUNT.DECEMBER'
      ];

      if(record.period_id == 'all'){
        $scope.fiscal_precisonD = '';
        $scope.fiscal_precison1 = $translate.instant('OPERATING_ACCOUNT.ALL'); 
      } else {
        $scope.fiscal_precison1 = '';
        var precision = $scope.Periods.filter(function (item) {
          return item.id == record.period_id;
        });
        //console.log(precision[0].period_start);
        var Month = util.sqlDate(precision[0].period_start);
        Months = Month.split("-");;
        MontRap = Months[1] - 1; 
        $scope.fiscal_precisonD = $translate.instant(tabMonth[MontRap]); 
      }
      
      $scope.Reports = "";
      $http.get('/getExploitationAccount/',{params : {
            'period_id' : record.period_id,
            'fiscal_year_id' : record.fiscal_year_id
          }  
      }).
      success(function(data) {
        $scope.ExploitAccounts = data;
        $scope.debitTotal = 0;
        $scope.creditTotal = 0;
        $scope.Result = 0;

        for(var item2 in data){
          var data2 = data[item2];
          $scope.debitTotal += data2.debit;
          $scope.creditTotal += data2.credit;
          $scope.Result = $scope.creditTotal - $scope.debitTotal; 
        }

      });
  
    }

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.all = 'all';
    $scope.reset = reset;
    $scope.reset2 = reset2;
    function generateReference () {
      window.data = $scope.getFiscalYears.data;
      var max = Math.max.apply(Math.max, $scope.getFiscalYears.data.map(function (o) { return o.reference; }));
      return Number.isNaN(max) ? 1 : max + 1;
    } 
  } 
]);

