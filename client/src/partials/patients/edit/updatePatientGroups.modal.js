angular.module('bhima.controllers')
.controller('UpdateDebtorGroup', UpdateDebtorGroup);

UpdateDebtorGroup.$inject = ['$scope', '$uibModalInstance', 'Debtors',  'patient'];

function UpdateDebtorGroup($scope, $uibModalInstance, debtors, patient) { 
  var viewModel = this;
  
  console.log('got', patient);
  console.log('modal controller initiliased');

  viewModel.debitor_group_uuid = patient.debitor_group_uuid;
  
  // TODO Handle errors with generic modal exception display (inform system administrator)
  debtors.groups()
    .then(function (debtorGroups) { 
      console.log('groups', debtorGroups); 

      viewModel.debtorGroups = debtorGroups;
    });

  viewModel.confirmGroup = function confirmGroup() { 
    console.log($scope.groupForm);
    var formIsUpdated = $scope.groupFrom.$dirty;

    // Simply exit the modal
    if (!formIsUpdated) { 
    
      return;
    }

    
  }
}
