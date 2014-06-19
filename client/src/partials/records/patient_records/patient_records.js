angular.module('bhima.controllers')
.controller('patientRecords', [
  '$scope',
  'validate',
  'appstate',
  'connect', 
  function($scope, validate, appstate, connect) {
    var dependencies = {}, session = $scope.session = {};
  
    session.searchLocation = false;

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
    
    var locationDictionary = ['village', 'sector', 'province', 'country'];
    var locationRelationship = {
      village : {
        dependency : 'sector',
        columns : ['uuid', 'name', 'sector_uuid']
      },
      sector : {
        dependency : 'province',
        columns : ['uuid', 'name', 'province_uuid']
      },
      province : {
        dependency : 'country',
        columns : ['uuid', 'name', 'country_uuid']
      },
      country : {
        dependency : null,
        columns : ['uuid', 'country_en', 'country_fr']
      }
    };

    defineLocationDependency();
    refreshLocation(null);
    
    function defineLocationDependency() {
      locationDictionary.forEach(function (key) {
        dependencies[key] = {
          query : {
            tables : {}
          }
        };
        dependencies[key].query.tables[key] = {
          columns : locationRelationship[key].columns
        };
        dependencies[key].query.where = [locationRelationship[key].dependency + '_uuid'];
      });
    }

    function refreshLocation(locationId) { 
      
      validate.process(dependencies, locationDictionary).then(function (model) { 
        console.log('got', model);
      });
    }


    // validate.process(dependencies).then(patientRecords);
    // function initialiseLocationParams() {
      // var 
    // }

    function patientSearch(searchParams) {
      var condition = [], params = angular.copy(searchParams);
      if (!searchParams) { return; }
      
      // Filter date search 
      Object.keys(params)
      .forEach(function(key) {
        if (searchParams[key].length) {
          condition.push('patient.' + key + '=' + searchParams[key], 'AND');
        }
      });
      console.log('condition', condition);

      // FIXME Remove final AND 
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
