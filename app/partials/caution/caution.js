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

  function ready (model) {
    $scope.model = model;
    $scope.locationDebitor = model.location.data[0];
    $scope.selectedItem = model.currency_account.data[0];

    $scope.noEmpty = true;
  }

  function initialiseCaution (selectedDebitor) {
    if(!selectedDebitor) return messenger.danger('No debtor selected');
    $scope.selectedDebitor = selectedDebitor;
    dependencies.location = { query : '/location/' + $scope.selectedDebitor.origin_location_id};
    validate.process(dependencies).then(ready);
  }

  function swapGroup (selectedDebitor){
    var debitor = {id : selectedDebitor.debitor_id, group_id : $scope.debitor.debitor_group_id};
    connect.basicPost('debitor', [connect.clean(debitor)], ['id'])
    .then(function(res) {
      var packageHistory = {
        debitor_id : selectedDebitor.debitor_id,
        debitor_group_id : $scope.debitor.debitor_group_id,
        user_id : $scope.model.cashier.data.id
      }
      connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]).then(handleSucces, handleError);
  }, handleError);

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
  $scope.initialiseCaution = initialiseCaution;
  $scope.swapGroup = swapGroup;
  $scope.setCashAccount = setCashAccount;
});
