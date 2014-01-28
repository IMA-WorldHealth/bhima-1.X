angular.module('kpk.controllers').controller('patientRecords', function($scope, $routeParams, validate) {
  var dependencies = {}, patient = ($routeParams.patientID || -1);			
 
  dependencies.patient = { 
    required : true,
    query : { 'tables' : { 'patient' : { 'columns' : ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2', 'location_id'] }}}
  };
    
  validate.process(dependencies).then(patientRecords, handleError);

  function patientRecords(model) { 
    $scope.model = model;
    filterNames(model.patient.data);
  }

  function filterNames(patientData) { 
    patientData.forEach(function(patient) { patient.name = patient.first_name + ' ' + patient.last_name; }); 
  }
  
  function select(id) { 
    $scope.selected = $scope.model.patient.get(id);
  }

  function handleError(error) { 
    console.error('oh lawd, oh, oewkflj');
  }

  $scope.select = select;
});
