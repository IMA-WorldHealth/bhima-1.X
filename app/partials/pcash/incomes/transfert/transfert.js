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
  'uuid',
  function ($scope, $q, connect, messenger, validate, appstate, util, exchange, uuid) {

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
    };

    dependencies.summers = {
      query :'pcash_transfert_summers',
      identifier : 'reference'
    };

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
    };

    dependencies.cashAccounCurrency = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'cash_box_id', 'account_id']
          }
        }
      }
    };

    dependencies.currency = {
      required : true,
      query : {
        tables : {
          'currency' : {
            columns : ['id', 'name', 'symbol', 'min_monentary_unit']
          }
        }
      }
    };

    dependencies.cashier = {
      query : 'user_session'
    };

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
        $scope.view.cash_box.data = model.cash_box.data.filter(function (item) {
          return item.project_id === $scope.data.project_id;
        });
        configuration.project_id = $scope.data.project_id;
      });
    }

    function getCurrency (value){
      var currency = {};
      for (var i = $scope.model.currency.data.length - 1; i >= 0; i -= 1) {
        if ($scope.model.currency.data[i].id === value) {
          currency = $scope.model.currency.data[i];
          break;
        }
      }
      return currency;
    }

    function commitConfig () {
      configuration.cash_box_source_id = $scope.data.cash_box_id;
      updateInfoCashBox(configuration.cash_box_source_id, configuration.currency.id);
    }

    function updateInfoCashBox (cash_box_source_id, currency_id) {
      if(!cash_box_source_id || !currency_id) return;
      configuration.cash_account_currency = $scope.model.cashAccounCurrency.data.filter(function (item) {
        return item.cash_box_id == configuration.cash_box_source_id &&
          item.currency_id == configuration.currency.id;
      });
    }

    function updateConfig(){
      configuration.symbol = $scope.data.currency.symbol;
      configuration.currency_id = $scope.data.currency.id;
    }

    function handleError (err) {
      messenger.danger(err.toString());
      return;
    }

    function convert(value, currency_id){
      if(!(value && currency_id)) return;
      return exchange.myExchange(value, currency_id);
    }

    function isValid(){
      var clean = true;
      if(!configuration) return false;
      if(!configuration.pcash) return false;
      if(!$scope.data.value) return false;
      for (var k in configuration){
        clean = clean && (k) ? true : false;
      }
      return (clean && ($scope.data.value) ? true : false);
    }

    function ajouter (){
      configuration.value = $scope.data.value;

      if(!isValid()) return;

      writeTransfer()
      .then(postToJournal)
      .then(function (prom){
        refresh();
      })
      .catch(handleError);
    }

    function refresh(){
      configuration = {};
      validate.refresh(dependencies, ['summers'])
      .then(init)
      .catch(handleError);
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
        description : 'CT/'+new Date().toString(),
        istransfer : 1,
        account_id : configuration.cash_account_currency[0].account_id,
        cash_box_id : 1
      };
      configuration.pcash=pcash;
      return connect.basicPut('pcash', connect.clean(pcash));
    }

    function postToJournal (res) {
      return connect.fetch('/journal/pcash/' + configuration.pcash.uuid);
    }

    function commitConfiguration (){
      configuration.currency_id = $scope.data.currency_id;
    }

    //invocations
    appstate.register('project', function(project){
      //FIX ME : I think there is a good way to do it
      appstate.register('enterprise', function (enterprise) {
        $scope.project = project;
        $scope.enterprise = enterprise;
        validate.process(dependencies, ['project', 'cash_box', 'cashAccounCurrency', 'currency', 'cashier', 'summers'])
        .then(init)
        .catch(handleError);
      });
    });

    $scope.$watch('data.currency', function (nv){
      if (nv) {
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
  }
]);
