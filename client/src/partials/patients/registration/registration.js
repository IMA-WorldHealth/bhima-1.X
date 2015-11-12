angular.module('bhima.controllers')
.controller('PatientRegistrationController', PatientRegistrationController);

PatientRegistrationController.$inject = [
  '$scope', 'Patients', 'Debtors', '$q', '$location', '$translate', '$http', 'connect', 'messenger',
  'validate', 'util', 'uuid', 'SessionService'
];

function PatientRegistrationController($scope, patients, debtors, $q, $location, $translate, $http, connect, messenger, validate, util, uuid, Session) {
  
  var viewModel = this;

  var dependencies = {},
      defaultBirthMonth = '06-01',
      timestamp = new Date(),
      minYear = util.minPatientDate.getFullYear(),
      maxYear = timestamp.getFullYear(),
      session = $scope.session = { };

  session.timestamp = timestamp;
  session.originLocationUuid = null;
  session.currentLocationUuid = null;

  debtors.groups()
    .then(function (results) { 
    
    }); 

  $scope.patient = {};
  $scope.origin = {};
  $scope.current = {};

  dependencies.debtorGroup = {
    query : {
      identifier : 'uuid',
      tables : { 'debitor_group' : { 'columns' : ['uuid', 'name', 'note']}},
      where  : ['debitor_group.locked=0']
    }
  };

  function patientRegistration(model) {
    angular.extend($scope, model);

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


  // Define limits for DOB
  $scope.minDOB = util.htmlDate(util.minPatientDate);
  $scope.maxDOB = util.htmlDate(timestamp);

  // Location methods
  function setOriginLocation(uuid) {
    session.originLocationUuid = uuid;
  }

  function setCurrentLocation(uuid) {
    session.currentLocationUuid = uuid;
  }

  $scope.registerPatient = function registerPatient() {
  
    // Register submitted action even though the button it outside of the scope
    // of the form 
    $scope.details.$setSubmitted(); 
  
    if ($scope.details.$invalid) { 
      
      // Scroll to top invalid input
      console.log($scope.details);
      return;
    }


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
    packagePatient.debtorUuid = debtorId;
    packagePatient.debtorGroupUuid = packageDebtor.group_uuid;
  

    $http.post('/patients', packagePatient)
      .then (function (result) { 
        console.log('recieved', result);
      })
    . catch(function (error) { 
        console.log('error', error);
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
  
  // appstate.register('project', function (project) {
    // $scope.project = project;
    // validate.process(dependencies)
    // .then(patientRegistration)
    // .catch(handleError);
  // });

  $scope.setOriginLocation = setOriginLocation;
  $scope.setCurrentLocation = setCurrentLocation;
}
