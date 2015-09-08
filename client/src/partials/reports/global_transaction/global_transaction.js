angular.module('bhima.controllers')
.controller('report.global_transaction', [
  '$scope',
  'connect',
  'appstate',
  '$translate',
  'validate',
  'util',
  'exchange',
  function ($scope, connect, appstate, $translate, validate, util, exchange) {

    var session = $scope.session = {},
        state = $scope.state = {},
        dependencies = {}, 
        map = {};

    dependencies.accounts = {
      required : true,
      query : {
        tables : {'account' : {columns : ['id', 'account_number', 'account_txt', 'account_type_id']}}
      }
    };

    dependencies.exchange_rate = {
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'foreign_currency_id', 'rate', 'date']
          }
        }
      }
    };

    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    };

    $scope.account = {};
    $scope.model = {};
    $scope.model.sources = [$translate.instant('SELECT.ALL'), $translate.instant('SELECT.POSTING_JOURNAL'), $translate.instant('SELECT.GENERAL_LEDGER')];
    session.somDebit = 0;
    session.somCredit = 0;

    function formatAccount(account) {
      return [
        account.account_number, account.account_txt
      ].join(' -- ');
    }

    function init(model) {
      session.dateFrom = new Date();
      session.dateTo = new Date();
      angular.extend($scope, model);

      $scope.accounts.data.forEach(function (account) {
        account.account_number = String(account.account_number);
        
        // Define formatted account string at load time as this will never have to change again
        account.display = formatAccount(account);
      });
      $scope.model.c = $scope.enterprise.currency_id;
      $scope.model.account_id = 0;
      $scope.model.source_id = 0;

      $scope.exchange_rate.data.forEach(function (item) {
        map[util.sqlDate(new Date())] = {c_id : item.foreign_currency_id, rate : item.rate};
      });
    }

    function fill() {
      if (!$scope.enterprise || !$scope.exchange_rate) {return;}
      var f = ($scope.model.account_id && $scope.model.account_id > 0) ? selective($scope.model.account_id) : all();
    }

    function selective() {
      $scope.mode = 'selected';
      var url = '/reports/allTransactions/?source=' + $scope.model.source_id +
        '&enterprise_id=' + $scope.enterprise.id + 
        '&account_id=' + $scope.model.account_id + 
        '&datef=' + util.sqlDate(session.dateFrom) + 
        '&datet=' + util.sqlDate(session.dateTo);

      $scope.model.account_number = $scope.accounts.get($scope.model.account_id).account_number;
      connect.fetch(url)
      .then(function (res) {
        res.map(function (item) {
          if($scope.enterprise.currency_id !== item.currency_id){
            item.debit *= exchange.rate(item.debit,item.currency_id,new Date());
            item.credit *= exchange.rate(item.debit,item.currency_id,new Date()); 
          }           
        });
        $scope.records = res;
        getTotal(res);
      });
    }

    function all() {
      $scope.mode = 'all';
      var url = '/reports/allTransactions/?source=' + $scope.model.source_id +
        '&enterprise_id=' + $scope.enterprise.id + 
        '&account_id=0' + 
        '&datef=' + util.sqlDate(session.dateFrom) + 
        '&datet=' + util.sqlDate(session.dateTo);

      connect.fetch(url)
      .then(function (res) {
          res.map(function (item) {
            if($scope.enterprise.currency_id !== item.currency_id){
              item.debit *= exchange.rate(item.debit,item.currency_id,new Date());
              item.credit *= exchange.rate(item.debit,item.currency_id,new Date()); 
            }
          });
          $scope.records = res;
          getTotal(res);
        });
    }

    function getValue (obj, val, cVal) {
      if (cVal === $scope.model.c) { return val; }
      return (obj.c_id === cVal)? 1 : (obj.rate) * val; //not good because it supporte only two currency, I will fix it very soon
    }

    function search () {
      var hasSelectedAccount = $scope.model.account_id && $scope.model.account_id > 0;
      $scope.mode = (hasSelectedAccount) ? 'selected' : 'all';
      
      if (hasSelectedAccount) {
        $scope.model.account_number = $scope.accounts.get($scope.model.account_id).account_number;       
      } else {
        $scope.model.account_number = 0;
      }

      var url = '/reports/allTransactions/?source=' + $scope.model.source_id +
        '&enterprise_id=' + $scope.enterprise.id + 
        '&account_id=' + $scope.model.account_id + 
        '&datef=' + util.sqlDate(session.dateFrom) + 
        '&datet=' + util.sqlDate(session.dateTo);

      connect.fetch(url)
      .then(function (res) {
        res.map(function (item) {
            if($scope.enterprise.currency_id !== item.currency_id){
              item.debit *= exchange.rate(item.debit,item.currency_id,new Date());
              item.credit *= exchange.rate(item.debit,item.currency_id,new Date()); 
            }
        });
        $scope.records = res;
        getTotal(res);
      });
    }

    function getTotal(items) {
      var sCredit = 0, 
          sDebit = 0;

      session.somCredit = 0;
      session.somDebit = 0;

      items.forEach(function (item) {
        if($scope.enterprise.currency_id !== item.currency_id){
          sCredit += item.credit / exchange.rate(item.credit,item.currency_id,new Date()); 
          sDebit += item.debit / exchange.rate(item.debit,item.currency_id,new Date());
        } else {
          sCredit += item.credit;
          sDebit += item.debit;
        }                
      });

      if($scope.enterprise.currency_id === $scope.model.c){
        session.somCredit = sCredit;
        session.somDebit = sDebit;
      } else {
        session.somCredit = sCredit * exchange.rate(sCredit,$scope.model.c,new Date());
        session.somDebit = sDebit * exchange.rate(sDebit,$scope.model.c,new Date());
      }

    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where = ['account.enterprise_id='+enterprise.id];
      validate.process(dependencies)
      .then(init);
    });

    function generate() {
      fill();
      $scope.state = 'generate';
    }

    function reconfigure() {
      $scope.state = null;
    }

    function printReport() {
      print();
    }

    $scope.formatAccount = formatAccount;
    $scope.search = search;
    $scope.generate = generate;
    $scope.reconfigure = reconfigure;
    $scope.printReport = printReport;
  }
]);
