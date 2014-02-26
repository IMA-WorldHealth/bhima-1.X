angular.module('kpk.controllers').controller('renewal', function($scope, validate) { 
  var sessionPatient, patientRenewed = $scope.patientRenewed = false;
  var dependencies = {};

  console.log('patient renewal'); 
  function loadPatient(patient) { 
    sessionPatient = $scope.sessionPatient = patient;
    console.log(sessionPatient);

    dependencies.location = { 
      query : '/location/' + patient.origin_location_id
    }
    validate.process(dependencies).then(processLocation);
  }
  
  function submitRenewal(sessionPatient) {
    console.log("firsted");
    patientRenewed = $scope.patientRenewed = true; 
  }

  function processLocation(model) { 
    $scope.model = model;
    $scope.patientLocation = model.location.data[0];
  }

  $scope.loadPatient = loadPatient;
  $scope.submitRenewal = submitRenewal;
});
