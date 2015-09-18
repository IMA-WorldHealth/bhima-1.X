angular.module('bhima.controllers')
.controller('balanceController', balanceController);

// Definition is passed in through report core
balanceController.$inject = ['$anchorScroll', '$location', '$modalInstance', '$http', 'store', 'ModuleState', 'definition'];

function balanceController($anchorScroll, $location, $modalInstance, $http, Store, ModuleState, definition) { 
  var modal = this;
  var state = new ModuleState();

  var generateUrl = 'report/build/balance';

  
  modal.state = state;
  modal.title = definition.title; 
  console.log('controller init', definition);
  // Fetch required information (archive exists for option, available params etc.)
  // $q.all 
  
  // ? Cache options
  
  // Validate selected otionsfalse
  
  // Request form generation 
  function submit() { 
    state.loading();
    
    $http.post(generateUrl)
    .then(function (result) { 
      console.log('got', result);
      modal.link = result.data;
    
      // TODO Refactor this API, did not scale
      state.loaded();
      state.success();
      state.completed();
    })
    .catch(function (error) { 
      console.log('err', error); 

      state.loaded();
      state.completed();
      state.failed();
    });
      
    // state.loaded();
    // state.completed();
  }
  
  // Report status
  
  modal.submit = submit;

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
