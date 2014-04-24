angular.module('kpk.controllers')
.controller('convention', [
  '$scope',
  '$q',
  '$location',
  '$http',
  '$routeParams',
  'validate',
  'connect',
  'appstate',
  'messenger',
  '$translate',
  'util',
  'uuid',
  'appcache',
  function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $translate, util, uuid, Appcache) {

    var dependencies = {}, record_uuid = -1,
        cache = new Appcache('convention');

    dependencies.cash_box = {
      required : true,
      query : {
        tables : {
          'cash_box_account_currency' : {
            columns : ['id', 'currency_id', 'account_id']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          },
          'cash_box' : {
            columns : ['id', 'text', 'project_id']
          }
        },
        join : [
          'cash_box_account_currency.currency_id=currency.id',
          'cash_box_account_currency.cash_box_id=cash_box.id'
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
        where : ['exchange_rate.date='+util.convertToMysqlDate(new Date())]
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

    dependencies.cashier = {
      query : 'user_session'
    };

    $scope.noEmpty = false;
    $scope.som = 0;
    $scope.convention = {};
    $scope.data = {};
    $scope.model = {};

    function init (model) {
      $scope.model = model;
    }

    function ready (model) {
      $scope.som = 0;
      $scope.overviews = model.situations.data.filter(function (situation){
        console.log('[situation]', situation);
        if(situation.balance>0) $scope.som+=situation.balance;
        return situation.balance>0;
      });
      $scope.noEmpty = true;
    }

    function initialiseConvention (selectedConvention) {
      if(!selectedConvention) return messenger.danger('No convention selected!');
      $scope.selectedConvention = selectedConvention;
      dependencies.situations = { query : '/ledgers/debitor_group/' + $scope.selectedConvention.uuid};
      validate.process(dependencies, ['situations'])
      .then(ready);
    }

    function pay (){

      var record = {
        uuid            : uuid(),
        project_id      : $scope.project.id,
        type            : 'E',
        date            : util.convertToMysqlDate(new Date().toString()),
        currency_id     : $scope.selectedItem.currency_id,
        value           : $scope.data.payment,
        cashier_id      : $scope.model.cashier.data.id,
        description     : ['COVP', $scope.selectedConvention.name, util.convertToMysqlDate(new Date().toString())].join('/'),
        istransfer     : 0,
        account_id      : $scope.selectedConvention.account_id,
        cash_box_id     : $scope.selectedItem.id
      };

      writePay(record)
      .then(writeItem)
      .then(postToJournal)
      .then(handleSucces)
      .catch(handleError);
    }

    function postToJournal (resu) {
      console.log('[resu]', resu);
      record_uuid = resu[0].config.data.data[0].pcash_uuid;
      return connect.fetch('/journal/pcash_convention/' + record_uuid);
    }

    function writePay(record){
      return connect.basicPut('pcash', [record]);
    }

    function writeItem (result){
      var pcashItems = getPcashItems($scope.data.payment, result);
      console.log('[pcashitems]', pcashItems);
      return $q.all(pcashItems.map(function (pcash_item){
        return connect.basicPut('pcash_item', [pcash_item]);
      }));
    }

    function getPcashItems(max_amount, result) {
      var items = [];
      var cost_received = max_amount;

      for(var i=0; i<$scope.overviews.length; i++){
        cost_received-=$scope.overviews[i].balance;
        if(cost_received>=0){
          items.push({uuid : uuid(), pcash_uuid : result.config.data.data[0].uuid, cost : $scope.overviews[i].balance, inv_po_id : $scope.overviews[i].inv_po_id});
        }else{
          cost_received+=$scope.overviews[i].balance;
          items.push({uuid : uuid(), pcash_uuid : result.config.data.data[0].uuid, cost : cost_received, inv_po_id : $scope.overviews[i].inv_po_id});
          break;
        }
      }
      return items;
    }

    function setCashAccount(cashAccount) {
      if(cashAccount) {
        $scope.selectedItem = cashAccount;
        cache.put('selectedItem', cashAccount);
      }
    }


    function handleSucces(resp){
      messenger.success($translate('CONVENTION.SUCCES'));
      $scope.selectedConvention = {};
      $scope.data = {};
      $scope.noEmpty = false;
      //if(record_uuid !== -1) $location.path('/invoice/caution/' + record_uuid);
    }

    function handleError(){
      messenger.danger($translate('CONVENTION.DANGER'));
    }

    cache.fetch('selectedItem').then(load);


    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where = ['account.enterprise_id='+project.enterprise_id];
      dependencies.cash_box.query.where=['cash_box.project_id='+project.id, 'AND', 'cash_box.is_auxillary='+0];
      validate.process(dependencies).then(init, handleError);
    });

    function load (selectedItem){
      if(!selectedItem) {
         return ;
      }else{
        $scope.selectedItem = selectedItem;
      }
    }

    function check (){
      if($scope.data.payment){
        return $scope.data.payment < $scope.selectedItem.min_monentary_unit || $scope.data.payment > $scope.som;
      }else{
        return true;
      }
    }

    $scope.initialiseConvention = initialiseConvention;
    $scope.pay = pay;
    $scope.setCashAccount = setCashAccount;
    $scope.check = check;
  }
]);
