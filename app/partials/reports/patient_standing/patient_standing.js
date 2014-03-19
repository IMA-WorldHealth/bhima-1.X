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
      required : true,
      query : {
        tables : {
          patient : {columns : ["uuid", "project_id", "debitor_uuid", "first_name", "last_name", "sex", "dob", "origin_location_id"]},
          debitor : { columns : ["text"]},
          debitor_group : { columns : ['account_id', 'price_list_uuid', 'is_convention']}
        },
        join : ["patient.debitor_uuid=debitor.uuid", 'debitor.group_uuid=debitor_group.uuid']
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
