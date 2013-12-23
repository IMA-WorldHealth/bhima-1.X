angular.module('kpk.controllers').controller('patientRecordsController', function($scope, $q, $modal,  $routeParams, connect) {
    console.log("Patient Search init");

    var patient = ($routeParams.patientID || -1);
						
		
    function init() { 
      var promise = fetchRecords();

      $scope.patient_model = {};
      $scope.selected = null;
      $scope.patient_filter = {};

      promise
      .then(function(model) { 
        //FIXME configure locally, then expose
        
        //expose scope 
        $scope.patient_model = filterNames(model); //ng-grid
        //Select default
        if(patient>0) $scope.select(patient);

      }); 
    }

    function fetchRecords() { 
      var deferred = $q.defer();

      $scope.selected = {};

      connect.req({'tables' : {'patient' : {'columns' : ['id', 'first_name', 'last_name', 'dob', 'parent_name', 'sex', 'religion', 'marital_status', 'phone', 'email', 'addr_1', 'addr_2']}}})
        .then(function(model) {
        deferred.resolve(model);
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
      $scope.selected = $scope.patient_model.get(id);
    }

		$scope.patientCard = function() { 
			var cardModal = $modal.open({
				templateUrl: "cardModal.html",
				controller: function($scope, $modalInstance, patient) { 
					console.log("Selected patient", patient);
					//if(!!patient) close modal
					$scope.patient = patient;
				},
				resolve: { 
					patient: function() { return $scope.selected; }
				}
			});
		}

    init();
  });
