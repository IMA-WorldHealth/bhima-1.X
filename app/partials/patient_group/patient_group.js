angular.module('kpk.controllers')
.controller('patientGroup', [
  '$scope',
  '$filter',
  'connect',
  'validate',
  'appstate',
  'messenger',
  function ($scope, $filter, connect, validate, appstate, messenger) {
    var dependencies = {};
    var session = $scope.session = {
      selected : null
    };

    dependencies.group = {
      query : {
        tables: {
          'patient_group' : {
            columns: ['id', 'enterprise_id', 'price_list_id', 'name', 'note']
          }
        }
      }
    };

    dependencies.list = {
      query : {
        tables : { 'price_list' : { columns : ['id', 'title'] } } 
      } 
    };

    appstate.register('enterprise', loadEnterprise);

    function loadEnterprise(enterprise) { 
      $scope.enterprise = enterprise;
      dependencies.group.query.where = ['patient_group.enterprise_id='+enterprise.id];
      validate.process(dependencies).then(initialisePatientGroup);
    }

    function initialisePatientGroup(model) {
      for (var modelKey in model) { $scope[modelKey] = model[modelKey]; }
    }

    $scope.remove = function (grp) {
      if (!confirm($filter('translate')('PATIENT_GRP.CONFIRM_MESSAGE'))) return;

      connect.basicDelete('patient_group', grp.id)
      .then(function (result) {
        $scope.group.remove(grp.id);
      }, function (err) {
        messenger.danger('error:' + JSON.stringify(err));
      });
    };

    // register namespace

    $scope.newGroup = function () {
      $scope.register = {};
      $scope.action = 'register';

      session.selected = null;
    };

    $scope.saveRegistration = function () {
      $scope.register.enterprise_id = $scope.enterprise.id;
      // validate that register is complete.
      console.log('attempting to insert', connect.clean($scope.register));
      connect.basicPut('patient_group', [connect.clean($scope.register)])
      .then(function (res) {
        var row = connect.clean($scope.register);
        row.id = res.data.insertId;
        $scope.group.post(row);
      }, function (err) {
        messenger.danger('An error occured.');
      });
    };

    $scope.resetRegistration = function () {
      $scope.register = {};
    };

    // edit namespace

    $scope.edit = function (grp) {
      $scope.action = 'modify';
      $scope.modify = angular.copy(grp);
      $scope.modify_original = grp;

      session.selected = grp;
    };

    $scope.resetModification = function () {
      $scope.modify = angular.copy($scope.modify_original);
    };

    $scope.saveModification = function () {
      // validate that modification is complete
      connect.basicPost('patient_group', [connect.clean($scope.modify)], ['id'])
      .then(function (res) {
        messenger.success('Successfully modified the group.');
      }, function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    };

  }
]);
