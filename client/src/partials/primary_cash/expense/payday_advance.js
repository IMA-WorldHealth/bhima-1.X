angular.module('bhima.controllers')
.controller('primary_cash.payday_advance', [
  '$scope',
  '$routeParams',
  '$translate',
  '$http',
  'messenger',
  'validate',
  'appstate',
  'appcache',
  'connect',
  'util',
  'exchange',
  '$q',
  'uuid',
  function ($scope, $routeParams, $translate, $http, messenger, validate, appstate, Appcache, connect, util, exchange, $q, uuid) {
    var dependencies = {},
        session = $scope.session = {};

    session.primaryCashBox = $routeParams.cashbox;

    dependencies.cashier = {
      query : 'user_session'
    };

    dependencies.cashBox = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id::cash_box_account_currency_id', 'currency_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          },
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          },
          'account' : {
            columns : ['account_txt']
          }
        },
        join : [
          'cash_box_account_currency.currency_id=currency.id',
          'cash_box_account_currency.cash_box_id=cash_box.id',
          'account.id=cash_box_account_currency.account_id'
        ]
      }
    };

    dependencies.paymentPeriod = {
      query : {
        tables : {
          'paiement_period' : {
            columns : ['id', 'config_tax_id', 'config_rubric_id', 'label', 'dateFrom', 'dateTo']
          }
        }
      }
    };

    dependencies.employee = {
      query : {
        tables : {
          'employee' : { columns : ['id', 'code', 'prenom', 'name', 'postnom', 'creditor_uuid'] }
        }
      }
    };

    function init (models) {
      angular.extend($scope, models);
      session.hasDailyRate = exchange.hasDailyRate();
      if (!session.hasDailyRate) { messenger.info($translate.instant('UTIL.CHECK_DAILY_RATE'), true); }
    }

    appstate.register('project', function (project) {
      $scope.project = project;               
      validate.process(dependencies)
      .then(init);     
    });

    function formatEmployee (employee) {
      return employee.prenom + ', ' + employee.name + ' - ' + employee.postnom;
    }

    function getEmployee (employee) {
      session.employee = formatEmployee(employee);
      session.creditor_uuid = employee.creditor_uuid;
    }

    function submit () {
      if (session.creditor_uuid && session.cashBox.id && session.cashBox.account_id && session.montant && session.motif) {
        var document_uuid = uuid();

        var primary = {
          uuid          : uuid(),
          project_id    : $scope.project.id,
          type          : 'S',
          date          : util.sqlDate(new Date()),
          deb_cred_uuid : session.creditor_uuid,
          deb_cred_type : 'C',
          account_id    : session.cashBox.account_id,
          currency_id   : session.cashBox.currency_id,
          cost          : session.montant,
          user_id       : $scope.cashier.data.id,
          description   : session.motif,
          cash_box_id   : session.cashBox.id,
          origin_id     : 6 //FIX ME : Find a way to generate it automatically
        };

        var primary_details = {
          uuid              : uuid(),
          primary_cash_uuid : primary.uuid,
          debit             : 0,
          credit            : primary.cost,
          inv_po_id         : null, // uuid de l'avance
          document_uuid     : document_uuid
        };
        
        var package = {
          primary : primary,
          primary_details : primary_details
        };

        
        if (session.hasDailyRate) {

          connect.post('primary_cash', [package.primary], ['uuid'])
          .then(function () {
            return connect.post('primary_cash_item', [package.primary_details], ['uuid']);
          })
          .then(function () {
            return connect.fetch('/journal/salary_advance/' + package.primary.uuid);
          })
          .then(function () {
            messenger.success($translate.instant('PRIMARY_CASH.EXPENSE.SALARY_AV') + ' ' + session.employee + ' ' + $translate.instant('UTIL.SUCCESS'), true);
            session.employee = null;
            session.creditor_uuid = null;
            session.cashBox = null;
            session.montant = null;
            session.motif = null;
          })
          .catch(function (err) { console.log(err); });

        } else {
          messenger.info($translate.instant('UTIL.CHECK_DAILY_RATE'), true);
        }
      }

    }

    $scope.formatEmployee = formatEmployee;
    $scope.getEmployee = getEmployee;
    $scope.submit = submit;

  }
]);
