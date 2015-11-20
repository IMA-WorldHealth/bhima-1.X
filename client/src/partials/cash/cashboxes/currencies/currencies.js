angular.module('bhima.controllers')
.controller('cash.cashbox_account', [
  '$scope',
  '$translate',
  'validate',
  'connect',
  'messenger',
  'appstate',
  'uuid',
  function ($scope, $translate, validate, connect, messenger, appstate, uuid) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.cashbox = {
      query : {
        identifier : 'id',
        tables : {
          'cash_box' : { columns : ['id::cashboxId', 'text'] },
          'cash_box_account_currency' : { columns : ['id', 'currency_id', 'cash_box_id', 'account_id', 'gain_exchange_account_id', 'loss_exchange_account_id', 'virement_account_id'] },
          'currency' : { columns : ['symbol']}
        },
        join : [
        'cash_box_account_currency.cash_box_id=cash_box.id',
        'cash_box_account_currency.currency_id=currency.id'
        ]
      }
    };

    dependencies.allAccount = {
      query : {
        identifier : 'id',
        tables : {
          'account' : { columns : ['id', 'account_txt', 'account_number'] }
        }
      }
    };    

    dependencies.account1 = {
      query : {
        identifier : 'id',
        tables : {
          'account' : { columns : ['id', 'account_txt', 'account_number'] }
        },
        where : ['account.classe=5']
      }
    };

    dependencies.account2 = {
      query : {
        identifier : 'id',
        tables : {
          'account' : { columns : ['id', 'account_txt', 'account_number'] }
        },
        where : ['account.classe=7']
      }
    };

    dependencies.account3 = {
      query : {
        identifier : 'id',
        tables : {
          'account' : { columns : ['id', 'account_txt', 'account_number'] }
        },
        where : ['account.classe=6']
      }
    };

    dependencies.currency = {
      query : {
        identifier : 'id',
        tables : {
          'currency' : { columns : ['id', 'symbol'] }
        }
      }
    };

    dependencies.cash_box = {
      query : {
        identifier : 'id',
        tables : {
          'cash_box' : { columns : ['id', 'text'] }
        }
      }
    };

    dependencies.project = {
      query : {
        identifier : 'id',
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr']
          }
        }
      }
    };

    function startup (models) {
      angular.extend($scope, models);
      session.project = $scope.project;
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup)
      .then(getAccountNumber);
    });

    function getAccountNumber () {
      $scope.cashbox.data.forEach(function (item) {
        item.account = $scope.allAccount.get(item.account_id);
        item.gain = $scope.allAccount.get(item.gain_exchange_account_id);
        item.loss = $scope.allAccount.get(item.loss_exchange_account_id);
        item.virement = $scope.allAccount.get(item.virement_account_id);
      });
    }

    $scope.delete = function (cashbox) {
      connect.delete('cash_box_account_currency', ['id'], [cashbox.id])
      .then(function () {
        $scope.cashbox.remove(cashbox.id);
        messenger.info($translate.instant('UTIL.DELETE_SUCCESS'));
      });
    };

    $scope.edit = function (cashbox) {
      session.action = 'edit';
      session.edit = angular.copy(cashbox);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    function cleaner (record) {
      delete record.currencyId;
      delete record.cashboxId;
      delete record.accountId;
      delete record.abbr;
      delete record.text;
      delete record.project_id;
      delete record.account;
      delete record.symbol;
      delete record.gain;
      delete record.loss;
      delete record.virement;
      console.info(record);
      return record;
    }

    $scope.save.edit = function () {
      var record = session.edit;
      record.cash_box_id = record.cashboxId;

      record = cleaner(record);

      connect.put('cash_box_account_currency', [record], ['id'])
      .then(function () {
        messenger.info($translate.instant('UTIL.EDIT_SUCCESS'));
        session.action = '';
        session.edit = {};
        validate.refresh(dependencies, ['cashbox'])
        .then(startup)
        .then(getAccountNumber);
      });
    };

    $scope.save.new = function () {
      var record = session.new;
      record = cleaner(record);

      connect.post('cash_box_account_currency', [record])
      .then(function () {
        messenger.info($translate.instant('UTIL.NEW_SUCCESS'));
        session.action = '';
        session.new = {};
        validate.refresh(dependencies, ['cashbox'])
        .then(startup)
        .then(getAccountNumber);
      });
    };

    $scope.formatAccount = function (account) {
      return '['+account.account_number + '] ' + account.account_txt;
    };

    function generateReference () {
      window.data = $scope.cashbox.data;
      var max = Math.max.apply(Math.max, $scope.cashbox.data.map(function (o) { return o.id; }));
      return Number.isNaN(max) ? 1 : max + 1;
    }

  }
]);
