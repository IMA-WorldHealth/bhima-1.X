angular.module('bhima.controllers')
.controller('config_accounting', [
  '$scope',
  '$translate',
  '$http',
  'validate',
  'messenger',
  'connect',
  'appstate',
  function ($scope, $translate, $http, validate, messenger, connect, appstate) {
    var dependencies = {},
        session = $scope.session = {};

    dependencies.config_accountings = {
      query : {
        identifier : 'id',
        tables : {
          'config_accounting' : { columns : ['id', 'label', 'account_id'] },
          'account' : { columns : ['account_number', 'account_txt'] }
        },
        join : ['config_accounting.account_id=account.id']
      }
    };

    // Add by Chris Lomame for filtering accounts of class 6
    $http.get('/getAccount6/').
      success(function(data) {
        $scope.accounts = data;
    });

    function startup (models) {
      angular.extend($scope, models);
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      validate.process(dependencies)
      .then(startup);
    });

    $scope.delete = function (config_accountings) {
      var result = confirm($translate.instant('TAXES.CONFIRM'));
      if (result) {  
        connect.basicDelete('config_accounting', config_accountings.id, 'id')
        .then(function () {
          $scope.config_accountings.remove(config_accountings.id);
          messenger.info($translate.instant('TAXES.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (config_accountings) {
      console.log(config_accountings);
      session.action = 'edit';
      session.edit = angular.copy(config_accountings);
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {

      var record = angular.copy(connect.clean(session.edit));
      delete record.reference;
      delete record.account_number;
      delete record.account_txt;

      connect.basicPost('config_accounting', [record], ['id'])
      .then(function () {
        validate.refresh(dependencies)
        .then(function (models) {
          angular.extend($scope, models);
          messenger.success($translate.instant('TAXES.UPDATE_SUCCES'));
          session.action = '';
        session.edit = {};

        });
         
        // $scope.config_accountings.put(record);
        
      });
    };

    $scope.save.new = function () {

      var record = connect.clean(session.new);
      record.id = '';
      connect.basicPut('config_accounting', [record])
      .then(function (res) {

        validate.refresh(dependencies)
        .then(function (models) {
          angular.extend($scope, models);
        });
        session.action = '';
        session.new = {};
      });
    }; 
  } 
]);