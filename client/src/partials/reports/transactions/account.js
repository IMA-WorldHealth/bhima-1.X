angular.module('bhima.controllers')
.controller('report.transactions.account', [
  '$scope',
  'validate',
  'connect',
  'appstate',
  'exchange',
  'SessionService',
  function ($scope, validate, connect, appstate, exchange, SessionService) {
    var session = $scope.session = {},
      dependencies = {},
      state = $scope.state;

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
      session.currency = SessionService.enterprise.currency_id;
      models.accounts.data.forEach(function (acc) {
        acc.account_number = String(acc.account_number);
      });
      session.limit = 10;
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      session.currency = $scope.enterprise.currency_id;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.search = function search() {
      $scope.state = 'generate';
      if (!session.account || !session.limit) { return; }
      var query = '?account=' + session.account.id;
      query += '&limit=' + session.limit;
      connect.fetch('/reports/transactions/' + query)
      .then(function (data) {
        $scope.transactions = data;
        convert();
      });
    };

    function initialize (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(initialize);
    });

    $scope.print = function print() {
      window.print();
    };

   function reconfigure () {
      $scope.state = null;
      $scope.session.account = null;
      $scope.session.limit = null;
    }

    function convert () {
      if($scope.transactions) {
        session.sum_debit = 0;
        session.sum_credit = 0;      
        $scope.transactions.forEach(function (transaction) {
          session.sum_debit += exchange.convertir(transaction.debit, transaction.currency_id, session.currency,new Date());
          session.sum_credit += exchange.convertir(transaction.credit, transaction.currency_id, session.currency,new Date());
        });        
      }
    }

    $scope.convert = convert;
    $scope.reconfigure = reconfigure;
  }
]);