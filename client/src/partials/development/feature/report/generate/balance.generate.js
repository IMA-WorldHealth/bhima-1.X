angular.module('bhima.controllers')
.controller('balanceController', balanceController);

// Definition is passed in through report core
balanceController.$inject = ['$anchorScroll', '$location', '$modalInstance', '$http', 'store', 'definition'];

function balanceController($anchorScroll, $location, $modalInstance, $http, Store, definition) { 
  var modal = this;
    
  modal.title = definition.title; 
  console.log('controller init', definition);
  // Fetch required information (archive exists for option, available params etc.)
  // $q.all 
  
  // ? Cache options
  
  // Validate selected otions 
  
  // Request form generation 

  // Report status
  //
  modal.scrollToContent = function () { 
    var hash = 'contentConfig';

    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  }
 
  modal.scrollToLabel = function () { 
    var hash = 'labelConfig';

    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  }

  modal.scrollToLayout = function () { 
    var hash = 'layoutConfig';
    
    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  }

  modal.cancelModal = function () { 
    $modalInstance.dismiss();
  }
}
