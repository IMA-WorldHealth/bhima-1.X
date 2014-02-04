angular.module('kpk.controllers')
.controller('enterpriseController', [
  '$scope',
  '$q',
  '$window',
  'connect',
  'validate',
  'messenger',
function ($scope, $q, $window, connect, validate, messenger) {
  var dependencies = {};

  dependencies.enterprise = {
    required : true,
    query : {
      tables : {
        'enterprise' : {
          columns : ['id', 'name', 'abbr', 'email', 'phone', 'location_id', 'logo', 'currency_id']
        }
      }
    } 
  };

  dependencies.currency = {
    required : true,
    query : {
      tables : {
        'currency' : {
          columns : ['id', 'symbol', 'name']
        }
      }
    }
  };


  dependencies.location = {
    query : '/location/'
  };

  validate.process(dependencies).then(initialize, handleError);
  
  function initialize (models) {
    for (var k in models) $scope[k] = models[k];
    $scope.newAccount = {};
  }

  function handleError (error) {
    messenger.danger('An error occured in fetching requests: ' + JSON.stringify(error)); 
  }

  $scope.formatLocation = function formatLocation (l) {
    return [l.village, l.sector, l.province, l.country].join(' -- ');
  };

  $scope.newEnterprise = function () {
    $scope.add = {};
    $scope.action = 'new';
  };

  $scope.editEnterprise = function (enterprise) {
    $scope.edit = angular.copy(enterprise);
    $scope.editing_enterprise = enterprise;
    $scope.action = 'edit'; 
  };

  $scope.saveEdit = function () {
    var data = connect.clean($scope.edit);

    connect.basicPost('enterprise', [data], ['id'])
    .then(function (res) {
      $scope.enterprise.put(data);
    }, function (err) {
      messenger.danger('Error updating enterprise ' + data.id + ':' + JSON.stringify(err));
    });

  };

  $scope.resetEdit = function () {
    $scope.edit = angular.copy($scope.editing_enterprise);
  };

  $scope.saveNew = function () {
    var data = connect.clean($scope.add);

    connect.basicPut('enterprise', [data])
    .then(function (res) {
      data.id = res.data.insertId;
      $scope.enterprise.post(data);
    }, function (err) {
      messenger.danger('Error in saving new enterprise:' + JSON.stringify(err));
    });
  };
  
  $scope.resetNew = function () {
    $scope.add = {}; 
  };

  $scope.manageAccounts = function () {
    $scope.action = 'manage';
    $q.all([
      connect.req({
        tables : { 'account' : { columns : ['id', 'account_number', 'account_txt']}},
        where : ['account.enterprise_id='+$scope.edit.id]
      }),
      connect.req({
        tables : {'currency_account' : { columns : ['id', 'currency_id', 'cash_account', 'bank_account']}},
        where : ['currency_account.enterprise_id='+$scope.edit.id]
      })
    ])
    .then(function (models) {
      $scope.account = models[0] ;
      $scope.currency_account = models[1];
    });
  };

  $scope.removeAccount = function (id) {
    connect.basicDelete('currency_account', id)
    .then(function (res) {
      $scope.currency_account.remove(id); 
    }, function (err) {
      messenger.danger('An Error occured:' + JSON.stringify(err));
    });
  };

  $scope.saveAccounts = function () {
    var data = connect.clean($scope.newAccount);
    data.enterprise_id = $scope.editing_enterprise.id;
    connect.basicPut('currency_account', [data])
    .then(function (res) {
      data.id = res.data.insertId;
      $scope.currency_account.post(data); 
    }, function (err) {
      messenger.danger('An error occured:' + JSON.stringify(err));
    });
  };

  $scope.resetAccounts = function () {
    $scope.newAccount = {}; 
  };

  $scope.print = function () {
    $window.print();
  };

}]);
