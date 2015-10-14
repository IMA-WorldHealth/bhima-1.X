// Controller name must match key convention over BHIMA style guide
angular.module('bhima.controllers')
.controller('patient_invoicesController', patientInvoices);

// Definition is passed in through report core
patientInvoices.$inject = ['$anchorScroll', '$location', '$modalInstance', '$http', 'util', 'store', 'ModuleState', 'validate', 'definition', 'updateMethod', 'referenceOptions'];

function patientInvoices($anchorScroll, $location, $modalInstance, $http, util,  Store, ModuleState, validate, definition, updateMethod, referenceOptions) { 
  var modal = this;
  var state = new ModuleState();

  var generateUrl = 'report/build/patient_invoices';
  
  // This will act as a container for all report document configuration options
  var options = {};
  
  // Reference can optionally be passed through from intialising module - these can include any default attributes
  referenceOptions = referenceOptions || {};
  
  modal.state = state;
  modal.title = definition.title; 
  modal.options = options;

  // TODO Model orientation options 
  modal.options.format = 'standard';
  
  modal.options.dateFrom = referenceOptions.dateFrom || new Date();
  modal.options.dateTo = referenceOptions.dateTo || new Date();

  // Request form generation 
  function submit() { 
    state.loading();

    // Initial date format 
    options.dateFrom = util.sqlDate(options.dateFrom);
    options.dateTo = util.sqlDate(options.dateTo);
    
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
