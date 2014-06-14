angular.module('bhima.controllers')
.controller('renewal', [
  '$scope',
  '$translate',
  'validate',
  'connect',
  'messenger',
  function ($scope, $translate, validate, connect, messenger) {
    var sessionPatient, patientRenewed = $scope.patientRenewed = false;
    var dependencies = {};

    function loadPatient(patient) {
      sessionPatient = $scope.sessionPatient = patient;

      dependencies.location = {
        query : '/location/' + patient.origin_location_id
      };
      validate.process(dependencies)
      .then(processLocation);
    }
 
    function submitRenewal(sessionPatient) {
      patientRenewed = $scope.patientRenewed = true;
     
      connect.fetch('/visit/\"' + sessionPatient.uuid + '\"')
      .then(function() {
        //Patient visit has been logged
        messenger.success($translate.instant('RENEWAL.SUCCESS_MESSAGE'));
      })
      .then(function () {
     
        //Patient visit log failed
        messenger.danger($translate.instant('RENEWAL.FAILURE_MESSAGE'));
      });
    }

    function processLocation(model) {
      $scope.model = model;
      $scope.patientLocation = model.location.data[0];
    }

    $scope.loadPatient = loadPatient;
    $scope.submitRenewal = submitRenewal;
  }
]);
