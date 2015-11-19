
// TODO Refactor patient find directive to not use $scope.watch
// TODO No action is taken if default parameter is not a valid patient
angular.module('bhima.controllers')
.controller('PatientEdit', PatientEdit);

PatientEdit.$inject = ['$scope', '$routeParams'];

function PatientEdit($scope, $routeParams) { 
  var viewModel = this;
  var referenceId = $routeParams.patientID;

  viewModel.patient = null;
  
  if (referenceId) { 
    viewModel.referredPatient = referenceId;
  }

  
  // Callback passed to find patient directive 
  viewModel.confirmPatient = function confirmPatient(patient) { 
    
    // TODO Verify patient validity etc. 
    viewModel.patient = patient;

    console.log('got patient', patient);
  }
}
