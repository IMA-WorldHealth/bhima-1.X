angular.module('bhima.controllers')
.controller('report.transactions.account', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  'exchange',
  function ($scope, validate, connect, appstate, exchange) {
    var session = $scope.session = {};
    var dependencies = {};

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        }
      }
    };

    dependencies.currencies = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    };

    session.timestamp = new Date();

    session.limits = [10, 25, 50, 75, 100, 500, 1000, 5000, 10000];

    function startup(models) {
      $scope.currencies = models.currencies;
      session.currency = session.enterprise.currency_id;
      models.accounts.data.forEach(function (acc) {
        acc.account_number = String(acc.account_number);
      });
      session.limit = 10;
      angular.extend($scope, models);
    }

    $scope.search = function search() {
      if (!session.account || !session.limit) { return; }
      var query = '?account=' + session.account.id;
      query += '&limit=' + session.limit;
      connect.fetch('/reports/transactions/' + query)
      .then(function (data) {
        $scope.transactions = data;
        convert();
      });
    };

    appstate.register('enterprise', function (enterprise) {
      session.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.print = function print() {
      window.print();
    };

    function convert () {
      if($scope.transactions) {
        session.sum_debit = 0;
        session.sum_credit = 0;      
        $scope.transactions.forEach(function (transaction) {
          session.sum_debit += exchange.convertir(transaction.debit, transaction.currency_id, session.currency, transaction.trans_date);
          session.sum_credit += exchange.convertir(transaction.credit, transaction.currency_id, session.currency, transaction.trans_date);
        });        
      }
    }

    $scope.convert = convert;
  }
]);
