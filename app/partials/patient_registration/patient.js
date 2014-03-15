angular.module('kpk.controllers')
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
  function($scope, $q, $location, $translate, connect, messenger, validate, appstate, util, uuid) {

    var dependencies = {},
        defaultBirthMonth = '06-01';

    $scope.assignation = {};
    $scope.sessionProperties = {};
    $scope.patient = {};

    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : {'debitor_group' : {'columns' : ['uuid', 'name', 'note']}}
      }
    };

    dependencies.village = {
      query : {
        identifier : 'uuid',
        tables : { 'village' : { 'columns' : ['uuid', 'name', 'sector_uuid'] }}
      }
    };

    dependencies.sector = {
      query : {
        identifier : 'uuid',
        tables : { 'sector' : { 'columns' : ['uuid', 'name', 'province_uuid'] }}
      }
    };

    dependencies.province = {
      query : {
        identifier : 'uuid',
        tables : { 'province' : { 'columns' : ['uuid', 'name', 'country_uuid'] }}
      }
    };

    dependencies.country = {
      query : {
        identifier : 'uuid',
        tables : { 'country' : { 'columns' : ['uuid', 'country_en', 'country_fr'] }}
      }
    };

    dependencies.register = {
      query : 'user_session'
    };

    function patientRegistration(model) {
      for (var k in model) { $scope[k] = model[k]; }

      // set up location models
      $scope.current = {};
      $scope.origin = {};

      // webcams for the win
      // handlePatientImage();

      // set the $scope.origin and $scope.current location variables
      ['origin', 'current']
      .forEach(function (param) {
        $scope[param].village = $scope.village.get($scope.project.location_id);
        $scope[param].sector = $scope.sector.get($scope[param].village.sector_uuid);
        $scope[param].province = $scope.province.get($scope[param].sector.province_uuid);
        $scope[param].country = $scope.country.get($scope[param].province.country_uuid);
      });

    }

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

    $scope.registerPatient = function registerPatient() {

      if (util.isDateAfter($scope.patient.dob, new Date())) {
        return messenger.warning($translate('PATIENT_REG.INVALID_DATE'), 6000);
      }

      // This is overly verbose, but works and is clean
      var defer = $q.defer();
      // if the villages are strings, create database entries for them
      if (angular.isString($scope.origin.village) && angular.isString($scope.current.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.id, 'origin')
        .then(function () {
          return createVillage($scope.current.village, $scope.current.sector.id, 'current');
        })
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.origin.village)) {
        createVillage($scope.origin.village, $scope.origin.sector.id, 'origin')
        .then(function () {
          defer.resolve();
        });
      } else if (angular.isString($scope.current.village)) {
        createVillage($scope.current.village, $scope.current.sector.id, 'current')
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


    function createVillage(village, sector_uuid, writeTo) {
      return connect.basicPut('village', [{
        name : village,
        sector_uuid : sector_uuid
      }])
      .success(function(success) {
        $scope[writeTo].village = {
          name : name,
          sector_uuid : sector_uuid,
          id : success.insertId
        };
      })
      .error(function(err) {
        messenger.danger('An Error occured writing the village');
      });
    }

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

      connect.basicPut('debitor', [packageDebtor])
      .then(function(result) {
        packagePatient.debitor_uuid = debtorId;
        return connect.basicPut('patient', [packagePatient]);
      })
      .then(function(result) {
        return connect.fetch('/visit/\"' + patientId + '\"');
      })
      .then(function (result) {
        var packageHistory = {
          uuid : uuid(),
          debitor_uuid : packagePatient.debitor_uuid,
          debitor_group_uuid : $scope.debtor.debtor_group.uuid,
          user_id : 1 // FIXME: can this be done on the server?
        };
        return connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]);
      })
      .then(function (result) {
        $location.path('invoice/patient/' + packagePatient.uuid);
      })
      .catch(function (err) {
        messenger.danger('An error occured:' + JSON.stringify(err));
      });
    }

    //Utility methods
    $scope.$watch('sessionProperties.yob', function(nval) {
      if(nval && nval.length===4) $scope.patient.dob = nval + '-' + defaultBirthMonth;
    });

    $scope.enableFullDate = function enableFullDate() {
      $scope.sessionProperties.fullDateEnabled = true;
    };

    function handleError (err) {
      messenger.danger('An Error Occured : ' + JSON.stringify(err));
    }

    // invocation

    appstate.register('project', function(project){
      $scope.project = project;
      validate.process(dependencies)
      .then(patientRegistration, handleError);
    });

  }
]);
