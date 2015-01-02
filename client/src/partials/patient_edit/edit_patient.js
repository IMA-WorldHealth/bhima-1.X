angular.module('bhima.controllers')
.controller('patientEdit', [
  '$scope',
  '$routeParams',  
  '$translate',
  'validate',
  'messenger',
  'appstate',
    function ($scope, $routeParams, $translate, validate, messenger, appstate) {
	var dependencies = {},
	    patient_uuid = $scope.patient_uuid = $routeParams.patientID,
            session = $scope.session = {};

	// Set up the query for the patient data
	dependencies.patient = {
	    query : {
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

	// Location methods
	function setOriginLocation(uuid) {
	    session.originLocationUuid = uuid;
	}
	$scope.setOriginLocation = setOriginLocation;

	function setCurrentLocation(uuid) {
	    session.currentLocationUuid = uuid;
	}
	$scope.setCurrentLocation = setCurrentLocation;

	function startup (models) {
	    $scope.patient = models.patient.data[0];

	    // Extract the yob for convenience (???)
	    // var dob = new Date($scope.patient.dob);
	    // $scope.patient.yob = dob.getFullYear();

	    console.log(models);
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
