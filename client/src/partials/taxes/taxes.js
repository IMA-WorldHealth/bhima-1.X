angular.module('bhima.controllers')
.controller('taxes', [
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

    dependencies.taxes = {
      query : {
        identifier : 'id',
        tables : {
          'tax' : { columns : ['id', 'label', 'is_employee', 'is_percent', 'account_id', 'value'] },
          'account' : { columns : ['account_number', 'account_txt'] }
        },
        join : ['tax.account_id=account.id']
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

    $scope.delete = function (taxes) {
      var result = confirm($translate.instant('TAXES.CONFIRM'));
      if (result) {  
        connect.basicDelete('tax', taxes.id, 'id')
        .then(function () {
          $scope.taxes.remove(taxes.id);
          messenger.info($translate.instant('TAXES.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (taxes) {
      console.log(taxes);
      session.action = 'edit';
      session.edit = angular.copy(taxes);
      session.edit.is_employee = session.edit.is_employee !== 0;
      session.edit.is_percent = session.edit.is_percent !== 0;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      $scope.session.edit.is_employee = ($scope.session.edit.is_employee)? 1 : 0;
      $scope.session.edit.is_percent = ($scope.session.edit.is_percent)? 1 : 0;

      var record = angular.copy(connect.clean(session.edit));
      delete record.reference;
      delete record.account_number;
      delete record.account_txt;

      connect.basicPost('tax', [record], ['id'])
      .then(function () {
        validate.refresh(dependencies)
        .then(function (models) {
          angular.extend($scope, models);
          messenger.success($translate.instant('TAXES.UPDATE_SUCCES'));
          session.action = '';
        session.edit = {};

        });
         
        // $scope.taxes.put(record);
        
      });
    };

    $scope.save.new = function () {
      $scope.session.new.is_employee = ($scope.session.new.is_employee)? 1 : 0;
      $scope.session.new.is_percent = ($scope.session.new.is_percent)? 1 : 0;

      var record = connect.clean(session.new);
      record.id = '';
      connect.basicPut('tax', [record])
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