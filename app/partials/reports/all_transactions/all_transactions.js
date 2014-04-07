angular.module('kpk.controllers')
.controller('allTransactions', [
  '$scope',
  'connect',
  'appstate',
  'messenger',
  '$filter',
  'validate',
  'util',
  function ($scope, connect, appstate, messenger, $filter, validate, util) {

    //variables inits

    var dependencies = {}, map = {};
    $scope.somDebit = 0, $scope.somCredit = 0;

    dependencies.accounts = {
      required : true,
      query : {
        tables : {'account' : {columns : ["id", "account_number", "account_txt", "account_type_id"]}}
      }
    }

    dependencies.exchange_rate = {
      query : {
        tables : {
          'exchange_rate' : {
            columns : ['id', 'foreign_currency_id', 'rate', 'date']
          }
        }
      }
    }

    dependencies.currencies = {
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'symbol']
          }
        }
      }
    }

    $scope.dates = {}; $scope.state = {}; $scope.account = {}, $scope.model = {};
    $scope.model.sources = [$filter('translate')('SELECT.ALL'), $filter('translate')('SELECT.POSTING_JOURNAL'), $filter('translate')('SELECT.GENERAL_LEDGER')];


    //fonctions

    function formatAccount (account){
      return [
        account.account_number, account.account_txt
      ].join(' -- ');
    }

    function init (model){
      for(var k in model) $scope[k] = model[k];
      $scope.accounts.data.forEach(function (account) {
        account.account_number = String(account.account_number);
      });
      $scope.model.c = $scope.enterprise.currency_id;
      console.log('enterprise id', $scope.model.c)
      $scope.exchange_rate.data.forEach(function (item){
        map[util.convertToMysqlDate(item.date)] = {c_id : item.foreign_currency_id, rate : item.rate};
      });
    }

    function handlError (err){
      //console.log('error');
      //
    }

    function fill (){
     // var f = (account_id && account_id != 0)? selective(account_id) : all ();
     if (!$scope.model.account_id) {
        all();
     }
    }

    $scope.affiche = function(){
      console.log($scope.model.c);
    }

    function selective (){
      $scope.mode = 'selected';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : $scope.model.account_id,
        datef : $scope.dates.from,
        datet : $scope.dates.to
      };

      $scope.model.account_number = $scope.accounts.data.filter(function(value){
        return value.id == $scope.model.account_id;
      })[0].account_number;

      connect.fetch(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            if(res.length > 0){
              res.map(function (item){
                item.debit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.debit, $scope.enterprise.currency_id);
                item.credit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.credit, $scope.enterprise.currency_id);
              });
              $scope.records = res;
              getTotal(res);
            }else{
            getTotal(res);
            $scope.records = [];
            }
          }
      })
    }

    function all () {
      $scope.mode = 'all';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : 0,
        datef : $scope.state.from,
        datet : $scope.state.to
      };
      connect.fetch(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            res.map(function (item){
              item.debit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.debit, $scope.enterprise.currency_id);
              item.credit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.credit, $scope.enterprise.currency_id);
            });
            $scope.records = res;
            getTotal(res);
          }else{
            $scope.records = [];
            getTotal(res);
          }
        })
    }

    function dateWatcher () {
      $scope.state.from = util.convertToMysqlDate($scope.dates.from);
      $scope.state.to = util.convertToMysqlDate($scope.dates.to);
    }

    function getValue (obj, val, cVal){
      if(cVal === $scope.model.c) return val;
      return (obj.c_id === cVal)? 1 : (obj.rate)*val; //not good because it supporte only two currency, I will fix it very soon
    }

    function search (){
      if(!$scope.model.account_id) return;
      ($scope.model.account_id != 0)?$scope.mode = 'selected' : $scope.mode = 'all';
      var qo = {
        source : $scope.model.source_id,
        enterprise_id : $scope.enterprise.id,
        account_id : $scope.model.account_id,
        datef : $scope.state.from,
        datet : $scope.state.to
      };

      if($scope.model.account_id && $scope.model.account_id == 0){
        $scope.model.account_number = "Tous"
      }else{
         $scope.model.account_number = $scope.accounts.data.filter(function(value){
          return value.id == $scope.model.account_id;
        })[0].account_number;
      }

      connect.fetch(
        '/reports/allTrans/?'+JSON.stringify(qo)
      ).then(function(res){
          if(res.length > 0){
            res.map(function (item){
              item.debit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.debit, $scope.enterprise.currency_id);
              item.credit = getValue(map[util.convertToMysqlDate(item.trans_date)], item.credit, $scope.enterprise.currency_id);
            });
            $scope.records = res;
            getTotal(res);
          }else{
            getTotal(res);
            $scope.records = [];
          }
      })
    }

    function getTotal(items){
      $scope.somCredit=0; $scope.somDebit = 0;
      if(items.length>0){
         items.forEach(function (item){
        $scope.somDebit+=item.debit;
        $scope.somCredit+=item.credit;
      });

      }else{
        $scope.somCredit = 0;
        $scope.somDebit = 0;

      }

    }

    //invocations

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      $scope.dates.from = new Date();
      $scope.dates.to = new Date();
      dependencies.accounts.query.where = ['account.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(init, handlError);
    });

    $scope.$watch('dates', dateWatcher, true);
    $scope.$watch('model.account_id', fill);
    $scope.$watch('model.c', fill);


    //expositions

    $scope.formatAccount = formatAccount;
    $scope.search = search;
  }
]);
