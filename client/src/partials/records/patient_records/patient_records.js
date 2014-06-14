angular.module('bhima.controllers')
.controller('patientRecords', [
  '$scope',
  'validate',
  function($scope, validate) {
    var dependencies = {};

    dependencies.patient = {
      query : {
        identifier : 'uuid',
        tables : {
          patient : {
            columns : ['uuid', 'first_name', 'last_name', 'dob', 'father_name', 'mother_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2', 'current_location_id', 'debitor_uuid', 'registration_date', 'reference']
          },
          project : {
            columns : ['abbr']
          }
        },
        join : ['patient.project_id=project.id']
      }
    };

    // validate.process(dependencies).then(patientRecords);

    function patientSearch(searchParams) {
      var condition = [];
      if (!searchParams) { return; }

      Object.keys(searchParams)
      .forEach(function(key) {
        if (searchParams[key].length) {
          condition.push('patient.' + key + '=' + searchParams[key], 'AND');
        }
      });
      dependencies.patient.query.where = condition.slice(0, -1);
      validate.refresh(dependencies).then(patientRecords);
    }

    function patientRecords(model) {
      // This is a hack to get date of birth displaying correctly
      $scope.model = model;
      filterNames(model.patient.data);
    }

    function filterNames(patientData) {
      patientData.forEach(function(patient) {

        // Full name
        patient.name = patient.first_name + ' ' + patient.last_name;

        // Human readable ID
        patient.hr_id = patient.abbr.concat(patient.reference);
      });
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
  }
]);
