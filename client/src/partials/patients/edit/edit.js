
// TODO Refactor patient find directive to not use $scope.watch
// TODO No action is taken if default parameter is not a valid patient

// FIXME Patient UUID reference downloads and searches for patient redundantly 
// this should be addressed by updating the find patient directive to only return a UUID
// and have the page responsible for using the UUID as required (potentially optionally?)

// TODO Address location/ routing hack, deep linking functionality should not be implemented 
// in a different way by every controller - apply uniform (routing?) standards across pages
angular.module('bhima.controllers')
.controller('PatientEdit', PatientEdit);

PatientEdit.$inject = ['$scope', '$routeParams', '$location', '$uibModal', 'Patients', 'util'];

function PatientEdit($scope, $routeParams, $location, $uibModal, patients, util) { 
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
  
  // Update the view to reflect changes made in update modal
  function updateDebtorModel(debtorGroupUuid, debtorGroupName) { 
    viewModel.medical.debitor_group_uuid = debtorGroupUuid;
    viewModel.medical.debitor_group_name = debtorGroupName;
    viewModel.updatedDebtorGroup = true;
  }
  
  // Update the view to reflect changes made in update modal
  function updatePatientGroupsModel(updated) { 
    viewModel.updatedPatientGroups = true;
    viewModel.finance.patientGroups = [];
  
    console.log('updated', updated);
    viewModel.finance.patientGroups = updated;
  }
  
  // TODO Clearer naming conventions
  // submit a request to change patient details
  viewModel.updatePatient = function updatePatient(patient) { 
    var patientIsUpdated = $scope.details.$dirty;
    var changedDefinition;

    if (!patientIsUpdated) { 

      // No updates need to happen - save HTTP requests
      // TODO Inform user of early exit state
      return;
    }
    
    changedDefinition = util.filterDirtyFormElements($scope.details);
      
    patients.update(patient.uuid, changedDefinition);
  };
  
  // Callback passed to find patient directive 
  viewModel.confirmPatient = function confirmPatient(patient) {  
    var pageReferred = angular.isDefined(referenceId);
    
    if (pageReferred) { 
      
      // Build the page given a correctly linked patient UUID
      // TODO Catch 404 patient not found response and show meaningful error
      buildPage(patient.uuid);
    } else { 

      // Navigate correctly using patient as reference
      $location.path('/patients/edit/'.concat(patient.uuid));
    }
  };

  viewModel.updateDebtorGroup = function updateDebtorGroup() { 

    // Reset updated flag 
    viewModel.updatedDebtorGroup = false;
  
    // Provide modal
    var modalInstance = $uibModal.open({
      animation : true,
      templateUrl : 'partials/patients/edit/updateDebtorGroup.tmpl.html',
      controller : 'UpdateDebtorGroup as UpdateDebtorGroupCtrl',
      size : 'md', 
      keyboard : false,
      backdrop : 'static',
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
      keyboard : false,
      backdrop : 'static',
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
