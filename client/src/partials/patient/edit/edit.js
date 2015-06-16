angular.module('bhima.controllers')
.controller('patientEdit', [
  '$scope',
  '$routeParams',
  '$translate',
  'connect',
  'validate',
  'messenger',
  'util',
  'appstate',
  function ($scope, $routeParams, $translate, connect, validate, messenger, util, appstate) {
    var dependencies = {},
        originalPatientData = null,
        patientUuid = $routeParams.patientID,
        timestamp = new Date(),
        minYear = util.minPatientDate.getFullYear(),
        maxYear = timestamp.getFullYear(),
        session = $scope.session = {},
        editableFields = [
    'first_name', 'last_name', 'dob', 'sex', 'father_name', 'mother_name', 'title',
    'profession', 'employer', 'marital_status', 'spouse', 'spouse_profession', 'spouse_employer', 'notes',
    'religion', 'phone', 'email', 'address_1', 'address_2', 'origin_location_id', 'current_location_id', 'middle_name', 'hospital_no'
    ];

    // Initialise the session
    session.mode = 'search';
    session.failedSessionValidation = false;

    // Add fake initial values to keep the form happy before the real values are available
    $scope.patient = { origin_location_id: null, current_location_id: null };
    $scope.initialOriginLocation = null;
    $scope.initialCurrentLocation = null;

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

    // Set up the query for the patient data
    dependencies.patient = {
      query : {
        identifier : 'uuid',
        tables : {
          'patient' : {
            columns : editableFields.concat(['uuid', 'reference', 'registration_date'])
          },
          'debitor' : {
            columns : ['uuid::debitor_uuid', 'group_uuid::debitor_group_id', 'text::debitor_name']
          },
          'debitor_group' : {
            columns : ['name::debitor_group_name']
          },
                'project' : {
                  columns : ['abbr::project_abbr']
                }
        },
        join : [ 'patient.debitor_uuid=debitor.uuid',
           'debitor.group_uuid=debitor_group.uuid',
           'patient.project_id=project.id'
               ],
        where : [ 'patient.uuid=' +  patientUuid ]
      }
    };

    // We need the debitor group info
    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : {
          'debitor_group' : {
          'columns' : ['uuid', 'name']
          }
        }
      }
    };

    // Define limits for DOB
    $scope.minDOB = util.htmlDate(util.minPatientDate);
    $scope.maxDOB = util.htmlDate(timestamp);

    // Location methods
    $scope.setOriginLocation = function (uuid) {
      $scope.patient.origin_location_id = uuid;
    };

    $scope.setCurrentLocation = function (uuid) {
      $scope.patient.current_location_id = uuid;
    };


    // Validate the dates and locations
    function customValidation() {
      var badDOB = invalidDOB();
      var badLocations = invalidLocations();

      session.failedSessionValidation = badDOB || badLocations;
      return;
    }

    // Validate the origin/current locations
    function invalidLocations() {
      validation.locations.flag = false;

      if (!$scope.patient.origin_location_id) {
        validation.locations.flag = validation.locations.tests.origin;
        return true;
      }

      if (!$scope.patient.current_location_id) {
        validation.locations.flag = validation.locations.tests.current;
        return true;
      }

      return false;
    }


    // Convoluted date validation
    function invalidDOB() {
      validation.dates.flag = false;

      if (typeof $scope.patient === 'undefined' ||
          typeof $scope.patient.dob === 'undefined' || !$scope.patient.dob) {
        validation.dates.flag = validation.dates.tests.type;
        return true;
      }

      // NOTE: The following checks on the yearOfBirth are never executed with
      //       the html5+angular date input field since the form value becomes
      //       undefined when invalid and is caught by the previous check.
      //       Leaving them in as a precaution in case the input form behavior
      //       changes in the future.
      var yearOfBirth = $scope.patient.dob.getFullYear();

      if (isNaN(yearOfBirth)) {
        validation.dates.flag = validation.dates.tests.type;
        return true;
      }

      // Sensible yearOfBirth limits - may need to change to accomodate legacy patients
      if (yearOfBirth > maxYear || yearOfBirth < 1900) {
        validation.dates.flag = validation.dates.tests.limit;
        return true;
      }

      return false;
    }


    // Tests in an ng-disabled method often got called in the wrong order/ scope was not updated
    $scope.$watch('session', function (nval, oval) {
      customValidation();
    }, true);

    $scope.$watch('patient.dob', function (nval, oval) {
      customValidation();
    }, true);

    $scope.$watch('patient.origin_location_id', function (nval, oval) {
      customValidation();
    });

    $scope.$watch('patient.current_location_id', function (nval, oval) {
      customValidation();
    });

    // Function to switch back to search mode (and reset the search)
    $scope.restartSearch = function () {
      originalPatientData = null;
      $scope.patient = { origin_location_id: null, current_location_id: null };
      $scope.initialOriginLocation = null;
      $scope.initialCurrentLocation = null;
      validate.clear(dependencies, ['patient']); // So future patient query gets processed
      session.mode = 'search';
    };

    // Function to switch to the edit mode
    $scope.initialiseEditing = function initialiseEditing(selectedPatient) {
      if (selectedPatient && 'uuid' in selectedPatient && selectedPatient.uuid) {
        patientUuid = selectedPatient.uuid;
        dependencies.patient.query.where[0] = 'patient.uuid=' + patientUuid;
        validate.process(dependencies)
        .then(startup);
        session.mode = 'edit';
      }
    };

    // Main function to save the updated patient data to the database
    $scope.updatePatient = function () {
      var patient = connect.clean(angular.copy($scope.patient));

      var packageDebtor = {
        text : 'Debtor ' + patient.last_name + ' ' + patient.middle_name + ' ' + patient.first_name,
        uuid : patient.debitor_uuid
      };

      // debitorUuid = patient.debitor_uuid;
      // Make sure the DOB is in SQL format
      patient.dob = util.sqlDate(patient.dob);

      // Normalize the patient names (just in case they have been changed)
      patient.first_name = util.normalizeName(patient.first_name);
      patient.last_name = util.normalizeName(patient.last_name);
      patient.middle_name = util.normalizeName(patient.middle_name);
      patient.father_name = util.normalizeName(patient.father_name);
      patient.mother_name = util.normalizeName(patient.mother_name);
      patient.spouse = util.normalizeName(patient.spouse);
      patient.title = util.normalizeName(patient.title);

      // Get rid of any extraneous fields
      delete patient.reference;
      delete patient.registration_date;
      delete patient.debitor_group_id;
      delete patient.debitor_name;
      delete patient.debitor_group_name;
      delete patient.project_abbr;
      delete patient.hr_id;

      // Enable blank overwrites
      editableFields.forEach(function (fname) {
        if (originalPatientData[fname] && !(patient[fname])) {
          patient[fname] = null;
        }
      });

      // Save the patient data
      connect.put('patient', [patient], ['uuid'])
      .then(function () {
        connect.put('debitor', [packageDebtor], ['uuid']);
      })
      .then(function () {
        messenger.success($translate.instant('PATIENT_EDIT.UPDATE_SUCCESS'));
      })
      .catch(function (err) {
        messenger.danger($translate.instant('PATIENT_EDIT.UPDATE_FAILED'));
        console.log(err);
      });

      session.mode = 'edit';
    };

    // Basic setup function when the models are loaded
    function startup (models) {
      var patient = $scope.patient = models.patient.data[0];
      originalPatientData = angular.copy(patient);

      patient.dob = new Date(patient.dob);
      patient.hr_id = patient.project_abbr.concat(patient.reference);

      $scope.initialOriginLocation = patient.origin_location_id;
      $scope.initialCurrentLocation = patient.current_location_id;

      $scope.debtorGroup = models.debtorGroup;

      // Update the year limit message (has to be done late to use current language)
      validation.dates.tests.limit.message = $translate.instant(validation.dates.tests.limit.message)
        .replace('<min>', minYear)
  .replace('<max>', maxYear);
    }


    // Register this controller
    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      session.mode = 'search';
      if (patientUuid) {
  session.mode = 'edit';
  validate.process(dependencies)
    .then(startup);
      }
    });

  }

]);
