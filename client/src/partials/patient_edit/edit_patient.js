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
        currentYear = timestamp.getFullYear(),
        session = $scope.session = {},
        editableFields = [
	  'first_name', 'last_name', 'dob', 'sex', 'father_name', 'mother_name', 'title',
	  'profession', 'employer', 'marital_status', 'spouse', 'spouse_profession', 'spouse_employer',
	  'religion', 'phone', 'email', 'addr_1', 'addr_2', 'origin_location_id', 'current_location_id'
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
	    columns : ['group_uuid::debitor_group_id', 'text::debitor_name']
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

    // Various functions for the form
    $scope.getMinDate = function getMinDate() {
      // TODO: Define this globally somewhere (same for patient register)
      return '1900-01-01';
    };

    $scope.getMaxDate = function getMaxDate() {
      return util.htmlDate(timestamp);
    };

    $scope.setOriginLocation = function (uuid) {
      $scope.patient.origin_location_id = uuid;
    };
    
    $scope.setCurrentLocation = function (uuid) {
      $scope.patient.current_location_id = uuid;
    };


    // Validate the dates and locations
    function customValidation() {
      var dates = validateDates();
      var locations = validateLocations();

      session.failedSessionValidation = dates || locations;
      return;
    }

    // Validate the origin/current locations
    function validateLocations() {
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
    function validateDates() {
      validation.dates.flag = false;

      if (typeof $scope.patient === 'undefined' || 
	  typeof $scope.patient.dob === 'undefined' || !$scope.patient.dob) {
        validation.dates.flag = validation.dates.tests.type;
        return true;
      }

      var year = $scope.patient.dob.getFullYear();

      if (year) {
        if (isNaN(year)) {
	  // TODO: Probably not necessary any more since the form only allows digits ???
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        // Sensible year limits - may need to change to accomodate legacy patients
        if (year > currentYear || year < 1900) {
	  // TODO: Maybe not necessary any more since the form/angular validates Date on the fly ???
          validation.dates.flag = validation.dates.tests.limit;
          return true;
        }
      }

      return false;
    }


    // Tests in an ng-disabled method often got called in the wrong order/ scope was not updated
    $scope.$watch('patient.dob', function (nval, oval) {
      customValidation();
    }, true);

    $scope.$watch('session', function (nval, oval) {
      customValidation();
    }, true);

    $scope.$watch('patient.current_location_id', function (nval, oval) {
      customValidation();
    });

    $scope.$watch('patient.current_location_id', function (nval, oval) {
      customValidation();
    });

    // Function to change the debitor
    $scope.changeDebitor = function () {
      // session.mode = 'change_debitor';
      // TODO Needs to be implemented!
      alert('Not implemented yet!');
    };


    // Define the function that switches to the edit mode
    $scope.initialiseEditing = function initialiseEditing (selectedPatient) {
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

      // Make sure the DOB is in SQL format
      patient.dob = util.sqlDate(patient.dob);

      // Normalize the patient names (just in case they have been changed)
      patient.first_name = util.normalizeName(patient.first_name);
      patient.last_name = util.normalizeName(patient.last_name);
      patient.father_name = util.normalizeName(patient.father_name);
      patient.mother_name = util.normalizeName(patient.mother_name);
      patient.spouse = util.normalizeName(patient.spouse);
      
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
