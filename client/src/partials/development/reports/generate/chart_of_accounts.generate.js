// Controller name must match key convention over BHIMA style guide
angular.module('bhima.controllers')
.controller('chart_of_accountsController', chartOfAccounts);

// Definition is passed in through report core
chartOfAccounts.$inject = ['$anchorScroll', '$location', '$modalInstance', '$http', 'store', 'ModuleState', 'validate', 'definition', 'updateMethod'];

function chartOfAccounts($anchorScroll, $location, $modalInstance, $http, Store, ModuleState, validate, definition, updateMethod) { 
  var modal = this;
  var state = new ModuleState();

  var generateUrl = 'report/build/chart_of_accounts';

  // This will act as a container for all report document configuration options
  var options = {};
  
  modal.state = state;
  modal.title = definition.title; 
  modal.options = options;
  
  // TODO Model orientation options 
  modal.options.format = 'standard';

  // Request form generation 
  function submit() { 
    state.loading();
    
    $http.post(generateUrl, options)
    .then(function (result) { 
      var uniqueResultIndex = 0;
      var archiveRecord = result.data[uniqueResultIndex];

      modal.link = archiveRecord.path;
      
      definition = result;

      // TODO Refactor this API, did not scale
      state.loaded();
      state.success();
      state.completed();

      updateMethod(result);
    })
    .catch(function (error) { 
      console.log('err', error); 

      state.loaded();
      state.completed();
      state.failed();
    });
  }
  
  modal.submit = submit;
  modal.scrollToContent = function () { 
    var hash = 'contentConfig';

    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  };
 
  modal.scrollToLabel = function () { 
    var hash = 'labelConfig';

    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  };

  modal.scrollToLayout = function () { 
    var hash = 'layoutConfig';
    
    if ($location.hash() !== hash) { 
      $location.hash(hash);
    } else { 
      $anchorScroll();
    }
  };

  modal.cancelModal = function () { 
    $modalInstance.dismiss();
  };

  modal.completeModal = function () { 
    $modalInstance.close(definition);
  };
}
