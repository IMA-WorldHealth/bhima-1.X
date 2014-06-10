angular.module('bhima.controllers')
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
  'uuid',
  'appcache',
  '$filter',
  function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $translate, util, uuid, Appcache, $filter) {

    var dependencies = {},
        caution_uuid = -1,
        cache = new Appcache('caution');

    dependencies.cash_box = {
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

    $scope.noEmpty = false;
    $scope.debitor = {};
    $scope.data = {};


    dependencies.cashier = {
      query : 'user_session'
    };


    $scope.model = {};

    function init (model) {
      $scope.model = model;

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
        uuid         : uuid(),
        reference    : 1, // FIXME                                                                                                                               : Workaround for dead triggers
        value        : $scope.data.payment,
        project_id   : $scope.project.id,
        debitor_uuid : $scope.selectedDebitor.debitor_uuid,
        currency_id  : $scope.selectedItem.currency_id,
        user_id      : $scope.model.cashier.data.id,
        cash_box_id  : $scope.selectedItem.id,
        description  : ['CAP', $scope.selectedDebitor.debitor_uuid, $scope.selectedDebitor.first_name, util.convertToMysqlDate(new Date().toString())].join('/')
      };
      writeCaution(record)
      .then(postToJournal)
      .then(handleSucces)
      .catch(handleError);
    }

    function postToJournal (res) {
      caution_uuid = res.config.data.data[0].uuid;
      return connect.fetch('/journal/caution/' + caution_uuid);
    }

    function writeCaution(record){
      return connect.basicPut('caution', [record]);
    }

    function setCashAccount(cashAccount) {
      if(cashAccount) {
        $scope.selectedItem = cashAccount;
        cache.put('selectedItem', cashAccount);
      }
    }


    function handleSucces(resp){
      messenger.success($filter('translate')('CAUTION.SUCCES'));
      $scope.selectedDebitor = {};
      $scope.data = {};
      $scope.noEmpty = false;
      if (caution_uuid !== -1) { $location.path('/invoice/caution/' + caution_uuid); }
    }

    function handleError(){
      messenger.danger($filter('translate')('CAUTION.DANGER'));
    }

    function load (selectedItem) {
      if (!selectedItem) { return; }
      $scope.selectedItem = selectedItem;
    }

    cache.fetch('selectedItem').then(load);

    appstate.register('project', function (project) {
      $scope.project = project;
      dependencies.accounts.query.where = ['account.enterprise_id='+project.enterprise_id];
      dependencies.cash_box.query.where=['cash_box.project_id='+project.id, 'AND', 'cash_box.is_auxillary='+1];
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
