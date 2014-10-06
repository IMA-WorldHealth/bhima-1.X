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

    var session = $scope.session = { };

    session.timestamp = new Date();
    session.originLocationUuid = null;
    session.currentLocationUuid = null;

    // Hack
    session.defaultLocationLoaded = false;

    session.failedSessionValidation = false;
    $scope.patient = {};
    $scope.origin = {};
    $scope.current = {};

    // Validation configuration objects
    var validation = $scope.validation = {};
    validation.dates = {
      flag : false,
      tests : {
        type : {
          flag : false,
          message : 'PATIENT_REGISTRATIONS.INCORRECT_DATE_TYPE'
        },
        limit : {
          flag : false,
          message : 'PATIENT_REGISTRATIONS.INCORRECT_DATE_LIMIT'
        }
      }
    };

    validation.locations = {
      flag : false,
      tests : {
        current : {
          flag : false,
          message : 'PATIENT_REGISTRATIONS.INCORRECT_LOCATION_CURRENT'
        },
        origin : {
          flag : false,
          message : 'PATIENT_REGISTRATIONS.INCORRECT_LOCATION_ORIGIN'
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
      console.log('Model is: ', model);
      angular.extend($scope, model);
      return $q.when();
    }

    // Tests in an ng-disabled method often got called in the wrong order/ scope was not updated
    $scope.$watch('patient.dob', function (nval, oval) {
      customValidation();
    }, true);

    $scope.$watch('session', function (nval, oval) {
      customValidation();
    }, true);

    function validateLocations() {
      validation.locations.flag = false;

      // Wait for directives to initialise
      if (!session.defaultLocationLoaded) {
        return false;
      }

      if (!session.originLocationUuid) {
        validation.locations.flag = validation.locations.tests.origin;
        return true;
      }

      if (!session.currentLocationUuid) {
        validation.locations.flag = validation.locations.tests.current;
        return true;
      }

      return false;
    }

    // TODO rename
    // TODO transition to application wide validation, validation objects are defined and parsed by a service
    //  - test method
    //  - flag
    //  - message
    function customValidation() {
      var dates = validateDates();
      var locations = validateLocations();

      session.failedSessionValidation = dates || locations;
      return;
    }

    // Conveluted date validation
    function validateDates() {
      var extractYear = session.yob;
      validation.dates.flag = false;

      if (session.fullDateEnabled) {

        if (!$scope.patient.dob) {
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        extractYear = $scope.patient.dob.getFullYear();
      }

      if (extractYear) {

        if (isNaN(extractYear)) {
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        // Sensible year limits - may need to change to accomidate legacy patients
        if (extractYear > 2014 || extractYear < 1900) {
          validation.dates.flag = validation.dates.tests.limit;
          return true;
        }
      }
      return false;
    }

    // Location methods
    function setOriginLocation(uuid) {
      if (uuid && !session.defaultLocationLoaded) {
        session.defaultLocationLoaded = true;
      }

      session.originLocationUuid = uuid;
    }

    function setCurrentLocation(uuid) {
      if (uuid && !session.defaultLocationLoaded) {
        session.defaultLocationLoaded = true;
      }

      session.currentLocationUuid = uuid;
    }

    $scope.registerPatient = function registerPatient() {
      var patient = $scope.patient;
      patient.current_location_id = session.originLocationUuid;
      patient.origin_location_id = session.currentLocationUuid;
      writePatient(patient);
    };

    $scope.getMaxDate = function getMaxDate () {
      return util.htmlDate(session.timestamp);
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
        return connect.fetch('/visit/' + patientId);
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
    $scope.$watch('session.yob', function (nval) {
      // Angular 1.3.0-beta.3 fixes date issues, now works with raw object
      $scope.patient.dob = nval && nval.length === 4 ? new Date(nval + '-' + defaultBirthMonth) : undefined;
    });

    $scope.enableFullDate = function enableFullDate() {
      session.fullDateEnabled = true;
    };

    $scope.loadPatient = function loadPatient(patient) {
      // very, very basic.
      connect.fetch('/visit/' + patient.uuid)
      .then(function () {
        //Patient visit has been logged
        messenger.success($translate.instant('RENEWAL.SUCCESS_MESSAGE'));
        $location.path('invoice/patient/' + patient.uuid); // Niave
      })
      .catch(function () {
        //Patient visit log failed
        messenger.danger($translate.instant('RENEWAL.FAILURE_MESSAGE'));
      })
      .finally();
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

  }
]);
