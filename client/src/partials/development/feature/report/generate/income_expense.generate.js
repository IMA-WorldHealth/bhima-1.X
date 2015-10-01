// Controller name must match key convention over BHIMA style guide
angular.module('bhima.controllers')
.controller('income_expenseController', incomeExpense);

// Definition is passed in through report core
incomeExpense.$inject = ['$anchorScroll', '$location', '$modalInstance', '$http', 'store', 'ModuleState', 'validate', 'definition', 'updateMethod'];

function incomeExpense($anchorScroll, $location, $modalInstance, $http, Store, ModuleState, validate, definition, updateMethod) { 
  var modal = this;
  var state = new ModuleState();

  var generateUrl = 'report/build/income_expense';
  var definition;

  // This will act as a container for all report document configuration options
  var options = {};
  var dependencies = {};
  
  modal.state = state;
  modal.title = definition.title; 
  modal.options = options;
  
  // TODO Model orientation options 
  modal.options.format = 'standard';

  console.log('controller init', definition);
  
  // Fetch required information (archive exists for option, available params etc.)
  // $q.all 
  dependencies.fiscal = {
      query : {
        tables : {
          fiscal_year : {
            columns : ['id', 'fiscal_year_txt', 'number_of_months', 'start_month', 'start_year', 'previous_fiscal_year', 'locked']
          }
        }
      }
    };
  
  validate.refresh(dependencies)
    .then(settupModal);
  
  function settupModal(models) {
    
    // FIXME Hack - user preference may be to have current fiscal year selected by default?
    var latestIndex;

    modal.fiscal = models.fiscal.data;
    latestIndex = modal.fiscal.length - 1;

    // FIXME Assigning random values that are never specified - @class-y JavaScript
    options.fiscal_year = modal.fiscal[latestIndex].id;
    options.compare_year = modal.fiscal[latestIndex].id;
  }

  function updateCompareOption(enabled) { 
    if (!enabled) { 
    
      // Remove the configuration option for comparing fiscal years
      options.compare_year = undefined;
    }
  }

  // ? Cache options
  
  // Validate selected otionsfalse
  
  // Request form generation 
  function submit() { 
    state.loading();
    
    console.log('sending options', options);

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
      
    // state.loaded();
    // state.completed();
  }
  
  // Report status
  
  modal.submit = submit;
  modal.updateCompareOption = updateCompareOption;
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

  modal.completeModal = function () { 
    $modalInstance.close(definition);
  }
}
