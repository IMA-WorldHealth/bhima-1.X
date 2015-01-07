angular.module('bhima.controllers')
.controller('taxes_management.create', [
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
          'tax' : { columns : ['id', 'label', 'abbr', 'is_employee', 'is_ipr', 'is_percent', 'four_account_id', 'six_account_id', 'value'] }
        }
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        }
      }
    };

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
      session.edit.is_ipr = session.edit.is_ipr !== 0;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      $scope.session.edit.is_employee = ($scope.session.edit.is_employee)? 1 : 0;
      $scope.session.edit.is_percent = ($scope.session.edit.is_percent)? 1 : 0;
      $scope.session.edit.is_ipr = ($scope.session.edit.is_ipr)? 1 : 0;      

      var record = angular.copy(connect.clean(session.edit));
      delete record.reference;
      delete record.account_number;
      delete record.account_txt;

      if(record.abbr){
        if(record.abbr.length <= 4){
          connect.basicPost('tax', [record], ['id'])
          .then(function () {
            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
              messenger.success($translate.instant('TAXES.UPDATE_SUCCES'));
              session.action = '';
              session.edit = {};
            });
          });
        } else if (record.abbr.length > 4){
          messenger.danger($translate.instant('TAXES.NOT_SUP4'));
        }
      }  else {
        messenger.danger($translate.instant('TAXES.NOT_EMPTY'));
      }
    };

    $scope.save.new = function () {
      $scope.session.new.is_employee = ($scope.session.new.is_employee)? 1 : 0;
      $scope.session.new.is_percent = ($scope.session.new.is_percent)? 1 : 0;
      $scope.session.new.is_ipr = ($scope.session.new.is_ipr)? 1 : 0;
      var record = connect.clean(session.new);
      if(record.abbr){
        if(record.abbr.length <= 4){
          connect.basicPut('tax', [record])
          .then(function (res) {

            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
            });
            session.action = '';
            session.new = {};
          });
        } else if (record.abbr.length > 4){
          messenger.danger($translate.instant('TAXES.NOT_SUP4'));
        }
      }  else {
        messenger.danger($translate.instant('TAXES.NOT_EMPTY'));
      }
    };
  }
]);
