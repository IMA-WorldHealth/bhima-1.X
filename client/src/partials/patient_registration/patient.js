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
    $scope.patient = {}; $scope.origin={}; $scope.current={};



    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : {'debitor_group' : {'columns' : ['uuid', 'name', 'note']}}
      }
    };

    dependencies.register = {
      query : 'user_session'
    };


    var locationDictionary = ['village', 'sector', 'province', 'country'];
    var locationRelationship = $scope.locationRelationship = {
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
    var locationStore_origin = $scope.locationStore_origin = {};
    var locationStore_current = $scope.locationStore_current = {};

    // dependencies.village = {
    //   query : {
    //     identifier : 'uuid',
    //     tables : { 'village' : { 'columns' : ['uuid', 'name', 'sector_uuid'] }}
    //   }
    // };

    // dependencies.sector = {
    //   query : {
    //     identifier : 'uuid',
    //     tables : { 'sector' : { 'columns' : ['uuid', 'name', 'province_uuid'] }}
    //   }
    // };

    // dependencies.province = {
    //   query : {
    //     identifier : 'uuid',
    //     tables : { 'province' : { 'columns' : ['uuid', 'name', 'country_uuid'] }}
    //   }
    // };

    // dependencies.country = {
    //   query : {
    //     identifier : 'uuid',
    //     tables : { 'country' : { 'columns' : ['uuid', 'country_en', 'country_fr'] }}
    //   }
    // };



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

      // This is overly verbose, but works and is clean
      var defer = $q.defer();
      // if the villages are strings, create database entries for them
      if (angular.isString($scope.origin.village) && angular.isString($scope.current.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.uuid, 'origin')
        .then(function () {
          return createVillage($scope.current.village, $scope.current.sector.uuid, 'current');
        })
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.origin.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.uuid, 'origin')
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.current.village)) {
        createVillage($scope.current.village, $scope.current.sector.uuid, 'current')
        .then(function () {
          defer.resolve();
        });
      } else {
        defer.resolve();
      }

      defer.promise.then(function () {
        var patient = $scope.patient;

        patient.current_location_id = $scope.current.village.uuid;
        patient.origin_location_id = $scope.origin.village.uuid;
        writePatient(patient);
      });
    };

    function createVillage(village, sector_uuid) {
      return connect.basicPut('village', [{
        uuid : uuid(),
        name : village,
        sector_uuid : sector_uuid
      }]);
    }

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

    // invocation

    appstate.register('project', function (project){
      $scope.project = project;
      validate.process(dependencies)
      .then(patientRegistration)
      .then(handleLocation)
      .catch(handleError);
    });

    function defineLocationDependency() {
      locationDictionary.forEach(function (key) {
        var locationQuery;
        var label = locationRelationship[key].label;
        var locationDetails = locationRelationship[key];

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
      connect.fetch('/location/' + locationId).then(function (defaultLocation) {
        defaultLocation = defaultLocation[0];
        console.log('voici notre defaultLocation', defaultLocation);
        // Populate initial values
        // locationDictionary.forEach(function (key) {
        //   locationRelationship[key].value = defaultLocation[formatLocationIdString(key)];
        // });

        ['origin', 'current']
        .forEach(function (param) {
          $scope[param].village = {name : defaultLocation.village, uuid : defaultLocation.village_uuid};
          $scope[param].sector = {name : defaultLocation.sector, uuid : defaultLocation.sector_uuid}
          $scope[param].province = {name : defaultLocation.province, uuid:defaultLocation.province_uuid}
          $scope[param].country = {country_en : defaultLocation.country, uuid : defaultLocation.country_uuid}
        });
        updateOriginLocation('country', null);
        updateCurrentLocation('country', null);
      });
    }


    function handleLocation (){

      // // set up location models
      // $scope.current = {};
      // $scope.origin = {};

      // // webcams for the win
      // // handlePatientImage();

      // // set the $scope.origin and $scope.current location variables
      // ['origin', 'current']
      // .forEach(function (param) {
      //   $scope[param].village = $scope.village.get($scope.project.location_id);
      //   $scope[param].sector = $scope.sector.get($scope[param].village.sector_uuid);
      //   $scope[param].province = $scope.province.get($scope[param].sector.province_uuid);
      //   $scope[param].country = $scope.country.get($scope[param].province.country_uuid);
      // });

      defineLocationDependency();
      initialiseLocation($scope.project.location_id);

    }

    function formatLocationIdString(target) {
      var uuidTemplate = '_uuid';
      return target.concat(uuidTemplate);
    }

    function refreshOriginModel (key) {
       $scope.origin[key] = locationStore_origin[key].data[0];
    }

    function refreshCurrentModel (key) {
       $scope.current[key] = locationStore_current[key].data[0];
    }

    function updateOriginLocation (key, uuidDependency) {
      var dependency = locationRelationship[key].dependency;

      if (!uuidDependency && locationRelationship[key].requires) {
        locationStore_origin[key] = { data : [] };

        if (dependency) updateOriginLocation(dependency, null);
        return;
      }

      if (uuidDependency) {
        dependencies[key].query.where = [key + '.' + locationRelationship[key].requires + '_uuid=' + uuidDependency];
      }

      validate.refresh(dependencies, [key])
      .then(function (result) {
        locationStore_origin[key] = result[key];
        refreshOriginModel(key);

        currentValue = locationStore_origin[key].get(locationRelationship[key].value);

        // FIXME
        if (currentValue) currentValue = currentValue.uuid;

        if (!currentValue) {
          if (locationStore_origin[key].data.length) {
            // TODO Should be sorted alphabetically, making this the first value
            currentValue = locationRelationship[key].value = locationStore_origin[key].data[0].uuid;
          }
        }

        locationRelationship[key].value = currentValue;

        // Download new data, try and match current value to currently selected, if not select default
        if (dependency) {
          updateOriginLocation(dependency, currentValue);
        }
      });
    }

    function updateCurrentLocation (key, uuidDependency) {
      //we can have one method for orin and current, but for now it seems clear to separate them
      console.log('appelle recue : key :', key, 'uuidDependency : ', uuidDependency);
      var dependency = locationRelationship[key].dependency;

      if (!uuidDependency && locationRelationship[key].requires) {
        locationStore_current[key] = { data : [] };

        if (dependency) updateCurrentLocation(dependency, null);
        return;
      }

      if (uuidDependency) {
        dependencies[key].query.where = [key + '.' + locationRelationship[key].requires + '_uuid=' + uuidDependency];
      }

      validate.refresh(dependencies, [key])
      .then(function (result) {
        locationStore_current[key] = result[key];
        refreshCurrentModel(key);

        currentValue = locationStore_current[key].get(locationRelationship[key].value);

        // FIXME
        if (currentValue) currentValue = currentValue.uuid;

        if (!currentValue) {
          if (locationStore_current[key].data.length) {
            // TODO Should be sorted alphabetically, making this the first value
            currentValue = locationRelationship[key].value = locationStore_current[key].data[0].uuid;
          }
        }

        locationRelationship[key].value = currentValue;

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
