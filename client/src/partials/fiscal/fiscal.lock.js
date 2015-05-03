angular.module('bhima.controllers')
.controller('fiscal.lock', [
  '$q',
  '$scope',
  '$http',
  '$translate',
  'validate',
  'connect',
  'messenger',
  '$route',
  function ($q, $scope, $http, $translate, validate, connect, messenger, $route) {
    var imports,
        editCache,
        session = $scope.session = {},
        dependencies = {};

    // pull in data from the parent controller to use
    // in child requests.
    imports = $scope.$parent;

    // dependencies
    dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'number_of_months', 'fiscal_year_txt', 'transaction_start_number', 'transaction_stop_number', 'start_month', 'start_year', 'previous_fiscal_year', 'locked']
          }
        }
      }
    };

    dependencies.resultatAccount = {
      query : {
        tables : {
          account : { columns : ['id', 'account_number', 'account_txt'] }
        },
        where : ['account.classe=1']
      }
    };

    dependencies.user = {
      query : '/user_session'
    };

    // Fire off the onload function for this controller
    onLoad();

    // Reload the controller on selection change
    $scope.$on('fiscal-year-selection-lock-change', onLoad);

    // Exposition to the view
    $scope.closeFiscalYear = closeFiscalYear;
    $scope.formatAccount = formatAccount;

    function observation () {
      if ((session.solde7 - session.solde6) > 0) {
        session.observation = 1;
      } else if ((session.solde7 - session.solde6) < 0)  {
        session.observation = -1;
      } else {
        session.observation = 0;
      }
    }

    function sumCredMinusDeb (a, b) {
      return (b.credit_equiv - b.debit_equiv) + a;
    }

    function sumDebMinusCred (a, b) {
      return (b.debit_equiv - b.credit_equiv) + a;
    }

    function getSolde (classe, fy) {
      return $http.get('/getClassSolde/'+classe+'/'+fy)
      .success(function (data) {
        return data;
      });
    }

    function loadSolde (fy_id) {
      getSolde(6, fy_id)
      .then(function (data6) {
        session.array6 = data6.data;
        return getSolde(7, fy_id);
      })
      .then(function (data7) {
        session.array7 = data7.data;
      })
      .then(function () {
        session.solde6 = session.array6.reduce(sumDebMinusCred, 0);
        session.solde7 = session.array7.reduce(sumCredMinusDeb, 0);
        observation();
      });
    }

    function closeFiscalYear (fy_id) {
      var res = confirm($translate.instant('FISCAL_YEAR.CONFIRM_CLOSING'));
      if (res) {
        var updateFY = {
          id : fy_id,
          locked : 1
        };

        postingLockedFiscalYear(fy_id)
        .then(function () {
          connect.put('fiscal_year', [updateFY], ['id']);
        })
        .then(function () {
          messenger.success($translate.instant('FISCAL_YEAR.LOCKED_SUCCESS'), true);
        })
        .then(refresh)
        .catch(function (err) {
          console.error(err);
        });
      }
    }

    function postingLockedFiscalYear (fy_id) {
      var data = {
        new_fy_id : fy_id,
        user_id   : session.user_id,
        resultat  : {
          resultat_account : session.resultat_account,
          class6           : session.array6,
          class7           : session.array7,
          forcingDate      : session.fiscalYearLastDate
        }
      };

      return $http.post('/posting_fiscal_resultat/', { params: 
        {
          new_fy_id : data.new_fy_id,
          user_id   : data.user_id,
          resultat  : data.resultat,
          date      : data.forcingDate
        }
      });
    }

    function getFiscalYearLastDate (fy_id) {
      dependencies.period = {
        query : {
          tables : {
            period : { columns : ['period_start', 'period_stop'] }
          },
          where : ['period.fiscal_year_id='+fy_id]
        }
      };

      validate.refresh(dependencies, ['period'])
      .then(function (model) {
        session.fiscalYearLastDate = model.period.data[model.period.data.length-1].period_stop;
      });
    }

    function onLoad () {
      session.selectedToLock = imports.selectedToLock;
      dependencies.fiscal.query.where = ['fiscal_year.id=' + session.selectedToLock];
      validate.refresh(dependencies, ['fiscal', 'resultatAccount', 'user'])
      .then(function (models) {
        $scope.resultatAccount = models.resultatAccount;
        $scope.fiscal = models.fiscal.data[0];
        // get user id
        session.user_id = models.user.data.id;
        // cache the fiscal year data for expected edits
        editCache = angular.copy($scope.fiscal);
      })
      .then(loadSolde(session.selectedToLock))
      .then(getFiscalYearLastDate(session.selectedToLock));
    }

    function formatAccount (ac) {
      return '['+ac.account_number+'] => '+ac.account_txt;
    }

    function refresh () {
      // TODO implement a fiscal year list refresh mechanism
      $route.reload();
    }

  }
]);
