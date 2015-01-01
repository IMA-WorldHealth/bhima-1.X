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
		// identifier : 'id',
		tables : {
		    'patient' : {
			columns : ['uuid', 'first_name', 'last_name']
		    }
		}
	    }
	};

	function startup (models) {
	    $scope.patient = models.patient.data[0];
	}

	appstate.register('enterprise', function (enterprise) {
	    $scope.enterprise = enterprise;
	    if (patient_uuid) {
		dependencies.patient.query.where = [ 'patient.uuid=' +  patient_uuid ];
		validate.process(dependencies)
		    .then(startup);
	    }
	    else {
		$scope.patient = {};
	    }
	});

    }

]);
