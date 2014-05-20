angular.module('bhima.controllers')
.controller('renewal', [
  '$scope',
  '$filter',
  'validate',
  'connect',
  'messenger',
  function ($scope, $filter, validate, connect, messenger) {
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
     
      connect.fetch('/visit/\"' + sessionPatient.uuid + '\"').then(function(res) {

        //Patient visit has been logged
        messenger.success($filter('translate')('RENEWAL.SUCCESS_MESSAGE'));
      }, function (err) {
     
        //Patient visit log failed
        messenger.danger($filter('translate')('RENEWAL.FAILURE_MESSAGE'));
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
