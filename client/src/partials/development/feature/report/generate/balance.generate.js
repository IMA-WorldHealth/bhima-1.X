angular.module('bhima.controllers')
.controller('balanceController', balanceController);

balanceController.$inject = ['$modalInstance', '$http', 'store'];

function balanceController($modalInstance, $http, Store) { 
  var modal = this;
    
  console.log('controller init');
  // Fetch required information (archive exists for option, available params etc.)
  
  // ? Cache options
  
  // Validate selected otions 
  
  // Request form generation 

  // Report status

  modal.cancelModal = function () { 
    $modalInstance.dismiss();
  }
}
