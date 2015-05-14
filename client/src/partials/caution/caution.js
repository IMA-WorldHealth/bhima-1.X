angular.module('bhima.controllers')
.controller('caution', [
  '$scope',
  '$location',
  '$translate',
  'validate',
  'connect',
  'appstate',
  'messenger',
  'util',
  'uuid',
  'appcache',
  function($scope, $location, $translate, validate, connect, appstate, messenger, util, uuid, Appcache) {
    var defaultCurrency, defaultCashBox, record, record_item;

    var dependencies = {},
        session = $scope.session = {},
        cache = new Appcache('caution');

    dependencies.cashboxes = {
      query : {
        tables : {
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        }
      }
    };

    // TODO currently fetches all accounts, should be selected by project
    dependencies.cashbox_accounts = {
      query : {
        identifier : 'currency_id',
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'cash_box_id', 'currency_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          },
          'account' : {
            columns : ['account_txt']
          }
        },
        join : [
          'cash_box_account_currency.currency_id=currency.id',
          'account.id=cash_box_account_currency.account_id'
        ]
      }
    };

    dependencies.exchange_rate = {
      required : true,
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
          }
        },
        where : ['exchange_rate.date=' + util.sqlDate(new Date())]
      }
    };

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id','account_number', 'account_txt']
          }
        }
      }
    };

    $scope.noEmpty = false;

    cache.fetch('cashbox').then(loadDefaultCashBox);
    cache.fetch('currency').then(loadDefaultCurrency);

    function startup(models) {
      angular.extend($scope, models);
      if (!$scope.cashbox) {
        var sessionDefault =
          $scope.cashboxes.data[0];

        if (defaultCashBox) {
          var verifyBox = $scope.cashboxes.get(defaultCashBox.id);
          if (verifyBox) { sessionDefault = verifyBox; }
        }

        $scope.setCashBox(sessionDefault);
      }
    }

    $scope.loadDebtor = function loadDebtor(debtor) {
      if (!debtor) { return messenger.danger('No debtor selected'); }
      $scope.debtor = debtor;

      connect.fetch('/location/detail/' + debtor.origin_location_id)
      .then(function (data) {
        $scope.location = data[0];
        $scope.noEmpty = true;
      });

      connect.fetch('/reports/patientStanding/?id=' + debtor.debitor_uuid)
      .then(function (data) {
        var receipts = data.receipts || [];

        var balance = 0,
            sumDue = 0,
            sumBilled = 0;

        receipts.forEach(function (receipt) {
          if (receipt.debit - receipt.credit !== 0){
            receipt.billed = receipt.debit;
            receipt.due = receipt.debit - receipt.credit;
            balance += receipt.debit - receipt.credit;
            sumBilled += receipt.billed;
            sumDue += receipt.due;
          }          
        });

        $scope.account_balance = balance;

      });

    };

    function payCaution() {
      record = {
        project_id      : $scope.project.id,
        reference       : 1, // FIXME: Workaround for dead triggers
        uuid            : uuid(),
        type            : 'E',
        date            : util.sqlDate(new Date()),
        debit_account   : $scope.currency.account_id,
        credit_account  : $scope.debtor.account_id,
        deb_cred_uuid   : $scope.debtor.debitor_uuid,
        deb_cred_type   : 'D',
        currency_id     : $scope.currency.currency_id,
        cost            : session.payment,
        cashbox_id      : $scope.cashbox.id,
        description     : [$scope.project.abbr + '_CAISSEAUX_CAUTION', $scope.debtor.first_name + ' - '+ $scope.debtor.name + ' - ' + $scope.debtor.last_name, util.sqlDate(new Date())].join('/'),
        is_caution      : 1
      };

      record_item = {
        uuid    : uuid(),
        cash_uuid      : record.uuid,
        allocated_cost : record.cost
      };

      connect.fetch('/user_session')
      .then(function (user) {
        record.user_id = user.id;
        return connect.post('cash', record);
      })
      .then(function () {
        return connect.post('cash_item', record_item);
      })
      .then(function () {
        return connect.fetch('/journal/caution/' + record.uuid);
      })
      .then(function () {
        $location.path('/invoice/caution/' + record.uuid);
      })
      .catch(handleError);
    }

    function handleError() {
      connect.delete('posting_journal', 'inv_po_id', [record.uuid])
      .then(function (){
        return connect.delete('cash_item', 'cash_uuid', [record.uuid]);
      })
      .then(function (){
        return connect.delete('cash', 'uuid', [record.uuid]);
      })
      .then(function(){
        messenger.danger($translate.instant('CAUTION.DANGER'));
      });
    }

    function load(selectedItem) {
      if (!selectedItem) { return; }
      $scope.selectedItem = selectedItem;
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where = ['account.enterprise_id='+project.enterprise_id];
      dependencies.cashboxes.query.where = ['cash_box.is_auxillary=1', 'AND', 'cash_box.project_id='+project.id];
      validate.process(dependencies)
      .then(startup);
    });

    function check () {
      return session.payment && $scope.currency ? session.payment < $scope.currency.min_monentary_unit : true;
    }

    $scope.setCurrency = function setCurrency (currency) {
      $scope.currency = currency;
      cache.put('currency', currency);
    };

    $scope.setCashBox = function setCashBox (box) {
      $scope.cashbox = box;
      cache.put('cashbox', box);

      dependencies.cashbox_accounts.query.where =
        ['cash_box_account_currency.cash_box_id=' + $scope.cashbox.id];
      validate.refresh(dependencies, ['cashbox_accounts'])
      .then(refreshCurrency);
    };

    function loadDefaultCurrency(currency) {
      if (!currency) { return; }
      defaultCurrency = currency;

      // Fallback for slow IDB read
      if ($scope.currency) { $scope.currency = currency; }
    }

    function loadDefaultCashBox(cashBox) {
      if (!cashBox) { return; }
      defaultCashBox = cashBox;

      // Fallback for slow IDB read
      if ($scope.cashbox) { $scope.cashbox = cashBox; }
    }

    function refreshCurrency(model) {
      var sessionDefault;

      angular.extend($scope, model);

      sessionDefault =
        $scope.cashbox_accounts.get($scope.project.currency_id) ||
        $scope.cashbox_accounts.data[0];

      if (defaultCurrency) {
        var verifyCurrency = $scope.cashbox_accounts.get(defaultCurrency.currency_id);
        if (verifyCurrency)  { sessionDefault = verifyCurrency; }
      }

      // Everything sucks
      if (!sessionDefault) { return messenger.danger('Cannot find accounts for cash box ' + $scope.cashbox.id); }

      $scope.setCurrency(sessionDefault);
    }

    $scope.payCaution = payCaution;
    $scope.check = check;
  }
]);
