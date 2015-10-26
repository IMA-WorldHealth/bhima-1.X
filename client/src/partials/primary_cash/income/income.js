angular.module('bhima.controllers')
.controller('income', [
  '$scope',
  'connect',
  'messenger',
  'validate',
  'appstate',
  'util',
  'SessionService',
  function ($scope, connect, messenger, validate, appstate, util, Session) {

    //inits and declarations
    var dependencies = {},
        data = {},
        sources = ['caisse auxiliaire', 'caisse pax'],
        map = {0 : transferCashAuxi, 1 : transferCashPax},
        cashAccountIds;

    dependencies.exchange_rate = {
      required : true,
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
          }
        },
        where : ['exchange_rate.date='+util.sqlDate(new Date())]
      }
    };

    dependencies.pcash_accounts = {
      query : {
        tables : {
          'currency_account': {
            columns : ['pcash_account']
          }
        }
      }
    };

    dependencies.summers = {
      query : '/synthetic/pcRI/'
    };

    dependencies.currency_account = {
      required : true,
      query : {
        tables : {
          'currency_account' : {
            columns : ['id', 'enterprise_id', 'currency_id', 'cash_account']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          }
        },
        join : ['currency_account.currency_id=currency.id']
      }
    };

    dependencies.accounts = {
      required : true,
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        },
      }
    };

    //fonctions
    function init (model) {
      //$scope.model = model;
      dependencies.summers.query = dependencies.summers.query+$scope.enterprise.id+'?'+JSON.stringify({accounts : formatTab(model)});
      $scope.selectedItem = model.currency_account.data[0];
      cashAccountIds = model.currency_account.data.filter(function (item) {
        return (item.cash_account);
      });

      cashAccountIds = cashAccountIds.map(function(item) {
        return item.cash_account;
      });

      $scope.enterprise_symbole_currency = model.currency_account.data.filter(function (item) {
        return (item.enterprise_id === $scope.enterprise.id && item.currency_id === $scope.enterprise.currency_id);

      })[0].symbol;
      validate.process(dependencies, ['summers'])
      .then(setUpModel)
      .catch(handlError);
    }

    function formatTab (m) {
      return m.pcash_accounts.data.map(function (item) {
        return item.pcash_account;
      });
    }

    function setUpModel (model) {
      $scope.model = model;
    }

    function handlError (err) {
      messenger.danger(err.toString());
      return;
    }

    function setAction (action) {
      $scope.action = action;
    }

    function resolve () {
      map[$scope.data.source_id]();
    }

    function transferCashAuxi () {
      getExpectedAmount()
      .then(handlResult);
    }

    function transferCashPax () {
      //console.log('cashPax');
    }

    function getExpectedAmount() {
      return connect.fetch(
        [
          'synthetic',
          'aB',
          $scope.enterprise.id
        ].join('/')+'?'+JSON.stringify({accounts : cashAccountIds}));
    }

    function handlResult (res) {
      res.data.map(function (item) {
        item.text = getAccountText(item.account_id)[0].account_txt;
      });
      var print = res.data.map(function (item) {
        return item.text+ ' : '+$scope.enterprise_symbole_currency+item.balance;
      });

      $scope.data.expected = print.join(' ; ');
    }

    function getAccountText (account_id) {
      return $scope.model.accounts.data.filter(function (item) {
        return item.id === account_id;
      });
    }

    function setCashAccount(cashAccount) {
      if (cashAccount) { $scope.selectedItem = cashAccount; }
    }

    function ajouter() {
      //console.log('on ajoute');
      writeTransfer()
      .then(postToJournal);
      //.then(postToJournal).then(success, error);
    }

    function writeTransfer() {
      var pcash = {
        enterprise_id : $scope.enterprise.id,
        type          : 'E',
        date          : util.sqlDate(new Date()),
        currency_id   : $scope.selectedItem.currency_id,
        value         : $scope.data.value,
        cashier_id    : Session.user.id,
        description   : 'HBB' + '_CAISSEPRINCIPALE_RECETTEGENEREIQUE' + new Date().toString(),
        istransfer    : 1,
        reference     : 1,
      };
      return connect.basicPut('pcash', connect.clean(pcash));
    }

    function postToJournal (res) {
      return connect.fetch('/journal/pcash/' + res.data.insertId);
    }

    //invocations
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.currency_account.query.where =
        ['currency_account.enterprise_id=' + $scope.enterprise.id];
      dependencies.pcash_accounts.query.where = [
        'currency_account.enterprise_id=' + $scope.enterprise.id,
        'AND',
        'currency_account.currency_id=' + $scope.enterprise.currency_id
      ];
      validate.process(dependencies, ['pcash_accounts', 'currency_account', 'exchange_rate', 'accounts'])
      .then(init)
      .catch(handlError);
    });

    //expositions
    $scope.setAction = setAction;
    $scope.sources = sources;
    $scope.data = data;
    $scope.resolve = resolve;
    $scope.setCashAccount = setCashAccount;
    $scope.ajouter = ajouter;
  }
]);
