angular.module('bhima.controllers')
.controller('PatientRegistrationController', PatientRegistrationController);

PatientRegistrationController.$inject = [
  '$scope', 'Patients', 'Debtors', '$q', '$location', '$translate', '$http', 'connect', 'messenger',
  'validate', 'util', 'uuid', 'SessionService'
];

function PatientRegistrationController($scope, patients, debtors, $q, $location, $translate, $http, connect, messenger, validate, util, uuid, Session) {
  var projectId = Session.project.id;
  var session = $scope.session = {};
  
  var DEFAULT_BIRTH_MONTH = '06-01';

  $scope.finance = {};
  $scope.medical = {};

  $scope.options = {};
  
  session.timestamp = new Date();

  debtors.groups()
    .then(function (results) { 
      $scope.options.debtorGroups = results;
    }); 
  
  function patientRegistration(model) {
    angular.extend($scope, model);

  }

  // Define limits for DOB
  $scope.minDOB = util.htmlDate(util.minPatientDate);
  $scope.maxDOB = util.htmlDate(session.timestamp);

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
  
    console.log('sending', createPatientDetails);

    patients.create(createPatientDetails)
      .then(function (result) { 
        console.log('result', result);
      })
  };

  // TODO Refactor process - expensive operation on digest
  $scope.$watch('session.yob', function (nval) {
    $scope.medical.dob = nval && nval.length === 4 ? new Date(nval + '-' + DEFAULT_BIRTH_MONTH) : undefined;
  });

  $scope.enableFullDate = function enableFullDate() {
    session.fullDateEnabled = true;
  };

  // function writePatient(patient) {
  //   var debtorId = uuid(), patientId = uuid();
  //   var packageDebtor = {
  //     uuid : debtorId,
  //     group_uuid : $scope.finance.debtor_group_uuid,
  //     text : 'Debtor ' + patient.last_name + ' ' + patient.middle_name + ' ' + patient.first_name,
  //   };
  
  //   var packagePatient = connect.clean(patient);
  //   packagePatient.dob = util.sqlDate(packagePatient.dob);
  //   packagePatient.uuid = patientId;
  //   packagePatient.project_id = $scope.project.id;
  //   packagePatient.reference = 1; // FIXME/TODO : This is a hack
  
  //   // Normalize the patient names
  //   packagePatient.first_name = util.normalizeName(packagePatient.first_name);
  //   packagePatient.last_name = util.normalizeName(packagePatient.last_name);
  //   packagePatient.middle_name = util.normalizeName(packagePatient.middle_name);
  //   packagePatient.father_name = util.normalizeName(packagePatient.father_name);
  //   packagePatient.mother_name = util.normalizeName(packagePatient.mother_name);
  //   packagePatient.spouse = util.normalizeName(packagePatient.spouse);
  //   packagePatient.title = util.normalizeName(packagePatient.title);
  //   packagePatient.debtorUuid = debtorId;
  //   packagePatient.debtorGroupUuid = packageDebtor.group_uuid;
  

  //   $http.post('/patients', packagePatient)
  //     .then (function (result) { 
  //       console.log('recieved', result);
  //     })
  //   . catch(function (error) { 
  //       console.log('error', error);
  //     });
   // }
  
  // $scope.loadPatient = function loadPatient(patient) {
  //   // very, very basic.
  //   connect.fetch('/visit/' + patient.uuid)
  //   .then(function () {
  //     //Patient visit has been logged
  //     messenger.success($translate.instant('RENEWAL.SUCCESS_MESSAGE'));
  //     $location.path('invoice/patient/' + patient.uuid); // Niave
  //   })
  //   .catch(function () {
  //     //Patient visit log failed
  //     messenger.danger($translate.instant('RENEWAL.FAILURE_MESSAGE'));
  //   })
  //   .finally();
  // };
}

angular.module('bhima.directives')
.directive('hospitalNumber', HospitalNumber);
  
HospitalNumber.$inject = ['$q', '$http', '$timeout'];

function HospitalNumber($q, $http, $timeout) { 
  
  return { 
    require : 'ngModel',
    link : function (scope, elm, attrs, ctrl) { 

      console.log('directive initialised');
      ctrl.$asyncValidators.hospitalNumber = function (modelValue, viewValue) { 
        var deferred;
        var path = '/patients/checkHospitalId/';

        if (ctrl.$isEmpty(modelValue)) { 
          return $q.when();
        }

        deferred = $q.defer();
        
        $http.get(path.concat(modelValue))
          .then(function (result) { 
            var hospitalNumberStatus = result.data;

            if (hospitalNumberStatus.registered) { 
              deferred.reject();
            } else { 
              deferred.resolve();
            }
          })
          .catch(function (error) { 

            // TODO Pass error back up through to controller to handle generic errors
            deferred.reject();
          });
        
        return deferred.promise;
      }
    }
  }
}
