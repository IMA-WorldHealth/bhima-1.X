// TODO Handle generic HTTP errors (displayed contextually on form)
angular.module('bhima.controllers')
.controller('PatientRegistrationController', PatientRegistrationController);

// $scope import required to make use of angular form validation
PatientRegistrationController.$inject = [
  '$scope', 'Patients', 'Debtors', '$location', 'SessionService'
];

function PatientRegistrationController($scope, patients, debtors, $location, Session) {
  var projectId = Session.project.id;
  var viewModel = this;
  
  var DEFAULT_BIRTH_MONTH = '06-01';
  
  viewModel.finance = {};
  viewModel.medical = {};
  viewModel.options = {};

  debtors.groups()
    .then(function (results) { 
      viewModel.options.debtorGroups = results;
    }); 

  // Define limits for DOB
  viewModel.minDOB = new Date('1900-01-01');
  viewModel.maxDOB = new Date();

  
  viewModel.registerPatient = function registerPatient() {
    var createPatientDetails;

    // Register submitted action even though the button it outside of the scope
    // of the form 
    $scope.details.$setSubmitted(); 
  
    if ($scope.details.$invalid) { 
      
      // TODO Scroll to top invalid input or update button state?
      console.log($scope.details);
      return;
    }

    createPatientDetails = { 
      medical : viewModel.medical,
      finance : viewModel.finance
    };

    // Assign implicit information 
    createPatientDetails.medical.project_id = projectId;
  
    patients.create(createPatientDetails)
      .then(function (result) { 
        
        // Create patient success - mark as visiting
        return patients.logVisit({
          uuid : result.uuid
        });
      })
      .then(function (confirmation) { 
        var patientCardPath = '/invoice/patient/';
        
        //TODO Hospital card should recieve a value that notifies the user of register success
        $location.path(patientCardPath.concat(confirmation.uuid));
      })
  };

  viewModel.enableFullDate = function enableFullDate() {
    viewModel.fullDateEnabled = true;
  };
  
  viewModel.calculateYOB = function calculateYOB(value) { 
    viewModel.medical.dob = value && value.length === 4 ? new Date(value + '-' + DEFAULT_BIRTH_MONTH) : undefined;
  };
  
  //FIXME Location directive relies on the $scope object
  $scope.setOriginLocation = function setOriginLocation(uuid) {
    viewModel.medical.origin_location_id = uuid;
  }

  $scope.setCurrentLocation = function setCurrentLocation(uuid) {
    viewModel.medical.current_location_id = uuid;
  }
}
