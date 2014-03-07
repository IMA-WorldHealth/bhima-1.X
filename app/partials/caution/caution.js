angular.module('kpk.controllers').controller('caution', function($scope, $q, $location, $http, $routeParams, validate, connect, appstate, messenger, $filter) {


  var dependencies = {};
  dependencies.currency_account = {
    query : {
      tables : {
        'currency_account' : {
          columns : ['id', 'enterprise_id', 'currency_id', 'cash_account', 'bank_account']
        },
        'currency' : {
          columns : ['symbol', 'min_monentary_unit']
        }
      },
      join : ['currency_account.currency_id=currency.id'],
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
  $scope.noEmpty = false; $scope.debitor = {}; $scope.data = {};
  dependencies.cashier = {
    query : 'user_session'
  };

  function init (model) {
    $scope.model = model;
    $scope.selectedItem = model.currency_account.data[0];
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
    validate.process(dependencies, ['location']).then(ready);
  }

  function payCaution (){
    var record = {
      value           : $scope.data.payment,
      enterprise_id   : $scope.enterprise.id,
      debitor_id      : $scope.selectedDebitor.id,
      currency_id     : $scope.selectedItem.currency_id,
      user_id         : $scope.model.cashier.data.id
    };

    console.log('on a ', record);
    writeCaution(record).then(postToJournal);
  }

  function postToJournal (res) {
    return connect.fetch('/journal/caution/' + res.data.insertId);
  }

  function writeCaution(record){
    return connect.basicPut('caution', [record]);
  }

  function setCashAccount(cashAccount) {
    if(cashAccount) $scope.selectedItem = cashAccount;
  }


  function handleSucces(){
    messenger.success($filter('translate')('SWAPDEBITOR.SUCCES'));
    $scope.selectedDebitor = {};
    $scope.debitor = {};
    $scope.noEmpty = false;
  }

  function handleError(){
    messenger.danger($filter('translate')('SWAPDEBITOR.DANGER'));
  }

  appstate.register('enterprise', function (enterprise) {
    $scope.enterprise = enterprise;
    dependencies.currency_account.query.where =
      ['currency_account.enterprise_id=' + enterprise.id];
    dependencies.accounts.query.where =
      ['account.enterprise_id=' + enterprise.id];
    validate.process(dependencies).then(init, handleError);
  });


  $scope.initialiseCaution = initialiseCaution;
  $scope.payCaution = payCaution;
  $scope.setCashAccount = setCashAccount;
});
