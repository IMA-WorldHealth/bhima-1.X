angular.module('kpk.controllers').controller('reportFinanceController', function($scope, $q, connect) {

  //Models
  var models = {};
  models['fiscal'] = {
    model: {}, 
    request: {
      tables: {
        'fiscal_year': { 
          columns: ['enterpfrise_id', 'id', 'start_month', 'start_year', 'previous_fiscal_year']
        }
      }
    }
  }

  //Error handling 
  $scope.session_error = {valid: true};

  function init() { 
    //TODO rename promise

    var promise = populateModels(models);
    promise
    //Populate Models - Success
    .then(function(model_list) { 
      return verifyReceived(model_list);
    }, 
    //Populate Models - Error
    function(err) { 
      console.log("Top level recieved err:", err);
      handleError(err);
    })
    //Verify Models - Success
    .then(function(res) { 
    },
    //Veryify Models - Error
    function(err) { 
      console.log("Top level recieved err:", err);

      handleError();
    });
  }

  function populateModels(model_list) { 
    /*summary
    *   generic method to request data for any number of provided models
    */
    var deferred = $q.defer(); 
    var promise_list = [];

    for(item in model_list) { 
      promise_list.push(connect.req(model_list[item].request));
    }

    //Loop is bad, link models in a different way
    $q.all(promise_list)
    .then(function(res) { 
      //Success 
      var i = 0;
      for(item in models) { 
        model_list[item].model = res[i];
        i++;
      }
      deferred.resolve(model_list);
    }, function(err) { 
      //Error
      deferred.reject(err);
    });
    return deferred.promise;
  }

  //TODO rename verifyReceived()
  function verifyReceived(model_list) { 
    /*summary
    *   verify that data recieved from the server is correct and usable - if not inform the user
    */
    var deferred = $q.defer();

    //Fiscal years should exist in the system
    if(model_list['fiscal'].model.data.length===0) {
      deferred.reject();
    }
    
    //All tests passed
    deferred.resolve();
    return deferred.promise;
  }

  //TODO renmae handleError()
  function handleError(err) { 

    var error_status = err.status || null;
    var error_body;

    if(error_status) { 
      //Route error
    } else { 
      //Default - unknown error
      error_body = "Unkown error - shit's serious";
    }

    //Expose error to view
    $scope.session_error.body = error_body;
    $scope.session_error.valid = false;
  }

  init();
});