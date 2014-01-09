angular.module('kpk.controllers').controller('patientRecords', function($scope, $q, $modal,  $routeParams, connect, messenger, validate) {
    console.log("Patient Search init");

    var patient = ($routeParams.patientID || -1);			
    var requests = {};
    $scope.model = {};
    var dependencies = ['patient'];

    var patientQuery = {
      'tables' : {
        'patient' : {
          'columns' : ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2', 'location_id']
        }
      }
    };

    requests['patient'] = { 
      query: patientQuery,
      model: null,
      required: true
    }

    function init() { 

      fetchRequests()
      .then(function(res) { 
        
        //expose to scope
        dependencies.forEach(function(key) { 
          $scope.model[key] = filterNames(requests[key].model);
        });

        //Select default
        if(patient > 0) $scope.select(patient);
      });
    }

    function fetchRequests() { 
      var promiseList = [], deferred = $q.defer();

      //make requests
      dependencies.forEach(function(key) { 
        promiseList.push(connect.req(requests[key].query));     
      });
  
      //verify requests 
      $q.all(promiseList)
      .then(function(res) { 
        console.log('fetched all records');  
        
        //populate models
        dependencies.forEach(function(key, index) { 
          requests[key].model = res[index];
        });
        //run tests 
        validate.processModels(requests)
        .then(function(res) { 
          if(res.passed) { 
            deferred.resolve();
          } else { 
            //handle errors 
            messenger.push({type: 'info', msg: res.message}, 6000);
          }
        });

      }, function(err) { 
        messenger.push({type: 'danger', msg: 'Error fetching models: ' + err});  
      });
      return deferred.promise;
    }

    function filterNames(model) { 
      var d = model.data;
      for(var i=0, l=d.length; i<l; i++) { 
        d[i]["name"] = d[i].first_name + " " + d[i].last_name;
      }
      return model;
    }

    $scope.select = function(id) { 
      $scope.selected = $scope.model['patient'].get(id);
    }

		$scope.patientCard = function() { 
			var cardModal = $modal.open({
				templateUrl: "cardModal.html",
				controller: function($scope, $modalInstance, patient) { 
					console.log("Selected patient", patient);
					if(!patient) return; //close modal
					$scope.patient = patient;

					var age;
					var dateBirth = new Date(patient.dob);
					var dateCurrent = new Date();	
					
					//settup displayed dates	
					age = dateCurrent.getFullYear() - dateBirth.getFullYear();	
					$scope.patient.age = age;
				
					$scope.yearCurrent = dateCurrent.getFullYear();
					console.log('calc age', age);
				},
				resolve: { 
					patient: function() { return $scope.selected; }
				}
			});
		}

    init();
  });
