// TODO Handle generic HTTP errors (displayed contextually on form)

angular.module('bhima.controllers')
.controller('PatientRegistrationController', PatientRegistrationController);

PatientRegistrationController.$inject = [
  '$scope', 'Patients', 'Debtors', '$location', 'util', 'SessionService'
];

function PatientRegistrationController($scope, patients, debtors, $location, util, Session) {
  var projectId = Session.project.id;
  var session = $scope.session = {};
  
  var DEFAULT_BIRTH_MONTH = '06-01';
  
  $scope.finance = {};
  $scope.medical = {};
  $scope.options = {};

  debtors.groups()
    .then(function (results) { 
      $scope.options.debtorGroups = results;
    }); 

  // Define limits for DOB
  $scope.minDOB = new Date('1900-01-01');
  $scope.maxDOB = new Date();

  $scope.setOriginLocation = function setOriginLocation(uuid) {
    $scope.medical.origin_location_id = uuid;
  }

  $scope.setCurrentLocation = function setCurrentLocation(uuid) {
    $scope.medical.current_location_id = uuid;
  }

  $scope.registerPatient = function registerPatient() {
    var createPatientDetails;
  
    // Register submitted action even though the button it outside of the scope
    // of the form 
    $scope.details.$setSubmitted(); 
  
    if ($scope.details.$invalid) { 
      
      // Scroll to top invalid input
      console.log($scope.details);
      return;
    }

    createPatientDetails = { 
      medical : $scope.medical,
      finance : $scope.finance
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

  // TODO Refactor process - expensive operation on digest
  $scope.$watch('session.yob', function (nval) {
    $scope.medical.dob = nval && nval.length === 4 ? new Date(nval + '-' + DEFAULT_BIRTH_MONTH) : undefined;
  });

  $scope.enableFullDate = function enableFullDate() {
    session.fullDateEnabled = true;
  };
}
