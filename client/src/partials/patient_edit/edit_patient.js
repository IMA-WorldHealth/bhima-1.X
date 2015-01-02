angular.module('bhima.controllers')
.controller('patientEdit', [
  '$scope',
  '$routeParams',  
  '$translate',
  'validate',
  'messenger',
  'util',
  'appstate',
  function ($scope, $routeParams, $translate, validate, messenger, util, appstate) {
    var dependencies = {},
    patient_uuid = $scope.patient_uuid = $routeParams.patientID,
    session = $scope.session = {};

    session.mode = 'edit';

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
	    columns : ['uuid', 'project_id', 'reference', 'debitor_uuid', 'creditor_uuid',
		       'first_name', 'last_name', 'dob', 'sex',
		       'father_name', 'mother_name',
		       'profession', 'employer',
		       'marital_status', 'spouse', 'spouse_profession', 'spouse_employer',
		       'religion',
		       'phone', 'email', 'addr_1','addr_2',
		       'renewal',
		       'origin_location_id',
		       'current_location_id',
		       'registration_date']
	  },
	  'debitor' : { 
	    columns : ['group_uuid::debitor_group_id', 'text::debitor_name']
	  },
	  'debitor_group' : { 
	    columns : ['name::debitor_group_name']
	  }
	},
	join : [ 'patient.debitor_uuid=debitor.uuid',
		 'debitor.group_uuid=debitor_group.uuid'
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
      session.originLocationUuid = uuid;
    };
    
    $scope.setCurrentLocation = function (uuid) {
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

    // Conveluted date validation
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
	  // ??? Probably not necessary any more since the form only allows digits
          validation.dates.flag = validation.dates.tests.type;
          return true;
        }

        // Sensible year limits - may need to change to accomodate legacy patients
        if (year > session.current_year || year < 1900) {
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
      session.mode = 'change_debitor';
    };

    $scope.updatePatient = function () {
      alert('Updating');
      session.mode = 'edit';
    };


    function startup (models) {
      $scope.patient = models.patient.data[0];
      $scope.patient.dob = new Date($scope.patient.dob);
      $scope.debtorGroup = models.debtorGroup;
    }

    appstate.register('enterprise', function (enterprise) {
      $scope.enterprise = enterprise;
      if (patient_uuid) {
	validate.process(dependencies)
	  .then(startup);
      }
    });

  }

]);
