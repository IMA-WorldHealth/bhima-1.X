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
        value : null,
        requires : 'sector',
        dependency : null,
        columns : ['uuid', 'name', 'sector_uuid']
      },
      sector : {
        value : null,
        requires : 'village',
        dependency : 'province',
        columns : ['uuid', 'name', 'province_uuid']
      },
      province : {
        value : null,
        dependency : 'sector',
        requires : 'country',
        columns : ['uuid', 'name', 'country_uuid']
      },
      country : {
        value : null,
        dependency : 'province',
        requires : null,
        columns : ['uuid', 'country_en', 'country_fr']
      }
    };
    var locationStore = {};
  
    appstate.register('project', function (project) {
      defineLocationDependency();
      initialiseLocation(project.location_id);
    });
    
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
        // dependencies[key].query.where = [locationRelationship[key].dependency + '_uuid'];
      });
    }

    function initialiseLocation(locationId) {
      
      connect.fetch('/location/' + locationId).then(function (defaultLocation) {
        defaultLocation = defaultLocation[0];

        // Populate initial values
        locationDictionary.forEach(function (key) {
          locationRelationship[key].value = defaultLocation[key + '_uuid'];
        });

        updateLocation('country', null);

        console.log(locationRelationship);
        console.log('got defaultLocation', defaultLocation);
      });
      // console.log(dependencies);
      // validate.process(dependencies, locationDictionary).then(function (model) { 
      //   console.log('got', model);
      // });
    }

    function updateLocation(key, uuidDependency) { 
      var dependency = locationRelationship[key].dependency;
      var currentValue;
      
      if (uuidDependency) {
        dependencies[key].query.where = [locationRelationship[key].requires + '_uuid=' + uuidDependency];
      }

      validate.process(dependencies, [key]).then(function (result) {
        locationStore[key] = result[key];
      

        // Check to see if current value exists in list
        currentValue = locationStore[key].get(locationRelationship[key].value);
        
        if (!currentValue) { 
          // TODO Should be sorted alphabetically, making this the first value
          currentValue = locationRelationship[key].value = locationStore[key].data[0];
        }
        console.log('done', locationStore);
        // Download new data, try and match current value to currently selected, if not select default
        if (dependency) {
          // updateLocation(dependency, currentValue);
        }

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
