angular.module('bhima.controllers')
.controller('patientRegistration', [
  '$scope',
  '$q',
  '$location',
  '$translate',
  'connect',
  'messenger',
  'validate',
  'appstate',
  'util',
  'uuid',
  function ($scope, $q, $location, $translate, connect, messenger, validate, appstate, util, uuid) {

    var dependencies = {},
        defaultBirthMonth = '06-01';

    $scope.assignation = {};
    $scope.sessionProperties = { timestamp : new Date() };
    $scope.patient = {};
    $scope.origin = {};
    $scope.current = {};

    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : { 'debitor_group' : { 'columns' : ['uuid', 'name', 'note']}}
      }
    };

    dependencies.register = {
      query : 'user_session'
    };


    var locationDictionary = ['village', 'sector', 'province', 'country'];
    var locationRelationshipOrigin = $scope.locationRelationshipOrigin = {
      village : {
        value : null,
        dependency : null,
        requires : 'sector',
        label : 'name'
      },
      sector : {
        value : null,
        dependency : 'village',
        requires : 'province',
        label : 'name'
      },
      province : {
        value : null,
        dependency : 'sector',
        requires : 'country',
        label : 'name'
      },
      country : {
        value : null,
        dependency : 'province',
        requires : null,
        label : 'country_en'
      }
    };

    var locationRelationshipCurrent = $scope.locationRelationshipCurrent = {
      village : {
        value : null,
        dependency : null,
        requires : 'sector',
        label : 'name'
      },
      sector : {
        value : null,
        dependency : 'village',
        requires : 'province',
        label : 'name'
      },
      province : {
        value : null,
        dependency : 'sector',
        requires : 'country',
        label : 'name'
      },
      country : {
        value : null,
        dependency : 'province',
        requires : null,
        label : 'country_en'
      }
    };

    var locationStoreOrigin = $scope.locationStoreOrigin = {};
    var locationStoreCurrent = $scope.locationStoreCurrent = {};

    function patientRegistration(model) {
      angular.extend($scope, model);
      return $q.when();
    }

    /*
    function handlePatientImage() {

      //FIXME This is super cheeky in angular - create a directive for this
      var video = document.querySelector('#patientImage'), patientResolution = { video : { mandatory : { minWidth: 300, maxWidth: 400 } } };

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

      function videoError(error) {
        //throw error;
        //console.error(error);
      }

      function handleVideo(stream) {
        video.src = window.URL.createObjectURL(stream);
      }

      if (navigator.getUserMedia) {
        navigator.getUserMedia(patientResolution, handleVideo, videoError);
      }
    }
    */

    $scope.registerPatient = function registerPatient() {

      if (util.isDateAfter($scope.patient.dob, new Date())) {
        return messenger.warn($translate('PATIENT_REG.INVALID_DATE'), 6000);
      }

      var patient = $scope.patient;
      patient.current_location_id = $scope.locationRelationshipCurrent.village.value;
      patient.origin_location_id = $scope.locationRelationshipOrigin.village.value;
      writePatient(patient);
    };

    $scope.getMaxDate = function getMaxDate () {
      return util.htmlDate($scope.sessionProperties.timestamp);
    };

    function writePatient(patient) {
      var debtorId = uuid(), patientId = uuid();
      var packageDebtor = {
        uuid : debtorId,
        group_uuid : $scope.debtor.debtor_group.uuid,
        text : 'Debtor ' + patient.first_name + ' ' + patient.last_name,
      };

      var packagePatient = connect.clean(patient);
      packagePatient.uuid = patientId;
      packagePatient.project_id = $scope.project.id;
      packagePatient.reference = 1; // FIXME/TODO : This is a hack

      connect.basicPut('debitor', [packageDebtor])
      .then(function () {
        packagePatient.debitor_uuid = debtorId;
        return connect.basicPut('patient', [packagePatient]);
      })
      .then(function () {
        return connect.fetch('/visit/\'' + patientId + '\'');
      })
      .then(function () {
        return connect.fetch('/user_session');
      })
      .then(function (data) {
        var packageHistory = {
          uuid : uuid(),
          debitor_uuid : packagePatient.debitor_uuid,
          debitor_group_uuid : $scope.debtor.debtor_group.uuid,
          user_id : data.id // FIXME: can this be done on the server?
        };
        return connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]);
      })
      .then(function () {
        $location.path('invoice/patient/' + packagePatient.uuid);
      });
    }

    // Utility methods
    $scope.$watch('sessionProperties.yob', function (nval) {
      // Angular 1.3.0-beta.3 fixes date issues, now works with raw object
      $scope.patient.dob = nval && nval.length === 4 ? new Date(nval + '-' + defaultBirthMonth) : undefined;
    });

    $scope.enableFullDate = function enableFullDate() {
      $scope.sessionProperties.fullDateEnabled = true;
    };

    function handleError(err) {
      messenger.danger('An Error Occured : ' + JSON.stringify(err));
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(patientRegistration)
      .then(handleLocation)
      .catch(handleError);
    });

    function defineLocationDependency() {
      locationDictionary.forEach(function (key) {
        var locationQuery;
        var label = locationRelationshipOrigin[key].label;
        var locationDetails = locationRelationshipOrigin[key];

        locationQuery = dependencies[key] = {
          query : {
            identifier : 'uuid',
            tables : {},
            order : [label]
          }
        };
        locationQuery.query.tables[key] = {
          columns : ['uuid', label]
        };

        if (locationDetails.requires) {
          locationQuery.query.tables[key].columns.push(
            formatLocationIdString(locationDetails.requires)
            );
        }
      });
    }

    function initialiseLocation(locationId) {
      connect.fetch('/location/' + locationId)
      .then(function (defaultLocation) {
        defaultLocation = defaultLocation[0];
        locationDictionary.forEach(function (key) {
          locationRelationshipOrigin[key].value = defaultLocation[formatLocationIdString(key)];
          locationRelationshipCurrent[key].value = defaultLocation[formatLocationIdString(key)];
        });

        updateOriginLocation('country', null);
        updateCurrentLocation('country', null);
      });
    }


    function handleLocation () {
      // // webcams for the win
      // // handlePatientImage();
      defineLocationDependency();
      initialiseLocation($scope.project.location_id);
    }

    function formatLocationIdString(target) {
      var uuidTemplate = '_uuid';
      return target.concat(uuidTemplate);
    }

    function updateOriginLocation (key, uuidDependency) {
      var dependency = locationRelationshipOrigin[key].dependency;

      if (!uuidDependency && locationRelationshipOrigin[key].requires) {
        locationStoreOrigin[key] = { data : [] };

        if (dependency) { updateOriginLocation(dependency, null); }
        return;
      }

      if (uuidDependency) {
        dependencies[key].query.where = [key + '.' + locationRelationshipOrigin[key].requires + '_uuid=' + uuidDependency];
      }

      validate.refresh(dependencies, [key])
      .then(function (result) {
        locationStoreOrigin[key] = result[key];
        var currentValue = locationStoreOrigin[key].get(locationRelationshipOrigin[key].value);

        // FIXME
        if (currentValue) { currentValue = currentValue.uuid; }

        if (!currentValue) {
          if (locationStoreOrigin[key].data.length) {
            // TODO Should be sorted alphabetically, making this the first value
            currentValue = locationRelationshipOrigin[key].value = locationStoreOrigin[key].data[0].uuid;
          }
        }

        locationRelationshipOrigin[key].value = currentValue;

        // Download new data, try and match current value to currently selected, if not select default
        if (dependency) {
          updateOriginLocation(dependency, currentValue);
        }
      });
    }

    function updateCurrentLocation (key, uuidDependency) {
      //we can have one method for orin and current, but for now it seems clear to separate them
      var dependency = locationRelationshipCurrent[key].dependency;

      if (!uuidDependency && locationRelationshipCurrent[key].requires) {
        locationStoreCurrent[key] = { data : [] };

        if (dependency) { updateCurrentLocation(dependency, null); }
        return;
      }

      if (uuidDependency) {
        dependencies[key].query.where = [key + '.' + locationRelationshipCurrent[key].requires + '_uuid=' + uuidDependency];
      }

      validate.refresh(dependencies, [key])
      .then(function (result) {
        locationStoreCurrent[key] = result[key];

        var currentValue = locationStoreCurrent[key].get(locationRelationshipCurrent[key].value);

        // FIXME
        if (currentValue) { currentValue = currentValue.uuid; }

        if (!currentValue) {
          if (locationStoreCurrent[key].data.length) {
            // TODO Should be sorted alphabetically, making this the first value
            currentValue = locationRelationshipCurrent[key].value = locationStoreCurrent[key].data[0].uuid;
          }
        }

        locationRelationshipCurrent[key].value = currentValue;

        // Download new data, try and match current value to currently selected, if not select default
        if (dependency) {
          updateCurrentLocation(dependency, currentValue);
        }
      });
    }

    $scope.updateOriginLocation = updateOriginLocation;
    $scope.updateCurrentLocation = updateCurrentLocation;
  }
]);
