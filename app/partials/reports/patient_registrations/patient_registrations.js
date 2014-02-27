angular.module('kpk.controllers')
.controller('reportPatientRegistrations', [
  '$scope',
  '$translate',
  'connect',
  'appstate',
  'messenger',
  function ($scope, $translate, connect, appstate, messenger) {
  
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
    });

    $scope.search = function search () {
      if (!$scope.enterprise) {
        return messenger.danger($translate('DAILY_REGISTRATION.NO_ENTERPRISE'));
      }

      connect.fetch(['/registrations', $scope.data.to, $scope.data.from].join('/'))
      .success(function (model) {
        console.log('Success:', model);
        $scope.data = model;
        $scope.action = 'display';
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
      
    };

    $scope.resetSearch = function resetSearch () {
      $scope.action = '';
    };
  }
]);
