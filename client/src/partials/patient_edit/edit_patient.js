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
        original_patient_data = null,
        patient_uuid = $scope.patient_uuid = $routeParams.patientID,
        session = $scope.session = {},
        editable_fields = [
	  'first_name', 'last_name', 'dob', 'sex', 'father_name', 'mother_name',
	  'profession', 'employer', 'marital_status', 'spouse', 'spouse_profession', 'spouse_employer',
	  'religion', 'phone', 'email', 'addr_1', 'origin_location_id', 'current_location_id'
	  ];
    
    session.mode = 'search';

    session.timestamp = new Date();
    session.current_year = session.timestamp.getFullYear();

    session.originLocationUuid = null;
    session.currentLocationUuid = null;
    session.failedSessionValidation = false;

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
	    columns : editable_fields.concat(['uuid', 'reference', 'registration_date'])
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
	where : [ 'patient.uuid=' +  patient_uuid ]
      }
    };

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
    $scope.getMaxDate = function getMaxDate() {
      return util.htmlDate(session.timestamp);
    };

    $scope.setOriginLocation = function (uuid) {
      // TODO: Switch from session.originLocationUuid to patient
      // ??? $scope.patient.origin_location_id = uuid;
      session.originLocationUuid = uuid;
    };
    
    $scope.setCurrentLocation = function (uuid) {
      // ??? $scope.patient.current_location_id = uuid;
      session.currentLocationUuid = uuid;
    };

    function customValidation() {
      var dates = validateDates();
      var locations = validateLocations();

      session.failedSessionValidation = dates || locations;
      return;
    }

    function validateLocations() {
      validation.locations.flag = false;

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
        if (year > session.current_year || year < 1900) {
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

    $scope.changeDebitor = function () {
      // session.mode = 'change_debitor';
      // TODO Needs to be implemented!
      alert('Not implemented yet!');
    };

    $scope.updatePatient = function () {
      var patient = connect.clean(angular.copy($scope.patient));

      // Update the locations
      patient.origin_location_id = session.originLocationUuid;
      patient.current_location_id = session.currentLocationUuid;

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
      editable_fields.forEach(function (fname) {
	if (original_patient_data[fname] && !(patient[fname])) {
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

    $scope.initialiseEditing = function initialiseEditing (selectedPatient) {
      if (selectedPatient && 'uuid' in selectedPatient && selectedPatient.uuid) {
        patient_uuid = $scope.patient_uuid = selectedPatient.uuid;
	dependencies.patient.query.where[0] = 'patient.uuid=' + patient_uuid;
	validate.process(dependencies)
	  .then(startup);
	session.mode = 'edit';
      }
      else {
	messenger.danger($translate('ERR_MISSING'));
      }
    };

    function startup (models) {
      var patient = $scope.patient = models.patient.data[0];
      original_patient_data = angular.copy(patient);

      patient.dob = new Date(patient.dob);
      patient.hr_id = patient.project_abbr.concat(patient.reference);

      $scope.initialOriginLocation = patient.origin_location_id;
      $scope.setOriginLocation(patient.origin_location_id);

      $scope.initialCurrentLocation = patient.current_location_id;
      $scope.setCurrentLocation(patient.current_location_id);

      $scope.debtorGroup = models.debtorGroup;
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      session.mode = 'search';
      if (patient_uuid) {
	session.mode = 'edit';
	validate.process(dependencies)
	  .then(startup);
      }
    });

  }

]);
