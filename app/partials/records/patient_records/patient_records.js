angular.module('kpk.controllers').controller('patientRecords', function($scope, $routeParams, validate) {
  var dependencies = {}, patient = ($routeParams.patientID || -1);			
 
  dependencies.patient = { 
    query : { 'tables' : { 'patient' : { 'columns' : ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2', 'current_location_id', 'debitor_id', 'registration_date'] }}},
  };
 
  // validate.process(dependencies).then(patientRecords);
  
  function patientSearch(searchParams) { 
    var condition = [];
    if(!searchParams) return;
      
    Object.keys(searchParams).forEach(function(key) { 
      if(searchParams[key].length) condition.push('patient.' + key + '=' + searchParams[key], "AND");
    });
    dependencies.patient.query.where = condition.slice(0, -1);
    validate.refresh(dependencies).then(patientRecords);
  }
  
  function patientRecords(model) { 
    $scope.model = model;
    filterNames(model.patient.data);
  }

  function filterNames(patientData) { 
    patientData.forEach(function(patient) { patient.name = patient.first_name + ' ' + patient.last_name; }); 
  }

  function fetchAll() { 
    dependencies.patient.query.where = null;
    validate.refresh(dependencies).then(patientRecords);
  }

  function select(id) { 
    $scope.selected = $scope.model.patient.get(id);
  }
  
  $scope.patientSearch = patientSearch;
  $scope.fetchAll = fetchAll;
  $scope.select = select;
});
