angular.module('kpk.controllers')
.controller('transfert', [
  '$scope',
  '$q',
  'connect',
  'messenger',
  'validate',
  'appstate',
  'util',
  'exchange',
  function ($scope, $q, connect, messenger, validate, appstate, util, exchange) {

    //inits and declarations
    var dependencies = {}, configuration = {};
    $scope.data= {};

    dependencies.project = {
      required : true,
      query : {
        tables : {
          'project' : {
            columns : ['id', 'name', 'abbr', 'enterprise_id']
          }
        }
      }
    }

    dependencies.cash_box = {
      required : true,
      query : {
        tables : {
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        },
        where : ['cash_box.is_auxillary='+1]
      }
    }

    dependencies.cashAccounCurrency = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
          }
        }
      }
    }

    dependencies.currency = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol', 'min_monentary_unit']
          }
        }
      }
    }

    dependencies.cashier = {
      query : 'user_session'
    }

    dependencies.summers = {
      query : '/synthetic/pcRI/'
    }

    //fonctions
    function init (model) {
      $scope.model = model;
      $scope.view = model;
      configuration.enterprise = $scope.enterprise;
      configuration.currency = getCurrency(configuration.enterprise.currency_id);
      window.model = $scope.model;
    }

    function commitCash (){
     validate.refresh(dependencies, ['cash_box']).then(function(model){
       $scope.view.cash_box.data = model.cash_box.data.filter(function (item){
        return (item.project_id == $scope.data.project_id);
      });
       configuration.project_id = $scope.data.project_id;
     })
    }

    function getCurrency (value){
      var currency = {};
      for (var i = $scope.model.currency.data.length - 1; i >= 0; i--) {
        if($scope.model.currency.data[i].id === value){
          currency = $scope.model.currency.data[i];
          break;
        }
      }
      return currency;
    }

    function commitConfig (){
      configuration.cash_box_source_id = $scope.data.cash_box_id;
      updateInfoCashBox(configuration.cash_box_source_id, configuration.currency.id);
    }

    function updateInfoCashBox(cash_box_source_id, currency_id) {
      if(!cash_box_source_id || !currency_id) return;
      configuration.cash_account_currency = $scope.model.cashAccounCurrency.data.filter(function (item){
        return (
                item.cash_box_id == configuration.cash_box_source_id &&
                item.currency_id == configuration.currency.id
               );
      });
      console.log('[configuration]', configuration);
    }

    function formatTab (m){
      return m.pcash_accounts.data.map(function (item){
        return item.pcash_account;
      });
    }

    function updateConfig(){
      configuration.symbol = $scope.data.currency.symbol;
      configuration.currency_id = $scope.data.currency.id;
    }

    function handlError (err) {
      messenger.danger(err.toString());
      return;
    }

    function resolve () {
      map[$scope.data.source_id]();
    }

    function transferCashAuxi (){
      getExpectedAmount().then(handlResult);
    }

    function transferCashPax (){
      //console.log('cashPax');
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
      if(cashAccount) $scope.selectedItem = cashAccount;
    }

    function convert(value, currency_id){
      if(!(value && currency_id)) return;
      return exchange.myExchange(value, currency_id);
    }

    function isValid(){
      var clean = true;
      if(!configuration) return false;
      if(!$scope.data.value) return false;
      for(var k in configuration){
        clean = clean && (k)? true : false;
      }
      return (clean && ($scope.data.value)? true : false);
    }

    function ajouter (){
      configuration.value = $scope.data.value;
       console.log('configuration', configuration);
      if(!isValid()) return;
     // writeTransfer()
      //.then(postToJournal);
      //.then(postToJournal).then(success, error);
    }

    function writeTransfer (){
      var pcash = {
        uuid : uuid(),
        project_id : configuration.project_id,
        type : 'E',
        date : util.convertToMysqlDate(new Date().toISOString().slice(0,10)),
        currency_id : configuration.currency.id,

        value : $scope.data.value,
        cashier_id : $scope.model.cashier.data.id,
        description : 'CT'+new Date().toString(),
        istransfer : 1,
        reference : 1,
      };
      return connect.basicPut('pcash', connect.clean(pcash));
    }

    function postToJournal (res) {
      return connect.fetch('/journal/pcash/' + res.data.insertId);
    }

    function commitConfiguration (){
      configuration.currency_id = $scope.data.currency_id;
    }

    //invocations
    appstate.register('project', function(project){
      //FIX ME : I think there is a good way to do it
     appstate.register('enterprise', function (enterprise){
       $scope.project = project;
       $scope.enterprise = enterprise;
       validate.process(dependencies, ['project', 'cash_box', 'cashAccounCurrency', 'currency', 'cashier']).then(init, handlError);
     })
    });

    $scope.$watch('data.currency', function (nv){
      if(nv) {
        configuration.currency = JSON.parse(nv);
        updateInfoCashBox(configuration.cash_box_source_id, configuration.currency.id);
     }
    }, true);



    //expositions
    $scope.commitCash = commitCash;
    $scope.commitConfiguration = commitConfiguration;
    $scope.commitConfig = commitConfig;
    $scope.commitCash = commitCash;
    $scope.ajouter = ajouter;
    $scope.configuration = configuration;
    $scope.updateConfig = updateConfig;

     // dependencies.exchange_rate = {
    //   required : true,
    //   query : {
    //     tables : {
    //       'exchange_rate' : {
    //         columns : ['id', 'enterprise_currency_id', 'foreign_currency_id', 'date', 'rate']
    //       }
    //     },
    //     where : ['exchange_rate.date='+util.convertToMysqlDate(new Date().toISOString().slice(0,10))]
    //   }
    // };
  }
]);
