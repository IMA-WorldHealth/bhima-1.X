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
    var locationRelationship = $scope.locationRelationship = {
      village : {
        value : null,
        dependency : null,
        requires : 'sector',
        columns : ['uuid', 'name', 'sector_uuid']
      },
      sector : {
        value : null,
        dependency : 'village',
        requires : 'province',
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
    var locationStore = $scope.locationStore = {};
  
    appstate.register('project', function (project) {
      defineLocationDependency();
      initialiseLocation(project.location_id);
    });
    
    function defineLocationDependency() {
      locationDictionary.forEach(function (key) {
        dependencies[key] = {
          query : {
            identifier : 'uuid',
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


        console.log(locationRelationship);
        console.log('got defaultLocation', defaultLocation);


        updateLocation('country', null);
      });
      // console.log(dependencies);
      // validate.process(dependencies, locationDictionary).then(function (model) { 
      //   console.log('got', model);
      // });
    }

    function updateLocation(key, uuidDependency) { 
      var dependency = locationRelationship[key].dependency;
      var currentValue;
     
      console.log('update location for ', key, 'given dependency', uuidDependency);
      if (!uuidDependency && locationRelationship[key].requires) {
        console.log('no dependency received', key, 'requires ', locationRelationship[key].requires);
        locationStore[key] = { data : [] };
        // locationStore[key].data = [];
        // locationStore[key].recalculateIndex();

        if (dependency) updateLocation(dependency, null);
        return;
      }
    
      // Not for country
      if (uuidDependency) {
        console.log('flag', locationRelationship[key].requires, uuidDependency);
        dependencies[key].query.where = [key + '.' + locationRelationship[key].requires + '_uuid=' + uuidDependency];
      }

      validate.refresh(dependencies, [key]).then(function (result) {
        locationStore[key] = result[key];
      
        // Check to see if there are any values - if there aren't all future dependencies will also be empty

        // Check to see if current value exists in list
        console.log('checking default value', locationRelationship[key].value);
        currentValue = locationStore[key].get(locationRelationship[key].value);

        // FIXME 
        if (currentValue) currentValue = currentValue.uuid;
       
        console.log('locationStore', locationStore[key]);
        if (!currentValue) { 
          if (locationStore[key].data.length) {
            // TODO Should be sorted alphabetically, making this the first value
            currentValue = locationRelationship[key].value = locationStore[key].data[0].uuid;
          }
        }
      
        locationRelationship[key].value = currentValue;

        console.log('done', locationStore);
        // Download new data, try and match current value to currently selected, if not select default
        if (dependency) {
          console.log('updating ', key, 'should now call update', dependency, 'with', currentValue);
          updateLocation(dependency, currentValue);
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

    $scope.updateLocation = updateLocation;
  }
]);
