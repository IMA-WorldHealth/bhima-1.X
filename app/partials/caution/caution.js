angular.module('kpk.controllers')
.controller('caution', [
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
  function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $translate, util) {

    var dependencies = {},
        caution_id = -1;

    dependencies.cash_box_account = {
      query : {
        tables : {
          'cash_box_account' : {
            columns : ['id', 'currency_id', 'cash_account', 'bank_account', 'caution_account']
          },
          'currency' : {
            columns : ['symbol', 'min_monentary_unit']
          }
        },
        join : ['cash_box_account.currency_id=currency.id'],
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        },
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

    $scope.noEmpty = false;
    $scope.debitor = {};
    $scope.data = {};


    dependencies.cashier = {
      query : 'user_session'
    };


    $scope.model = {};

    function init (model) {
      $scope.model = model;
      $scope.selectedItem = model.cash_box_account.data[0];
      console.log('Nous avons comme model ', model);
    }

    function ready (model) {
      $scope.model.location = model.location;
      $scope.locationDebitor = model.location.data[0];
      $scope.noEmpty = true;
    }

    function initialiseCaution (selectedDebitor) {
      if(!selectedDebitor) return messenger.danger('No debtor selected');
      $scope.selectedDebitor = selectedDebitor;
      dependencies.location = { query : '/location/' + $scope.selectedDebitor.origin_location_id};
      validate.process(dependencies, ['location'])
      .then(ready);
    }

    function payCaution (){
      var record = {
        value           : $scope.data.payment,
        enterprise_id   : $scope.enterprise.id,
        debitor_id      : $scope.selectedDebitor.debitor_id,
        currency_id     : $scope.selectedItem.currency_id,
        user_id         : 1
      };
      writeCaution(record)
      .then(postToJournal)
      .then(handleSucces)
      .catch(handleError);
    }

    function postToJournal (res) {
      caution_id = res.data.insertId;
      return connect.fetch('/journal/caution/' + res.data.insertId);
    }

    function writeCaution(record){
      return connect.basicPut('caution', [record]);
    }

    function setCashAccount(cashAccount) {
      if(cashAccount) $scope.selectedItem = cashAccount;
    }


    function handleSucces(){
      messenger.success($translate('CAUTION.SUCCES'));
      $scope.selectedDebitor = {};
      $scope.data = {};
      $scope.noEmpty = false;
      if (caution_id !== -1) { $location.path('/invoice/caution/' + caution_id); }
    }

    function handleError(){
      messenger.danger($translate('CAUTION.DANGER'));
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      dependencies.accounts.query.where =
        ['account.enterprise_id=' + enterprise.id];
      validate.process(dependencies).then(init, handleError);
    });

    function check (){
      if($scope.data.payment){
        return $scope.data.payment < $scope.selectedItem.min_monentary_unit;
      }else{
        return true;
      }
    }


    $scope.initialiseCaution = initialiseCaution;
    $scope.payCaution = payCaution;
    $scope.setCashAccount = setCashAccount;
    $scope.check = check;
  }
]);
