angular.module('kpk.controllers')
.controller('reportPatientStanding', [
  '$scope',
  'validate',
  'messenger',
  'connect',
  function ($scope, validate, messenger, connect) {
    var dependencies = {};
    $scope.img = 'placeholder.gif';

    dependencies.patients = {
      query : {
        tables : {
          'patient' : {
            columns : ['id', 'debitor_id', 'first_name', 'last_name', 'dob', 'profession', 'sex', 'current_location_id']
          }
        }
      }
    };

    $scope.formatPatient = function (patient) {
      return patient ? [patient.first_name, patient.last_name].join(' ') : '';
    };

    function processModels(models) {
      for (var k in models) { $scope[k]= models[k]; }
      $scope.date = new Date();
    }

    function handleErrors(err) {
      messenger.danger('An error occured:' + JSON.stringify(err));
    }

    $scope.search = function search() {
      var id = $scope.patient.debitor_id;
      connect.fetch('/reports/patientStanding/?id=' + id)
      .success(function (data) {
        $scope.receipts = data;
      })
      .error(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
      //console.log('$scope.patient', $scope.patient);
    };

    validate.process(dependencies).then(processModels, handleErrors);
    
  }
]);
