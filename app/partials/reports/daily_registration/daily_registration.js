angular.module('kpk.controllers')
.controller('daily_registration', [
  '$scope',
  '$translate',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $translate, connect, appstate, messenger) {
  
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
    });

    $scope.go = function go () {
      if (!$scope.enterprise) {
        return messenger.danger($translate('DAILY_REGISTRATION.NO_ENTERPRISE'));
      }

      connect.req({
        tables : {
          'patient' : {
            columns : ['id', 'debitor_id', 'creditor_id', 'first_name', 'last_name', 'dob', 'sex', 'registration_date']
          }
        }
      });
      
    };

  }

]);
