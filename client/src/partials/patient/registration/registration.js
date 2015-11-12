angular.module('bhima.controllers')
.controller('patientRegistration', patientRegistration);

patientRegistration.$inject = [
  '$scope', '$q', '$location', '$translate', 'connect', 'messenger',
  'validate', 'appstate', 'util', 'uuid', 'SessionService'
];

function patientRegistration ($scope, $q, $location, $translate, connect, messenger, validate, appstate, util, uuid, Session) {

    var dependencies = {},
        defaultBirthMonth = '06-01',
        timestamp = new Date(),
        minYear = util.minPatientDate.getFullYear(),
        maxYear = timestamp.getFullYear(),
        session = $scope.session = { };

    session.timestamp = timestamp;
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
        tables : { 'debitor_group' : { 'columns' : ['uuid', 'name', 'note']}},
        where  : ['debitor_group.locked=0']
      }
    };

    function patientRegistration(model) {
      angular.extend($scope, model);

      // Update the year limit message (has to be done late to use current language)
      validation.dates.tests.limit.message = $translate.instant(validation.dates.tests.limit.message)
        .replace('<min>', minYear)
        .replace('<max>', maxYear);

      return $q.when();
    }

    function checkingExistPatient (file_number) {
      var def = $q.defer();

      if (file_number === 0 || file_number === '0') {
        def.resolve(false);
      } else {
        var query = {
          tables : {
            patient : { columns : ['uuid'] }
          },
          where  : ['patient.hospital_no=' + file_number]
        };
        connect.fetch(query)
        .then(function (res) {
          def.resolve(res.length !== 0);
        });
      }
      return def.promise;
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

    // Convoluted date validation
    function validateDates() {
      var yearOfBirth = session.yob;
      validation.dates.flag = false;

      if (session.fullDateEnabled) {

        if (!$scope.patient.dob) {
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        yearOfBirth = $scope.patient.dob.getFullYear();
      }

      if (yearOfBirth) {

	// NOTE: The following checks on the yearOfBirth are never executed with
	//       the html5+angular date input field since the form value becomes
	//       undefined when invalid and is caught by the previous check.
	//       Leaving them in as a precaution in case the input form behavior
	//       changes in the future.

        if (isNaN(yearOfBirth)) {
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        // Sensible year limits - may need to change to accomidate legacy patients
        if (yearOfBirth > maxYear || yearOfBirth < minYear) {
          validation.dates.flag = validation.dates.tests.limit;
          return true;
        }
      }
      return false;
    }

    // Define limits for DOB
    $scope.minDOB = util.htmlDate(util.minPatientDate);
    $scope.maxDOB = util.htmlDate(timestamp);

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

      checkingExistPatient(patient.hospital_no)
      .then(function (is_exist) {
        if (!is_exist) {
          writePatient(patient);
        } else {
          messenger.info(String($translate.instant('UTIL.PATIENT_EXIST_A')).concat(patient.hospital_no, $translate.instant('UTIL.PATIENT_EXIST_B')), true);
        }
      });
    };

    function writePatient(patient) {
      var debtorId = uuid(), patientId = uuid();
      var packageDebtor = {
        uuid : debtorId,
        group_uuid : $scope.debtor.debtor_group.uuid,
        text : 'Debtor ' + patient.last_name + ' ' + patient.middle_name + ' ' + patient.first_name,
      };

      var packagePatient = connect.clean(patient);
      packagePatient.dob = util.sqlDate(packagePatient.dob);
      packagePatient.uuid = patientId;
      packagePatient.project_id = $scope.project.id;
      packagePatient.reference = 1; // FIXME/TODO : This is a hack

      // Normalize the patient names
      packagePatient.first_name = util.normalizeName(packagePatient.first_name);
      packagePatient.last_name = util.normalizeName(packagePatient.last_name);
      packagePatient.middle_name = util.normalizeName(packagePatient.middle_name);
      packagePatient.father_name = util.normalizeName(packagePatient.father_name);
      packagePatient.mother_name = util.normalizeName(packagePatient.mother_name);
      packagePatient.spouse = util.normalizeName(packagePatient.spouse);
      packagePatient.title = util.normalizeName(packagePatient.title);

      connect.post('debitor', [packageDebtor])
      .then(function () {
        packagePatient.debitor_uuid = debtorId;
        return connect.post('patient', [packagePatient]);
      })
      .then(function () {
        return connect.fetch('/visit/' + patientId);
      })
      .then(function (data) {
        var packageHistory = {
          uuid : uuid(),
          debitor_uuid : packagePatient.debitor_uuid,
          debitor_group_uuid : $scope.debtor.debtor_group.uuid,
          user_id : Session.user.id
        };
        return connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]);
      })
      .then(function () {
        $location.path('invoice/patient/' + packagePatient.uuid);
      });
    }

    // Utility methods
    $scope.$watch('session.yob', function (nval) {
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
