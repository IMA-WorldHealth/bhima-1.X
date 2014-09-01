angular.module('bhima.controllers')
.controller('patientRegistration', [
  '$scope',
  '$q',
  '$location',
  '$translate',
  'connect',
  'messenger',
  'validate',
  'appstate',
  'util',
  'uuid',
  function ($scope, $q, $location, $translate, connect, messenger, validate, appstate, util, uuid) {

    var dependencies = {};
    var defaultBirthMonth = '06-01';
    
    var originLocationUuid, currentLocationUuid;

    $scope.sessionProperties = { timestamp : new Date() };
    $scope.patient = {};
    $scope.origin = {};
    $scope.current = {};

    dependencies.debtorGroup = {
      query : {
        identifier : 'uuid',
        tables : { 'debitor_group' : { 'columns' : ['uuid', 'name', 'note']}}
      }
    };

    dependencies.register = {
      query : 'user_session'
    };

    function patientRegistration(model) {
      angular.extend($scope, model);
      return $q.when();
    }

    function validateFields() { 
      return validateDates() && validateLocations();
    }

    // Location methods
    function setOriginLocation(uuid) { 
      originLocationUuid = uuid;
    }

    function setCurrentLocation(uuid) { 
      currentLocationUuid = uuid;
    }

    $scope.registerPatient = function registerPatient() {

      if (util.isDateAfter($scope.patient.dob, new Date())) {
        return messenger.warn($translate('PATIENT_REG.INVALID_DATE'), 6000);
      }

      if (!originLocationUuid || !currentLocationUuid) { 
        return messenger.warn("Invalid location - validation required", 6000);
      }

      var patient = $scope.patient;
      patient.current_location_id = originLocationUuid;
      patient.origin_location_id = currentLocationUuid;
      writePatient(patient);
    };

    $scope.getMaxDate = function getMaxDate () {
      return util.htmlDate($scope.sessionProperties.timestamp);
    };

    function writePatient(patient) {
      var debtorId = uuid(), patientId = uuid();
      var packageDebtor = {
        uuid : debtorId,
        group_uuid : $scope.debtor.debtor_group.uuid,
        text : 'Debtor ' + patient.first_name + ' ' + patient.last_name,
      };

      var packagePatient = connect.clean(patient);
      packagePatient.dob = util.sqlDate(packagePatient.dob);
      packagePatient.uuid = patientId;
      packagePatient.project_id = $scope.project.id;
      packagePatient.reference = 1; // FIXME/TODO : This is a hack

      connect.basicPut('debitor', [packageDebtor])
      .then(function () {
        packagePatient.debitor_uuid = debtorId;
        return connect.basicPut('patient', [packagePatient]);
      })
      .then(function () {
        return connect.fetch('/visit/\'' + patientId + '\'');
      })
      .then(function () {
        return connect.fetch('/user_session');
      })
      .then(function (data) {
        var packageHistory = {
          uuid : uuid(),
          debitor_uuid : packagePatient.debitor_uuid,
          debitor_group_uuid : $scope.debtor.debtor_group.uuid,
          user_id : data.id // FIXME: can this be done on the server?
        };
        return connect.basicPut('debitor_group_history', [connect.clean(packageHistory)]);
      })
      .then(function () {
        $location.path('invoice/patient/' + packagePatient.uuid);
      });
    }

    // Utility methods
    $scope.$watch('sessionProperties.yob', function (nval) {
      // Angular 1.3.0-beta.3 fixes date issues, now works with raw object
      $scope.patient.dob = nval && nval.length === 4 ? new Date(nval + '-' + defaultBirthMonth) : undefined;
    });

    $scope.enableFullDate = function enableFullDate() {
      $scope.sessionProperties.fullDateEnabled = true;
    };

    function handleError(err) {
      messenger.danger('An Error Occured : ' + JSON.stringify(err));
    }

    appstate.register('project', function (project) {
      $scope.project = project;
      validate.process(dependencies)
      .then(patientRegistration)
      .catch(handleError);
    });

    $scope.setOriginLocation = setOriginLocation;
    $scope.setCurrentLocation = setCurrentLocation;
  }
]);
