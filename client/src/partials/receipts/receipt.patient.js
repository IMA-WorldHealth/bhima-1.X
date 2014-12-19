angular.module('bhima.controllers')
.controller('receipt.patient', [
  '$scope',
  '$routeParams',
  'validate',
  function ($scope, $routeParams, validate) {
    var dependencies = {}, model = $scope.model = {common : {}}, 
      invoiceId    = $scope.invoiceId = $routeParams.invoiceId;

    dependencies.recipient = {
      query : {
        tables : {
          'patient' : {
            columns: ['uuid', 'reference', 'first_name', 'last_name', 'dob', 'current_location_id', 'debitor_uuid', 'registration_date']
          },
          'project' : {
            columns: ['abbr']
          }
        },
        join : [
          'patient.project_id=project.id'
        ],
        where : [
          'patient.uuid=' + invoiceId
        ]
      }
    };

    validate.process(dependencies, ['recipient'])
    .then(buildPatientLocation);

    function buildPatientLocation(model) {
      console.log('Le donnees du Data',model.recipient.data[0].current_location_id);
      dependencies.location = {
        required: true,
        query: '/location/village/' + model.recipient.data[0].current_location_id
      };

      validate.process(dependencies, ['location'])
      .then(patientReceipt);
    }

    function patientReceipt(model) {
      $scope.model = model;
      $scope.recipient = $scope.model.recipient.data[0];
      $scope.location = $scope.model.location.data[0];
      console.log($scope.location);
      // Human readable ID
      $scope.recipient.hr_id = $scope.recipient.abbr.concat($scope.recipient.reference);
    }

    
  }
]);