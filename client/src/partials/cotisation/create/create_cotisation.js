angular.module('bhima.controllers')
.controller('cotisations_management.create', [
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

    dependencies.cotisations = {
      query : {
        identifier : 'id',
        tables : {
          'cotisation' : { columns : ['id', 'label', 'abbr', 'is_employee', 'is_percent', 'four_account_id', 'six_account_id', 'value'] }
        }
      }
    };

    dependencies.accounts = {
      query : {
        tables : {
          'account' : {
            columns : ['id', 'account_number', 'account_txt']
          }
        },
        where : ['account.is_ohada=1', 'AND', 'account.account_type_id<>3']
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

    $scope.delete = function (cotisations) {
      var result = confirm($translate.instant('COTISATIONS.CONFIRM'));
      if (result) {
        connect.basicDelete('cotisation', cotisations.id, 'id')
        .then(function () {
          $scope.cotisations.remove(cotisations.id);
          messenger.info($translate.instant('COTISATIONS.DELETE_SUCCESS'));
        });
      }
    };

    $scope.edit = function (cotisations) {
      session.action = 'edit';
      session.edit = angular.copy(cotisations);
      session.edit.is_employee = session.edit.is_employee !== 0;
      session.edit.is_percent = session.edit.is_percent !== 0;
    };

    $scope.new = function () {
      session.action = 'new';
      session.new = {};
    };

    $scope.save = {};

    $scope.save.edit = function () {
      console.log('$scope.session.edit', $scope.session.edit);
      $scope.session.edit.is_employee = ($scope.session.edit.is_employee) ? 1 : 0;
      $scope.session.edit.is_percent = ($scope.session.edit.is_percent) ? 1 : 0;

      var record = angular.copy(connect.clean(session.edit));
      delete record.reference;
      delete record.account_number;
      delete record.account_txt;

      record.six_account_id = session.edit.six_account_id;

      if(record.abbr){
        if(record.abbr.length <= 4){
          connect.basicPost('cotisation', [record], ['id'])
          .then(function () {
            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
              messenger.success($translate.instant('COTISATIONS.UPDATE_SUCCES'));
              session.action = '';
              session.edit = {};
            });
          });
        } else if (record.abbr.length > 4){
          messenger.danger($translate.instant('COTISATIONS.NOT_SUP4'));
        }
      }  else {
        messenger.danger($translate.instant('COTISATIONS.NOT_EMPTY'));
      }
    };

    $scope.save.new = function () {
      console.log('$scope.session.new:', $scope.session.new);

      $scope.session.new.is_employee = ($scope.session.new.is_employee)? 1 : 0;
      $scope.session.new.is_percent = ($scope.session.new.is_percent)? 1 : 0;
      var record = connect.clean(session.new);
      record.six_account_id = session.new.six_account_id;
      
      if(record.abbr){
        if(record.abbr.length <= 4){
          connect.basicPut('cotisation', [record])
          .then(function (res) {

            validate.refresh(dependencies)
            .then(function (models) {
              angular.extend($scope, models);
            });
            session.action = '';
            session.new = {};
          });
        } else if (record.abbr.length > 4){
          messenger.danger($translate.instant('COTISATIONS.NOT_SUP4'));
        }
      }  else {
        messenger.danger($translate.instant('COTISATIONS.NOT_EMPTY'));
      }
    };
  }
]);
