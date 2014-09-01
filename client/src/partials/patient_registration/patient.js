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

    var dependencies = {};
    var defaultBirthMonth = '06-01';
    
    var originLocationUuid, currentLocationUuid;
  
    // TODO rename session
    $scope.sessionProperties = { timestamp : new Date() };
    $scope.sessionProperties.originLocationUuid = null;
    $scope.sessionProperties.currentLocationUuid = null;

    $scope.sessionProperties.failedSessionValidation = false;
    $scope.patient = {};
    $scope.origin = {};
    $scope.current = {};

    var validation = $scope.validation = {};
    validation.dates = { 
      flag : false,
      tests : { 
        type : { 
          flag : false,
          message : "REGISTRATION.INCORRECT_DATE_TYPE"
        },
        limit : { 
          flag : false,
          message : "REGISTRATION.INCORRECT_DATA_LIMIT" 
        }
      }
    };

    validation.locations = { 
      flag : false,
      tests : { 
        current : { 
          flag : false,
          message : "REGISTRATION.INCORRECT_LOCATION_CURRENT"
        },
        origin : { 
          flag : false,
          message : "REGISTRATION.INCORRECT_LOCATION_ORIGIN"
        }
      }
    };

    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : { 'debitor_group' : { 'columns' : ['uuid', 'name', 'note']}}
      }
    };

    dependencies.register = {
      query : 'user_session'
    };

    function patientRegistration(model) {
      angular.extend($scope, model);
      return $q.when();
    }

    function validateFields() { 
      console.log('validateFields');
      return false;
    }
   
    // Tests in an ng-disabled method often got called in the wrong order/ scope was not updated
    $scope.$watch('patient.dob', function (nval, oval) { 
      customValidation();
    }, true);

    $scope.$watch('sessionProperties', function (nval, oval) { 
      customValidation(); 
    }, true);
  
    function validateLocations() { 
      validation.locations.flag = false;
      if (!$scope.sessionProperties.originLocationUuid) { 
        validation.locations.flag = validation.locations.tests.origin;
        return true;
      }

      if (!$scope.sessionProperties.currentLocationUuid) { 
        validation.locations.flag = validation.locations.tests.current;
        return true;
      }

      return false;
    }
  
    // TODO rename
    function customValidation() { 
      var dates = validateDates();
      var locations = validateLocations();

      $scope.sessionProperties.failedSessionValidation = dates || locations;
      return;
    }

    // Conveluted date validation 
    function validateDates() { 
      console.log('vd', $scope.sessionProperties.dob);
      var extractYear = $scope.sessionProperties.yob;  
      validation.dates.flag = false;
      
      if ($scope.sessionProperties.fullDateEnabled) { 
  
        if (!$scope.patient.dob) { 
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        extractYear = $scope.patient.dob.getFullYear();
        console.log($scope.patient.dob);
      }

      // FIXME Horrible branching structure 
      if (extractYear) { 
       
        if (isNaN(extractYear)) { 
          validation.dates.flag = validation.dates.tests.type;

          console.log('setting flag', validation.dates.flag);
          return true;
        }

        if (extractYear > 2014 || extractYear < 1900) { 
          validation.dates.flag = validation.dates.tests.limit;
          return true;
        }  
      }

      return false;
    }

    // Location methods
    function setOriginLocation(uuid) { 
      $scope.sessionProperties.originLocationUuid = uuid;
    }

    function setCurrentLocation(uuid) { 
      $scope.sessionProperties.currentLocationUuid = uuid;
    }

    $scope.registerPatient = function registerPatient() {

      if (util.isDateAfter($scope.patient.dob, new Date())) {
        return messenger.warn($translate('PATIENT_REG.INVALID_DATE'), 6000);
      }

      if (!originLocationUuid || !currentLocationUuid) { 
        return messenger.warn("Invalid location - validation required", 6000);
      }

      var patient = $scope.patient;
      patient.current_location_id = originLocationUuid;
      patient.origin_location_id = currentLocationUuid;
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
      packagePatient.dob = util.sqlDate(packagePatient.dob);
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
      .catch(handleError);
    });

    $scope.setOriginLocation = setOriginLocation;
    $scope.setCurrentLocation = setCurrentLocation;
    $scope.validateFields = validateFields;
  }
]);
