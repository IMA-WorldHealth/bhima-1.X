
// TODO Refactor patient find directive to not use $scope.watch
// TODO No action is taken if default parameter is not a valid patient
angular.module('bhima.controllers')
.controller('PatientEdit', PatientEdit);

PatientEdit.$inject = ['$scope', '$routeParams', '$uibModal', 'Patients'];

function PatientEdit($scope, $routeParams, $uibModal, patients) { 
  var viewModel = this;
  var referenceId = $routeParams.patientID;

  viewModel.patient = null;
  
  if (referenceId) { 
    viewModel.referredPatient = referenceId;
  }

  function buildPage(patientId) { 
    collectPatient(patientId);
    collectGroups(patientId);
  }

  function collectPatient(patientId) { 
    
    // TODO Full patient/details object should be passed through find patient directive
    // 1. Only download id + name in patient directive
    // 2. Download full patients/details on selection
    patients.detail(patientId)
      .then(function (patient) { 
        
        // Ensure HTML input can render the DOB
        patient.dob = new Date(patient.dob);
        viewModel.medical = patient;
      });
  }
  
  function collectGroups(patientId) { 
    patients.groups(patientId)
      .then(function (result) { 
        viewModel.finance = {patientGroups : result};
        console.log('got groups', result);
      });
  }

  function updateDebtorModel(debtorGroupUuid, debtorGroupName) { 
    viewModel.medical.debitor_group_uuid = debtorGroupUuid;
    viewModel.medical.debitor_group_name = debtorGroupName;
    viewModel.updatedDebtorGroup = true;
  }
  
  function updatePatientGroupsModel(updated) { 
    viewModel.updatedPatientGroups = true;
    viewModel.finance.patientGroups = [];
  
    console.log('updated', updated);
    viewModel.finance.patientGroups = updated;
  }
  
  viewModel.updatePatient = function updatePatient(patient) { 
    console.log($scope.details);
    console.log($scope);
    console.log('updating', patient);
  

  };

  // Callback passed to find patient directive 
  viewModel.confirmPatient = function confirmPatient(patient) { 
    
    // TODO Verify patient validity etc. 
    buildPage(patient.uuid);
  };

  // TODO 
  // Modal group update interactions 
  viewModel.updateDebtorGroup = function updateDebtorGroup() { 

    // Reset updated flag 
    viewModel.updatedDebtorGroup = false;
  
    // Provide modal
    var modalInstance = $uibModal.open({
      animation : true,
      templateUrl : 'partials/patients/edit/updateDebtorGroup.tmpl.html',
      controller : 'UpdateDebtorGroup as UpdateDebtorGroupCtrl',
      size : 'md', 
      resolve : {
        patient : function () { 
          return viewModel.medical;
        }, 
        updateModel : function () { 
          return updateDebtorModel;
        }
      }
    });
  };

  viewModel.updatePatientGroups = function updatePatientGroups() { 
    
    // Reset updated flag 
    viewModel.updatedPatientGroups = false;
  
    var modalInstance = $uibModal.open({
      animation : true,
      templateUrl : 'partials/patients/edit/updatePatientGroups.tmpl.html',
      controller : 'UpdatePatientGroups as UpdatePatientGroupsCtrl',
      size : 'md', 
      resolve : {
        sessionPatient : function () { 
          return viewModel.medical;
        }, 
        sessionGroups : function () { 
          return viewModel.finance.patientGroups;
        },
        updateModel : function () { 
          return updatePatientGroupsModel;
        }
      }
    });
  };
}
