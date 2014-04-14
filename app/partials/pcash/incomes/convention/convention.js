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
    $scope.convention = {};
    $scope.data = {};
    $scope.model = {};

    function init (model) {
      $scope.model = model;
    }

    function ready (model) {
      $scope.overviews = model.situations.data.filter(function (situation){
        return situation.balance>0;
      });
      console.log('[model]',model);
      console.log('[overviews]',$scope.overviews);
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
      .then(postToJournal)
      .then(handleSucces)
      .catch(handleError);
    }

    function postToJournal (res) {
      record_uuid = res.config.data.data[0].uuid;
      return connect.fetch('/journal/pcash/' + record_uuid);
    }

    function writePay(record){
      return connect.basicPut('pcash', [record]);
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
        return $scope.data.payment < $scope.selectedItem.min_monentary_unit;
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
